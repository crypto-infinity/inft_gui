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
app.get('/', (req, res) => {        //get requests to the root ("/") will route here
    res.sendFile('index.html', {root: __dirname});      //server responds by sending the index.html file to the client's browser
                      //the .sendFile method needs the absolute path to the file, see: https://expressjs.com/en/4x/api.html#res.sendFile 
});

app.post("/", (req, res) => {
    console.log(req.body);
    //res.sendFile('index.html', {root: __dirname}); 
    res.render('index');
});

app.post("/register", (req, res) => {
    console.log(req.body);
    res.render('register', {name: req.body.name, email: req.body.email, subject: req.body.subject, message: req.body.message});
});
