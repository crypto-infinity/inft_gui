//dependencies initialization
const {app,sql} = require("./initializer")
const authProvider = require('./auth/authProvider');
const { REDIRECT_URI, POST_LOGOUT_REDIRECT_URI } = require('./auth/authConfig');
const crypto = require('crypto');
const INFT = require("./utility.js");

//WebServer GET & POST Methods
app.get('/', (req, res) => {
    if(!req.session.isAuthenticated){
        res.render('index', { isAuthenticated: false });
    }
    else{
        res.redirect('app');
    }
});

app.get('/app', (req, res) => {
    if(!req.session.isAuthenticated){
        res.redirect('login');
    }
    else{
        if(req.session.authMethod != undefined){
            if(req.session.authMethod == "ms"){
                console.log(req.session.account);
                res.render('app', { isAuthenticated: req.session.isAuthenticated, username: req.session.username, userdata: JSON.stringify(req.session.account), error: false });
            }else if(req.session.authMethod == "mm"){
                res.render('app', { isAuthenticated: req.session.isAuthenticated, username: req.session.username, error: false });
            }
        }else{
            console.log("Error: " + err)
            req.session.destroy();
            res.render('error', {error: "Bad Session Parameters."})
        }
    }
});

/**
 * Authentication Methods
 */

app.get('/login', (req, res) => {
    if(!req.session.isAuthenticated){
        res.render('login', { isAuthenticated: false, error: false });
    }else{
        res.redirect('app');
    }
});

app.post('/signin/legacy', (req, res) => {
    if(!req.session.isAuthenticated){ //user is not authenticated already
        var request = new sql.Request();
        var username = req.body.username;
        var password = req.body.password;

        request.input('username',sql.VarChar, username);
        var query = "SELECT * FROM [SalesLT].Login WHERE username=@username";

        request.query(query, function (err, recordset) {
            if (err){ //handling DB errors
                console.log("Error: " + err)
                req.session.destroy();
                res.render('error', {error: err});
            }
            console.log(recordset);
            if(recordset.recordset.length > 0){
                var db_salt = recordset.recordset[0].salt;
                var local_hash = crypto.createHash("sha256").update(password+db_salt).digest('base64');

                if(local_hash == recordset.recordset[0].pwd_hash ){ //are hashes correct?
                    console.log("Username : " + username + " is authenticated!");
                    req.session.isAuthenticated = true; //create session here
                    req.session.username = username;
                    req.session.authMethod = "legacy";
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
        res.redirect('app');
    }
});

app.get('/signin/microsoft', (req,res) => {
    if(!req.session.isAuthenticated){
        authProvider.login(req,res);
    }else{
        res.redirect('app');
    }
});

app.post('/redirect', (req,res) => {
    if(!req.session.isAuthenticated){
        res.redirect('../login');
    }else{
        res.redirect('../app');
    }
});

app.post('/auth/redirect', (req,res) => {
    if(!req.session.isAuthenticated){
        authProvider.handleRedirect(req,res);
    }else{
        res.redirect('../app');
    }
});



// /**
//  * Dev purposes
//  */

// app.get('/redirect', (req,res) => {
//     authProvider.handleRedirect()
//     // if(!req.session.isAuthenticated){
//     //     res.redirect('../login');
//     // }else{
//     //     res.redirect('../app');
//     // }
// });

app.post('/register', (req, res) => {
    if(!req.session.isAuthenticated){
        var request = new sql.Request();
        var username = req.body.username;
        var password = req.body.password;

        request.input('username',sql.VarChar, username);
        var query = "SELECT * FROM [SalesLT].Login WHERE username=@username";

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

                var query = "INSERT INTO [SalesLT].Login (username,pwd_hash,salt) values (@username,@pwdhash,@salt)";
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
                    res.redirect('/app');
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

app.get('/signout', async (req,res) => {
    if(req.session.authMethod == "ms"){
        authProvider.logout(req,res);
    }else{
        req.session.destroy();
        res.redirect('/');
    }
});

app.post('/redirect', async () => {
    authProvider.handleRedirect();
});

app.post('/checkUser', async (req, res) => {
    if(!req.session.isAuthenticated){
        var request = new sql.Request();
        var username = req.body.username;

        request.input('username',sql.VarChar, username);
        var query = "SELECT * FROM [SalesLT].Login WHERE username=@username";

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


// //TEST DEV REFERENCE `'"

// app.get("/requests",(req, res) =>{

//     console.log(html);
//     res.send(html);
// })

// app.get('/register', (req, res) => {
//     res.render('register', {name: "notset", email: "notset", subject: "notset", message: "notset"});
// });
// app.get('/register', (req, res) => {
//     res.render('register', {name: "notset", email: "notset", subject: "notset", message: "notset"});
// });


// app.post("/register", (req, res) => {
//     try
//     {
//         console.log("Querying the DB...")
//         var request = new sql.Request();

//         var name = req.body.name;
//         var email = req.body.email;
//         var subject = req.body.subject;
//         var message = req.body.message;

//         request.input('name', sql.VarChar, name);
//         request.input('email', sql.VarChar, email);
//         request.input('subject', sql.VarChar, subject);
//         request.input('message', sql.VarChar, message);

//         var query = "INSERT INTO [SalesLT].Contact (name,email,subject,message) VALUES (@name,@email,@subject,@message)";

//         request.query(query, function (err, recordset) {
//             if (err){
//                 console.log("Error: " + err)
//                 res.render('error', {error: err});
//             }
//             // send records as a response, if any
//             console.log(recordset);
//             res.render('register', {name: name, email: email, subject: subject, message: message}); //generate register page with form-passed data
//         });
//     }
//     catch(err){
//         res.render('error', {error: err})
//     }
// });

// app.post("/requests", (req, res) =>{
//     var request = new sql.Request();
//     var query = "SELECT * FROM [SalesLT].Contact";
//     request.query(query, (err, recordset) => {
//         if (err){
//             console.log("Error: " + err)
//             res.render('error', {error: err});
//         }
//         res.render('requests', {_records: JSON.stringify(recordset.recordset)});
//     })
// })

// app.get("/requests", (req, res) =>{
//     var request = new sql.Request();
//     var query = "SELECT * FROM [SalesLT].Contact";
//     request.query(query, (err, recordset) => {
//         if (err){
//             console.log("Error: " + err)
//             res.render('error', {error: err});
//         }
//         res.render('requests', {_records: JSON.stringify(recordset.recordset)});
//     })
// })

        /*
        request.input('username',sql.VarChar, username);
        var query = "SELECT * FROM [SalesLT].Login WHERE username=@username";

        request.query(query, function (err, recordset) {
            if (err){ //handling DB errors
                console.log("Error: " + err)
                req.session.destroy();
                res.render('error', {error: err});
            }
            console.log(recordset);
            if(recordset.recordset.length > 0){ //does a user called 'username' exist? if yes, let's compare hashes
                var db_salt = recordset.recordset[0].salt;

                var local_hash = crypto.createHash("sha256").update(password+db_salt).digest('base64');
                console.log(local_hash);
                console.log(recordset.recordset[0].pwd_hash);
                if(local_hash == recordset.recordset[0].pwd_hash ){ //are hashes correct?
                    console.log("Username : " + username + " is authenticated!");
                    req.session.isAuthenticated = true; //create session here
                    req.session.username = username;
                    res.redirect('../app');
                }
                else{ //no, wrong password! moving you out (session.destroy should not be needed, but has been inserted as a security measure)
                    console.log("Operation illegal for : " + username + ". Logging out for security.");
                    req.session.destroy();
                    res.render('login', { isAuthenticated: false, error: true });
                }
            }else //user does not exist in the database, let's create and insert it into SQL!
            {
                console.log(username + " never inserted into database. Doing it now.");
                var salt = crypto.randomBytes(16).toString('base64'); //-ERROR
                var hash = crypto.createHash("sha256").update(password+salt).digest('base64');

                //request.input('username',sql.VarChar,username); -> already declared above
                request.input('pwdhash',sql.VarChar,hash);
                request.input('salt',sql.VarChar,salt);

                var query = "INSERT INTO [SalesLT].Login (username,pwd_hash,salt) values (@username,@pwdhash,@salt)";
                request.query(query, function(err, recordset){
                    if (err){
                        console.log("Error: " + err);
                        res.render('error', {error: err});
                    }
                    //user now exist, no hash to confront. let's directly authenticate it.
                    req.session.isAuthenticated = true; //create session here
                    req.session.username = username;
                    res.render('app', { isAuthenticated: true, username: username, error: false });
                });
            }
        });*/
