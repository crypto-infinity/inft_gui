//dependencies initialization
const {app,sql} = require("./initializer")
const authProvider = require('./auth/authProvider');
const { REDIRECT_URI, POST_LOGOUT_REDIRECT_URI } = require('./auth/authConfig');
const crypto = require('crypto');
const INFT_Library = require("./utility.js");

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
        res.render('app', { isAuthenticated: req.session.isAuthenticated, username: req.session.username, error: false });
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

app.post('/signin/legacy', async (req, res) => {
    if(!req.session.isAuthenticated){ //user is not authenticated already
        var username = req.body.username;
        var password = req.body.password;

        var db_users = await userExistinDB(username);
        console.log("Records in post method"+db_users);
        if(db_users != false){
            var db_salt = db_users.recordset[0].salt;
            var local_hash = crypto.createHash("sha256").update(password+db_salt).digest('base64');

            if(local_hash == db_users.recordset[0].pwd_hash ){ //are hashes correct?
                console.log("Username : " + username + " is authenticated!");
                req.session.isAuthenticated = true; //create session here
                req.session.username = username;
                res.redirect('../app');
            }else{
                console.log("Login failed for : " + username + ". Logging out for security.");
                req.session.destroy();
                res.render('login', { isAuthenticated: false, error: true });
            }            
        }else{
            console.log("Username " + username + " does not exist!");
            return "ciao";
        }

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

    }
    else{ //user is already authenticated, just render the app page with session data
        res.render('app', { isAuthenticated: req.session.isAuthenticated, username: username, error: false });
    }
});

app.get('/register', (req, res) => {
    if(!req.session.isAuthenticated){
        if(INFT_Library.userExistinDB(sql,req.body.username)){

        }

    }else{
        res.redirect('app');
    }
});

app.get('/signout', async (req,res) => {
    req.session.destroy();
    res.redirect('/');
    // authProvider.logout({
    //     postLogoutRedirectUri: authProvider.postLogoutRedirectUri
    // })
});

app.post('/redirect', async () => {
    authProvider.handleRedirect()
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

async function userExistinDB(username){
    var request = new sql.Request();

    request.input('username',sql.VarChar, username);
    var query = "SELECT * FROM [SalesLT].Login WHERE username=@username";

    request.query(query, function (err, recordset) {
        if (err){ //handling DB errors
            console.log("Error: " + err)
            req.session.destroy();
            res.render('error', {error: err});
        }
        console.log("Records in function:" + recordset);
        if(recordset.recordset.length > 0){ return recordset; }
        else{ return false; }
    });
}