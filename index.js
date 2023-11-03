/**
 * Dependencies Init
 */

const {app,io} = require("./init_express"); //Express Init
const {sql} = require("./init_sql"); //SQL Init
const { provider,signer,contract } = require('./init_web3'); //Web3 Endpoint Init
const { nftClient } = require('./init_nftstorage'); //NFT.storage client Object Init

const authProvider = require('./auth/microsoft_authProvider'); //MS Provider Init

/**
 * End Dependencies Init
 */

/**
 * Utilities Init
 */

const crypto = require('crypto'); //Cryptographic check of has/salts for legacy auth
const { setTimeout } = require("timers/promises");

/**
 * End Utilities Init
 */

/**
 * Websocket Listeners
 */

io.on('connection', function(client){
    var count = 0;
    console.log("Connected to WebSocket Server! Client: " + client.id);

    client.on('blockchain_task', async function(data){
        console.log("Blockchain event received from " + client.id + ". Beginning execution.");
        console.log("Data received: " + data.id);
        await setTimeout(10000);
        console.log("Blockchain event ID" + data.id + " finished!");
        client.emit('blockchain_task_finished',data);
        count++;
        //event.enqueue
        //wait for execution
        //return feedback
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
        res.redirect('app');
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
                res.render('app', { isAuthenticated: req.session.isAuthenticated, username: req.session.username, userdata: JSON.stringify(req.session.account), error: false });
            }else if(req.session.authMethod == "mm"){
                res.render('app', { isAuthenticated: req.session.isAuthenticated, username: req.session.username, userdata: "", error: false });
            }else if(req.session.authMethod == "legacy"){
                res.render('app', { isAuthenticated: req.session.isAuthenticated, username: req.session.username, userdata: "", error: false });
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
        res.send({
            username: req.session.username
        });
    }
});

//Mint Page route
app.post('/uploadNftImage', (req, res) => {
    if(!req.session.isAuthenticated){
        res.redirect('login');
    }else{
        //TO DO: upload image received and return its CID/URI
        var file_properties = req.body.post_file_properties;
        var file_contents = req.body.post_file_contents;

        console.log(file_properties);
        console.log(file_contents);

        res.send({
            file_properties: file_properties
        });
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
        var query = "SELECT * FROM [dbo].Login WHERE username=@username";

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
                    req.session.username = username;
                    req.session.authMethod = "legacy";
                    res.redirect('app');
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
        res.redirect('app');
    }
});

app.post('/register', (req, res) => {
    if(!req.session.isAuthenticated){
        var request = new sql.Request();
        var username = req.body.username;
        var password = req.body.password;

        request.input('username',sql.VarChar, username);
        var query = "SELECT * FROM [dbo].Login WHERE username=@username";

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

                var query = "INSERT INTO [dbo].Login (username,pwd_hash,salt) values (@username,@pwdhash,@salt)";
                request.query(query, function(err, recordset){
                    if (err){ //handling DB errors
                        console.log("Error: " + err)
                        req.session.destroy();
                        res.render('error', {error: err});
                    }
                    //user now exist, no hash to confront. let's directly authenticate it.
                    console.log("User " + username + " is created and authenticated!");
                    req.session.isAuthenticated = true; //create session here
                    req.session.authMethod = "legacy";
                    req.session.username = username;
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
        authProvider.handleRedirect(req,res);
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