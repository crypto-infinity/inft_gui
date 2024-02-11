const crypto = require('crypto'); //Cryptographic check of has/salts for legacy auth
const msal = require('@azure/msal-node');
const axios = require('axios');
const { msalConfig, TENANT_SUBDOMAIN, REDIRECT_URI, POST_LOGOUT_REDIRECT_URI } = require('./microsoft_authConfig');

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

class AuthProvider {
    config;
    cryptoProvider;

    constructor(config) {
        this.config = config;
        this.cryptoProvider = new msal.CryptoProvider();
    }

    getMsalInstance(msalConfig) {
        return new msal.ConfidentialClientApplication(msalConfig);
    }

    async login(req, res, next, options = {}) {
        // create a GUID for crsf
        req.session.csrfToken = this.cryptoProvider.createNewGuid();

        /**
         * The MSAL Node library allows you to pass your custom state as state parameter in the Request object.
         * The state parameter can also be used to encode information of the app's state before redirect.
         * You can pass the user's state in the app, such as the page or view they were on, as input to this parameter.
         */
        const state = this.cryptoProvider.base64Encode(
            JSON.stringify({
                csrfToken: req.session.csrfToken,
                redirectTo: '/',
            })
        );

        const authCodeUrlRequestParams = {
            state: state,

            /**
             * By default, MSAL Node will add OIDC scopes to the auth code url request. For more information, visit:
             * https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
             */
            scopes: [],
        };

        const authCodeRequestParams = {
            state: state,

            /**
             * By default, MSAL Node will add OIDC scopes to the auth code request. For more information, visit:
             * https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
             */
            scopes: [],
        };

        /**
         * If the current msal configuration does not have cloudDiscoveryMetadata or authorityMetadata, we will
         * make a request to the relevant endpoints to retrieve the metadata. This allows MSAL to avoid making
         * metadata discovery calls, thereby improving performance of token acquisition process.
         */
        if (!this.config.msalConfig.auth.authorityMetadata) {
            const authorityMetadata = await this.getAuthorityMetadata();
            this.config.msalConfig.auth.authorityMetadata = JSON.stringify(authorityMetadata);
        }

        const msalInstance = this.getMsalInstance(this.config.msalConfig);

        // trigger the first leg of auth code flow
        return this.redirectToAuthCodeUrl(
            req,
            res,
            next,
            authCodeUrlRequestParams,
            authCodeRequestParams,
            msalInstance
        );
    }

    

    async handleRedirect(req, res, next, sql) {
        const authCodeRequest = {
            ...req.session.authCodeRequest,
            code: req.body.code, // authZ code
            codeVerifier: req.session.pkceCodes.verifier, // PKCE Code Verifier
        };

        try {
            const msalInstance = this.getMsalInstance(this.config.msalConfig);
            msalInstance.getTokenCache().deserialize(req.session.tokenCache);

            const tokenResponse = await msalInstance.acquireTokenByCode(authCodeRequest, req.body);

            req.session.tokenCache = msalInstance.getTokenCache().serialize();
            req.session.idToken = tokenResponse.idToken;
            req.session.account = tokenResponse.account;
            req.session.username = tokenResponse.account.name;

            const state = JSON.parse(this.cryptoProvider.base64Decode(req.body.state));

            //INFT first MS login check -> query to db
            var request = new sql.Request();
            var username = req.session.username;
            var password = makeid(20);
    
            request.input('username',sql.VarChar, username);
            var query = "SELECT [dbo].Login.id,username,pwd_hash,salt,isExternal,wallet FROM [dbo].Login LEFT JOIN [dbo].Web3 ON [dbo].Login.id=[dbo].Web3.external_id WHERE dbo.Login.username=@username AND isExternal=1";
    
            request.query(query, function (err, recordset) {
                if (err){ //handling DB errors
                    console.log("Error: " + err)
                    req.session.destroy();
                    res.render('error', {error: err});
                }
                if(recordset.recordset.length == 0){ //User never logged in, inserting into DB and setting session variables
                    console.log(username + " never logged with Microsoft authentication. Inserting in DB now.");
                    var salt = crypto.randomBytes(16).toString('base64');
                    var hash = crypto.createHash("sha256").update(password+salt).digest('base64');

                    request.input('pwdhash',sql.VarChar,hash);
                    request.input('salt',sql.VarChar,salt);

                    var query = "INSERT INTO [dbo].Login (username,pwd_hash,salt,isExternal) values (@username,@pwdhash,@salt,1)";
                    request.query(query, function(err, recordset){
                        if (err){ //handling DB errors
                            console.log("Error: " + err)
                            req.session.destroy();
                            res.render('error', {error: err});
                        }
                        //user now exist, no hash to confront. let's directly authenticate it.
                        console.log("User " + username + " is created using MS auth and authenticated!");

                        //set Express Session variables
                        req.session.isAuthenticated = true;
                        req.session.userId = recordset.insertId;
                        console.log("User id recordset insert:  " + recordset.insertId);
                        req.session.authMethod = "ms";
                        req.session.doSetup = true;

                        //redirect user to the main page
                        res.redirect(state.redirectTo);
                    });
                }
                else{ //External User already exist, authenticating and setting session variables
                    
                    console.log("User " + username + " exists already. Authenticating.");

                    //set Express Session variables
                    req.session.isAuthenticated = true;
                    req.session.userId = recordset.recordset[0].id;
                    req.session.wallet = recordset.recordset[0].wallet;
                    req.session.authMethod = "ms";

                    //Check if user inserted his wallet
                    if(recordset.recordset[0].wallet == "" || 
                        recordset.recordset[0].wallet == "null" || 
                        recordset.recordset[0].wallet == null){

                        req.session.doSetup = true;
                    }else{
                        req.session.doSetup = false;
                    }


                    //redirect user to the main page
                    res.redirect(state.redirectTo);
                }
                
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        /**
         * Construct a logout URI and redirect the user to end the
         * session with Azure AD. For more information, visit:
         * https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc#send-a-sign-out-request
         */
        //const logoutUri = `${this.config.msalConfig.auth.authority}${TENANT_SUBDOMAIN}.onmicrosoft.com/oauth2/v2.0/logout?post_logout_redirect_uri=${this.config.postLogoutRedirectUri}`;
        const logoutUri = `${this.config.msalConfig.auth.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${this.config.postLogoutRedirectUri}`;
        console.log(logoutUri);

        req.session.destroy(() => {
            res.redirect(logoutUri);
        });
    }

    /**
     * Prepares the auth code request parameters and initiates the first leg of auth code flow
     * @param req: Express request object
     * @param res: Express response object
     * @param next: Express next function
     * @param authCodeUrlRequestParams: parameters for requesting an auth code url
     * @param authCodeRequestParams: parameters for requesting tokens using auth code
     */
    async redirectToAuthCodeUrl(req, res, next, authCodeUrlRequestParams, authCodeRequestParams, msalInstance) {
        // Generate PKCE Codes before starting the authorization flow
        const { verifier, challenge } = await this.cryptoProvider.generatePkceCodes();

        // Set generated PKCE codes and method as session vars
        req.session.pkceCodes = {
            challengeMethod: 'S256',
            verifier: verifier,
            challenge: challenge,
        };

        /**
         * By manipulating the request objects below before each request, we can obtain
         * auth artifacts with desired claims. For more information, visit:
         * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationurlrequest
         * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationcoderequest
         **/

        req.session.authCodeUrlRequest = {
            ...authCodeUrlRequestParams,
            redirectUri: this.config.redirectUri,
            responseMode: 'form_post', // recommended for confidential clients
            codeChallenge: req.session.pkceCodes.challenge,
            codeChallengeMethod: req.session.pkceCodes.challengeMethod,
        };

        req.session.authCodeRequest = {
            ...authCodeRequestParams,
            redirectUri: this.config.redirectUri,
            code: '',
        };

        try {
            const authCodeUrlResponse = await msalInstance.getAuthCodeUrl(req.session.authCodeUrlRequest);
            res.redirect(authCodeUrlResponse);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Retrieves oidc metadata from the openid endpoint
     * @returns
     */
    async getAuthorityMetadata() {
        //const endpoint = `${this.config.msalConfig.auth.authority}${TENANT_SUBDOMAIN}.onmicrosoft.com/v2.0/.well-known/openid-configuration`;
        const endpoint = `${this.config.msalConfig.auth.authority}/v2.0/.well-known/openid-configuration`;
        console.log(endpoint);

        try {
            const response = await axios.get(endpoint);
            return await response.data;
        } catch (error) {
            console.log(error);
        }
    }
}

const authProvider = new AuthProvider({
    msalConfig: msalConfig,
    redirectUri: REDIRECT_URI,
    postLogoutRedirectUri: POST_LOGOUT_REDIRECT_URI,
});

module.exports = authProvider;