//dependencies initialization
const express = require('express');
const bodyParser = require("body-parser");
const sql = require("mssql");
var count = 0;

// sqlconfig for your database
var sqlconfig = {
    server: 'htc-demo.database.windows.net', 
    database: 'htc-demo',
    authentication: {
        type: 'azure-active-directory-default'//DA RIVEDERE
    },
    trustServerCertificate: false //self-signed cert error
};

// connect to your database
sql.connect(sqlconfig, function (err) {
    if (err){
        throw err;
    } 
    console.log(`Connected to DB: ${sqlconfig.server}`);
});

//webserver initialization
const app = express();              
const port = 5000;

//webserver listener and registrations
app.listen(port, () => { console.log(`Now listening on port ${port}`); }); //webserver listener
app.set('view engine', 'ejs');

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true }))

//get & post methods
app.get('/', (req, res) => {
    res.render('index');      
});

app.post("/", (req, res) => {
    console.log(req.body);
    res.render('index');
});

app.post("/register", (req, res) => {
    try
    {
        console.log("Querying the DB...")
        var request = new sql.Request();

        var name = req.body.name;
        var email = req.body.email;
        var subject = req.body.subject;
        var message = req.body.message;

        //var query = 'SELECT * FROM SalesLT.Address'; //DB Query - NON FUNGE
        var query = `INSERT INTO [dbo].test VALUES ('${count}', '${name}', '${email}', '${subject}', '${message}')`;
        request.query(query, function (err, recordset) { 
            if (err){
                console.log("Error: " + err)
                res.render('./index');
                throw err;
            } 
            count++;
            // send records as a response, if any
            console.log(recordset);
            res.render('register', {name: name, email: email, subject: subject, message: message}); //generate register page with form-passed data
        });
    }
    catch(error){}
});

app.post("/requests", (req, res) =>{
    var request = new sql.Request();
    var query = `SELECT * FROM [dbo].test`;
    request.query(query, (err, recordset) => {
        if (err){
            console.log("Error: " + err)
            res.render('./index');
            throw err;
        }
        console.log(recordset.recordset.length);
    })
})

//TEST DEV REFERENCE

app.get('/register', (req, res) => {
    res.render('register', {name: "notset", email: "notset", subject: "notset", message: "notset"});     
});
app.get('/register', (req, res) => {
    res.render('register', {name: "notset", email: "notset", subject: "notset", message: "notset"});     
});