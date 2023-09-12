//dependencies initialization
const express = require('express');
const bodyParser = require("body-parser");

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
    console.log(req.body);
    res.render('register', {name: req.body.name, email: req.body.email, subject: req.body.subject, message: req.body.message});
});

//TEST DEV REFERENCE

// app.get('/register', (req, res) => {
//     res.render('register', {name: "notset", email: "notset", subject: "notset", message: "notset"});     
// });