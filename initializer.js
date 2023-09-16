/**
* Webserver initialization, based on Express framework
*/
const express = require('express');
const bodyParser = require("body-parser");

//webserver initialization
const app = express();              
const port = 443; //WebServer Port

try {
    //webserver listener and registrations
    app.listen(port, () => { console.log(`Now listening on port ${port}`); });
    
    app.set('view engine', 'ejs');
    app.use(express.static(__dirname));
    app.use(bodyParser.urlencoded({ extended: true }))
} catch (err) {
    throw err;
}

/**
* MS SQL Server Connection initialization, based on mssql and tedious
* and on DefaultAzureCredential login stack
*/
const sql = require("mssql");

require('dotenv').config(); //Import .env 
const { SQL_DB_SERVER, SQL_DB_NAME, SQL_CLIENT_ID } = process.env;

// sqlconfig
var sql_config = {
    server: SQL_DB_SERVER, 
    database: SQL_DB_NAME,
    authentication: {
        type: 'azure-active-directory-default',
        options: {
            clientId: SQL_CLIENT_ID
        }
    },
    trustServerCertificate: false //self-signed cert error
};


sql.connect(sql_config, function (err) {
    if(err) { console.log(err); }
    console.log(`Connected to DB: ${sql_config.server}`);
});

module.exports = {
    app,
    sql
}; //Exports the app instance