//dependencies initialization
const {app,sql} = require("./initializer")
const authProvider = require('./auth/authProvider');
const { REDIRECT_URI, POST_LOGOUT_REDIRECT_URI } = require('./auth/authConfig');
const async = require("hbs/lib/async");

function isAuthenticated(req, res, next) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/auth/signin'); // redirect to sign-in route
    }

    next();
};

//WebServer GET & POST Methods
app.get('/', (req, res) => {
    res.render('index');      
});

/**
 * , {
        isAuthenticated: req.session.isAuthenticated,
        username: req.session.account?.username
    }
 */

app.post("/register", (req, res) => {
    try
    {
        console.log("Querying the DB...")
        var request = new sql.Request();

        var name = req.body.name;
        var email = req.body.email;
        var subject = req.body.subject;
        var message = req.body.message;

        request.input('name', sql.VarChar, name);
        request.input('email', sql.VarChar, email);
        request.input('subject', sql.VarChar, subject);
        request.input('message', sql.VarChar, message);

        var query = "INSERT INTO [SalesLT].Contact (name,email,subject,message) VALUES (@name,@email,@subject,@message)";

        request.query(query, function (err, recordset) { 
            if (err){
                console.log("Error: " + err)
                res.render('error', {error: err});
            } 
            // send records as a response, if any
            console.log(recordset);
            res.render('register', {name: name, email: email, subject: subject, message: message}); //generate register page with form-passed data
        });
    }
    catch(err){
        res.render('error', {error: err})
    }
});

app.post("/requests", (req, res) =>{
    var request = new sql.Request();
    var query = "SELECT * FROM [SalesLT].Contact";
    request.query(query, (err, recordset) => {
        if (err){
            console.log("Error: " + err)
            res.render('error', {error: err});
        }
        res.render('requests', {_records: JSON.stringify(recordset.recordset)});
    })
})

app.get("/requests", (req, res) =>{
    var request = new sql.Request();
    var query = "SELECT * FROM [SalesLT].Contact";
    request.query(query, (err, recordset) => {
        if (err){
            console.log("Error: " + err)
            res.render('error', {error: err});
        }
        res.render('requests', {_records: JSON.stringify(recordset.recordset)});
    })
})

/**
 * MS Authentication Methods
 */

app.get('/login-form', (req, res) => {
    res.render('login-form');
});

app.post('/signin/legacy', (req, res) => {
    var username = req.body.name;
    var password = req.body.password;

    console.log(username, password);
    res.render('index');
    //TO DO
});

app.get('/signout', async () => {
    authProvider.logout({
        postLogoutRedirectUri: authProvider.postLogoutRedirectUri
    })
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