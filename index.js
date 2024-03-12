/**
 * Dependencies Init
 */

const {app,io} = require("./init_express"); //Express Init
const {sql} = require("./init_sql"); //SQL Init
const { provider,signer,contract } = require('./init_web3'); //Web3 Endpoint Init
const { nftClient, File, Blob } = require('./init_nftstorage'); //NFT.storage client Object Init

const authProvider = require('./auth/microsoft_authProvider'); //MS Provider Init

/**
 * End Dependencies Init
 */

/**
 * Utilities Init
 */

const crypto = require('crypto'); //Cryptographic check of has/salts for legacy auth
const { setTimeout } = require("timers/promises");
var ethers_utils = require('ethers').utils;

/**
 * End Utilities Init
 */

/**
 * Websocket Listeners
 */

io.on('connection', function(client){
    const session = client.request.session; //Getting Express session values

    console.log("Connected to WebSocket Server! Client: " + client.id);

    /** NFT Mint Socket Listeners */

    client.on('mint_nft', async function(data, callback){
        if(!session.isAuthenticated){
            client.emit('error_handler',"User not authenticated!");
            return;
        }
        console.log("Blockchain event received from " + client.id + ". Beginning execution.");

        try{   
            //Uploading the NFT Metadata to Filecoin
            console.log("Converting NFT Image...");

            const image_base64 = Buffer.from(data.nftImage).toString('base64');
            const image_blob = b64toBlob(image_base64,data.nftImageType);
            const image_file = new File([image_blob], data.nftName , { type: data.nftImageType });

            //Building and uploading NFT object for NFT.Storage API
            console.log("Building and Uploading NFT Client info...");
            const nft = {
                image: image_file, 
                name: data.nftName,
                description: data.nftDescription,
                external_url: data.nftUrl,
                animation_url: data.nftAnimationVideo
            }
            var metadata = await nftClient.store(nft);
            //console.log(metadata);

            //Upload result check
            if(metadata){ console.log("Metadata: " + metadata.toString()); }
            else{
                console.log("Metadata Upload Error!");
                var result = {
                    id: data.id,
                    error: "METADATA_UPLOAD_ERROR"
                }
                callback(result);
            }

            var request = new sql.Request();
            var query = "SELECT current_value FROM sys.sequences WHERE name='nftCounter'";

            request.query(query, async function (err, recordset) {
                //Get current nft counter
                const counter = recordset.recordset[0].current_value;

                //Building and sending Transaction to Blockchain
                console.log("Minting NFT to Wallet " + session.wallet);
                var tx = await contract.mintToken(session.wallet,counter,data.nftAmount,metadata.url,data.nftBurnable,data.nftMutable);
                var tx2 = tx.wait();

                //Transaction health check
                if(!tx2){
                    console.log("NFT Minting Error");
                    var result = {
                        id: data.id,
                        error: "NFT_MINT_ERROR"
                    }
                    callback(result);
                }

                var request_2 = new sql.Request();
                var query_2 = "SELECT NEXT VALUE FOR dbo.nftCounter";

                request_2.query(query_2, async function (err, recordset) {
                    //If everything else was okay, give green light to user! 
                    console.log("Blockchain event ID" + data.id + " finished!");

                    var result = {
                        id: data.id,
                        error: "none",
                        transaction: tx
                    }
                    callback(result);//Execute callback on client
                });
            });
        }
        catch(err){
            //If any error showed up, notify the client
            console.log("Blockchain event ID" + data.id + " failed! Notifying user");
            var result = {
                id: data.id,
                error: "NFT_MINT_ERROR",
                message: err
            }
            callback(result);
        }
    });

    /** Profile Socket Listeners */

    client.on('profile_setup', async function(data, callback){
        if(!session.isAuthenticated){
            client.emit('error_handler',"User not authenticated!");
            return;
        }
        try{
            var request = new sql.Request();
            var profile_image = data.image;
            var description = data.description;

            request.input('profile_image',sql.Image, profile_image);
            request.input('description',sql.VarChar, description);
            request.input('userId',sql.Int,session.userId);//userId


            var query = "UPDATE [dbo].Login SET profile_image=@profile_image, description=@description WHERE id=@userId";

            request.query(query, function (err, recordset) {
                //Send callback to client with DONE status
                callback("STATUS_PROFILE_SETUP_DONE");
            });
        }
        catch(err){
            console.log("Error: " + err)
            session.destroy();
            callback("STATUS_PROFILE_SETUP_ERROR");
        }
    })

    client.on('profile_update', async function(data, callback){
        if(!session.isAuthenticated){
            client.emit('error_handler',"User not authenticated!");
            return;
        }
        try{
            var request = new sql.Request();

            request.input('userId',sql.Int,session.userId); //userId
            
            var query = "SELECT profile_image FROM [dbo].Login WHERE id=@userId";
    
            request.query(query, function (err, recordset) {
                
                var profilepicbuffer = recordset.recordset[0].profile_image;

                if(profilepicbuffer == undefined || profilepicbuffer == "" || profilepicbuffer == null){
                    callback("STATUS_PROFILE_PICTURE_NULL");
                    return;
                }

                callback(profilepicbuffer);
                return;
            });
        }
        catch(err){
            console.log("Error: " + err)
            session.destroy();
            res.render('error', {error: err});
        }
    });
});

/**
 * End Websocket Listeners (Socket.IO)
 */

/**
 * Webserver Main Routes (Express)
 */

//Default Website route
app.get('/', (req, res) => {
    if(!req.session.isAuthenticated){
        res.render('index', { isAuthenticated: false });
    }
    else{
        res.render('index', { isAuthenticated: true });
    }
});

//Web App route, handles redirect phase after login
app.get('/app', (req, res) => {
    if(!req.session.isAuthenticated){
        res.redirect('login');
    }
    else{
        if(req.session.authMethod != undefined){
            if(req.session.authMethod == "ms"){
                //console.log(req.session.account);
                res.render('app', { isAuthenticated: req.session.isAuthenticated, username: req.session.username, 
                    userdata: JSON.stringify(req.session.account), doSetup: req.session.doSetup, wallet: req.session.wallet, error: false });

            }else if(req.session.authMethod == "mm"){
                res.render('app', { isAuthenticated: req.session.isAuthenticated, username: req.session.username, 
                    userdata: "", doSetup: req.session.doSetup, wallet: req.session.wallet, error: false });
                    
            }else if(req.session.authMethod == "legacy"){
                res.render('app', { isAuthenticated: req.session.isAuthenticated, username: req.session.username, 
                    userdata: "", doSetup: req.session.doSetup, wallet: req.session.wallet, error: false });
            }
        }else{
            console.log("Error: " + err)
            req.session.destroy();
            res.render('error', {error: "Bad Session Parameters."})
        }
    }
});


//Mainpage route, defaults to main.ejs
app.get('/main', (req, res) => {
    if(!req.session.isAuthenticated){
        res.redirect('login');
    }else{
        res.send({ 
            isAuthenticated: req.session.isAuthenticated, 
            username: req.session.username, 
            userdata: JSON.stringify(req.session.account), 
            error: false 
        });
    }
});

//Mainpage Wallet Setup route
app.post('/walletSetup', (req, res) => {
    if(!req.session.isAuthenticated){
        res.redirect('login');
    }else{
        try{
            var request = new sql.Request();
            request.input('wallet',sql.VarChar, req.body.wallet);
            request.input('id',sql.Int, req.session.userId);

            var query = `
            IF EXISTS (SELECT external_id FROM [dbo].Web3 WHERE external_id = @id)
                BEGIN
                    UPDATE [dbo].Web3
                    SET wallet = @wallet
                    WHERE external_id = @id
                END
                ELSE
                BEGIN
                    INSERT INTO [dbo].Web3 (external_id,wallet)
                    VALUES (@id,@wallet)
                END
            `;

            request.query(query, (err,recordset) => {
                if (err){ //handling DB errors
                    console.log("Error: " + err)
                    req.session.destroy();
                    res.render('error', {error: err});
                    return;
                }
                console.log("User ID " + req.session.userId + " has is Web3 Wallet Set!");
                req.session.doSetup = false;
                req.session.wallet = req.body.wallet;
                res.setHeader("INFT_STATUS_MESSAGE","STATUS_WALLET_SETUP_DONE");
                res.status(204).send();
            })
        }
        catch(error){
            console.log("Error: " + err)
            res.setHeader("INFT_STATUS_MESSAGE","ERR_WALLET_SETUP_FAILED");
            req.session.destroy();
            res.status(204).send();
        }
    }
});

//Profile page Route
app.get('/profile', (req, res) => {
    if(!req.session.isAuthenticated){
        res.redirect('login');
    }else{
        res.send({
            username: req.session.username
        });
    }
});

//Mint Page route
app.get('/mint', (req, res) => {
    if(!req.session.isAuthenticated){
        res.redirect('login');
    }else{
        if(!req.session.wallet){
            res.setHeader("INFT_ERROR_MESSAGE","ERR_WALLET_NOT_SET");
            res.status(204).send();
            return;
        }
        res.send({
            username: req.session.username
        });
    }
});

//My NFTs Page route
app.get('/nfts', async (req, res) => {
    if(!req.session.isAuthenticated){
        res.redirect('login');
    }else{
        if(!req.session.wallet){
            res.setHeader("INFT_ERROR_MESSAGE","ERR_WALLET_NOT_SET");
            res.status(204).send();
            return;
        }
        try{
            //Elaborate user NFTs and return them to the GET call
            var call = await contract.getTokenMappings(req.session.wallet);

            var token_uris = [];

            for(var i = 0; i < call.length; i++){
                token_uris[i] = await contract.uri(call[i].toNumber());
            }

            res.send({
                usernfts: token_uris //array?
            });
        }
        catch(err){
            console.log("Error: " + err)
            req.session.destroy();
            res.render('error', {error: "Bad Query Results."})
        }
    }
});

/**
 * End Webserver Main Routes (Express)
 */

/**
 * Login form route
 */

app.get('/login', (req, res) => {
    if(!req.session.isAuthenticated){
        res.render('login', { isAuthenticated: false, error: false });
    }else{
        res.redirect('app');
    }
});

/**
 * End Login form route
 */

/**
 * Legacy sign-in & register
 */

app.post('/signin/legacy', (req, res) => {
    if(!req.session.isAuthenticated){ //user is not authenticated already
        var request = new sql.Request();
        var username = req.body.username;
        var password = req.body.password;

        request.input('username',sql.VarChar, username);
        //var query = "SELECT * FROM [dbo].Login WHERE username=@username";
        var query = "SELECT [dbo].Login.id,username,pwd_hash,salt,isExternal,wallet FROM [dbo].Login LEFT JOIN [dbo].Web3 ON [dbo].Login.id=[dbo].Web3.external_id WHERE dbo.Login.username=@username AND isExternal=0";

        request.query(query, function (err, recordset) {
            if (err){ //handling DB errors
                console.log("Error: " + err)
                req.session.destroy();
                res.render('error', {error: err});
            }
            //console.log(recordset);
            if(recordset.recordset.length > 0){
                var db_salt = recordset.recordset[0].salt;
                var local_hash = crypto.createHash("sha256").update(password+db_salt).digest('base64');

                if(local_hash == recordset.recordset[0].pwd_hash ){ //are hashes correct?
                    console.log("Username : " + username + " is authenticated!");
                    req.session.isAuthenticated = true; //create session here
                    req.session.userId = recordset.recordset[0].id;
                    
                    req.session.username = username;
                    req.session.authMethod = "legacy";

                    //Check if user inserted his wallet
                    if(recordset.recordset[0].wallet == "" || 
                    recordset.recordset[0].wallet == "null" || 
                    recordset.recordset[0].wallet == null){
                        
                        req.session.doSetup = true;
                    }else{
                        req.session.doSetup = false;
                        req.session.wallet = recordset.recordset[0].wallet;
                    }

                    res.redirect('/app');
                }else{
                    console.log("Login failed for : " + username + ". Logging out for security.");
                    req.session.destroy();
                    res.setHeader("INFT_ERROR_MESSAGE","ERR_WRONG_PASSWORD");
                    res.status(204).send();
                }
            }else{
                console.log("Username " + username + " does not exist!");
                res.setHeader("INFT_ERROR_MESSAGE","ERR_USER_NOT_EXISTENT");
                res.status(204).send();
            }
        });
    }
    else{ //user is already authenticated, just render the app page with session data
        res.redirect('/app');
    }
});

app.post('/register', (req, res) => {
    if(!req.session.isAuthenticated){
        var request = new sql.Request();
        var username = req.body.username;
        var password = req.body.password;

        request.input('username',sql.VarChar, username);
        var query = "SELECT [dbo].Login.id,username,pwd_hash,salt,isExternal,wallet FROM [dbo].Login LEFT JOIN [dbo].Web3  ON [dbo].Login.id=[dbo].Web3.external_id WHERE dbo.Login.username=@username AND isExternal=0";

        request.query(query, function (err, recordset) {
            if (err){ //handling DB errors
                console.log("Error: " + err)
                req.session.destroy();
                res.render('error', {error: err});
            }
            if(recordset.recordset.length == 0){//user does not exist, query result empty
                console.log(username + " never inserted into database. Doing it now.");
                var salt = crypto.randomBytes(16).toString('base64');
                var hash = crypto.createHash("sha256").update(password+salt).digest('base64');

                request.input('pwdhash',sql.VarChar,hash);
                request.input('salt',sql.VarChar,salt);

                var query = "INSERT INTO [dbo].Login (username,pwd_hash,salt,isExternal) values (@username,@pwdhash,@salt,0)";
                request.query(query, function(err, recordset){
                    if (err){ //handling DB errors
                        console.log("Error: " + err)
                        req.session.destroy();
                        res.render('error', {error: err});
                    }
                    //user now exist, no hash to confront. let's directly authenticate it.
                    console.log("User " + username + " is created and authenticated!");
                    req.session.isAuthenticated = true; //create session here
                    req.session.userId = recordset.insertId;
                    console.log("User id recordset insert:  " + recordset.insertId);
                    req.session.authMethod = "legacy";
                    req.session.username = username;
                    req.session.doSetup = true;

                    res.redirect('app');
                });
            }else{
                if(recordset.recordset.length != 0){
                    console.log("Username " + username + " already registered!");
                    res.setHeader("INFT_ERROR_MESSAGE","ERR_USER_ALREADY_REGISTERED");
                    res.status(204).send();
                    //response.writeHead(200, {'Content-Type': 'application/json'}); Both at the same time
                };
            }
            if(recordset.recordset.length == undefined){
                console.log("Error!")
                req.session.destroy();
                res.render('error', {error: "Bad query result."});
            }
        });

    }else{
        res.redirect('app');
    }
});

/**
 * End Legacy sign-in & register
 */

/**
 * Microsoft Entra ID Provider sign-in
 */

app.get('/signin/microsoft', (req,res) => {
    if(!req.session.isAuthenticated){
        authProvider.login(req,res);
    }else{
        res.redirect('app');
    }
});

app.post('/auth/redirect', (req,res) => {
    if(!req.session.isAuthenticated){
        authProvider.handleRedirect(req,res, () => {
            res.render('error', {error: "Authentication failed, please try again!"});
        }, sql);
    }else{
        res.redirect('app');
    }
});

app.get('/signout', async (req,res) => {
    if(req.session.authMethod == "ms"){
        authProvider.logout(req,res);
    }else{
        req.session.destroy();
        res.redirect('/');
    }
});

// app.post('/redirect', async (req,res) => {
//     authProvider.handleRedirect(req,res);
// });

/**
 * End Microsoft Entra ID Provider sign-in
 */

/**
 * API Routes Definition
 */

app.post('/checkUser', async (req, res) => {
    if(!req.session.isAuthenticated){
        var request = new sql.Request();
        var username = req.body.username;

        request.input('username',sql.VarChar, username);
        var query = "SELECT * FROM [dbo].Login WHERE username=@username";

        request.query(query, function (err, recordset) {
            if (err){ //handling DB errors
                console.log("Error: " + err)
                req.session.destroy();
                res.render('error', {error: err});
            }
            if(recordset.recordset.length == 0){
                console.log("Username " + username + " does not exist!");
                res.setHeader("INFT_STATUS_MESSAGE","STATUS_USER_NOT_EXISTENT");
                res.status(204).send();
            }else if(recordset.recordset.length != 0){
                console.log("Username " + username + " already registered!");
                res.setHeader("INFT_STATUS_MESSAGE","STATUS_USER_ALREADY_REGISTERED");
                res.status(204).send();
            }else{
                console.log("Error!")
                req.session.destroy();
                res.render('error', {error: "Bad query result."});
            }
        });
    }else{
        res.redirect('app');
    }
});

/**
 * End API Routes Definition
 */

function b64toBlob(base64Data, contentType) {
    contentType = contentType || '';
    var sliceSize = 512;
    var byteCharacters = atob(base64Data);
    var bytesLength = byteCharacters.length;
    var slicesCount = Math.ceil(bytesLength / sliceSize);
    var byteArrays = new Array(slicesCount);

    for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        var begin = sliceIndex * sliceSize;
        var end = Math.min(begin + sliceSize, bytesLength);

        var bytes = new Array(end - begin);
        for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
}