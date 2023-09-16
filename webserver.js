/**
 * Webserver initialization, based on Express framework
 */

const express = require('express');
const bodyParser = require("body-parser");

//webserver initialization
const app = express();              
const port = 80; //WebServer Port

//webserver listener and registrations
app.listen(port, () => { console.log(`Now listening on port ${port}`); });
app.set('view engine', 'ejs');

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true }))

module.exports = app; //Exports the app instance