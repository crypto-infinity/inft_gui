/**
* Webserver initialization, based on Express framework
*/
const express = require('express');
const bodyParser = require("body-parser");
const sessions = require('express-session');

//webserver initialization
const app = express();              
const port = 80; //WebServer Port

const oneDay = 1000 * 60 * 60 * 24;

try {
    //webserver listener and registrations
    app.listen(port, () => { console.log(`Now listening on port ${port}`); });
    
    
    app.set('views', './views');
    app.set('view engine', 'ejs');
    app.use(express.static(__dirname));
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(sessions({
        secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
        saveUninitialized:true,
        cookie: { maxAge: oneDay },
        resave: false
    }));
} catch (err) {
    throw err;
}

/**
* MS SQL Server Connection initialization, based on mssql and tedious
*/
const sql = require("mssql");
const session = require('express-session');

require('dotenv').config(); //Import .env 
const { SQL_DB_SERVER, SQL_DB_NAME, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID } = process.env;

// sqlconfig
var sql_config = {
    server: SQL_DB_SERVER, 
    database: SQL_DB_NAME,
    authentication: {
        type: 'azure-active-directory-service-principal-secret',
        options: {
            clientId: AZURE_CLIENT_ID,
            clientSecret: AZURE_CLIENT_SECRET,
            tenantId: AZURE_TENANT_ID
        }
    },
    trustServerCertificate: false, //self-signed cert error
    options: {
        connectTimeout: 35000
    }
};


sql.connect(sql_config, function (err) {
    if(err) { console.log(err); }
    else { console.log(`Connected to DB: ${sql_config.server}`); }
});

module.exports = {
    app,
    sql
}; //Exports the app instance