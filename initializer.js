/**
* Webserver initialization, based on Express framework
*/
const express = require('express');
const bodyParser = require("body-parser");
const sessions = require('express-session');
const { Server } = require("socket.io");
const { createServer } = require("http");

//Express initialization
const app = express();              
const port = 443; //WebServer Port

//Websocket initialization
const httpServer = createServer(app);
const io = new Server(httpServer, {}); //Socket.io HTTP Wrapper

const oneDay = 1000 * 60 * 60 * 24;

try {
    //webserver listener and registrations
    httpServer.listen(port, () => { console.log(`Now listening on port ${port}`); }); //HTTP & WS

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

require('dotenv').config(); //Import .env 
const { SQL_DB_SERVER, SQL_DB_NAME, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID, TEMP_SQL_PASSWORD } = process.env;

// // sqlconfig
// var sql_config = {
//     server: SQL_DB_SERVER, 
//     database: SQL_DB_NAME,
//     authentication: {
//         type: 'azure-active-directory-service-principal-secret',
//         options: {
//             clientId: AZURE_CLIENT_ID,
//             clientSecret: AZURE_CLIENT_SECRET,
//             tenantId: AZURE_TENANT_ID
//         }
//     },
//     trustServerCertificate: false, //self-signed cert error
//     options: {
//         connectTimeout: 40000
//     }
// };

var sql_config = {
    server: "localhost", 
    database: SQL_DB_NAME,
    authentication: {
        type: 'default',
        options: {
            userName: "sa",
            password: TEMP_SQL_PASSWORD
        }
    },
    trustServerCertificate: true, //self-signed cert error
    options: {
        connectTimeout: 40000
    }
};


sql.connect(sql_config, function (err) {
    if(err) { console.log(err); }
    else { console.log(`Connected to DB: ${sql_config.server}`); }
});

module.exports = {
    httpServer,
    app,
    sql,
    io
}; //Exports the httpServer instance