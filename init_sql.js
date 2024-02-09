/**
* MS SQL Server Connection initialization, based on mssql and tedious
*/
const sql = require("mssql");

require('dotenv').config(); //Import .env 
const { SQL_DB_SERVER, SQL_DB_NAME, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID, SQL_PASSWORD } = process.env;

// sqlconfig
var sql_config_azure = {
    server: SQL_DB_SERVER, 
    database: SQL_DB_NAME,
    authentication: {
        type: 'default',
        options: {
            userName: "CloudSAfa79f0c1",
            password: SQL_PASSWORD
        }
    },
    trustServerCertificate: false, //self-signed cert error
    options: {
        connectTimeout: 40000
    }
};

var sql_config_dev = {
    server: "localhost", 
    database: SQL_DB_NAME,
    authentication: {
        type: 'default',
        options: {
            userName: "sa",
            password: SQL_PASSWORD
        }
    },
    trustServerCertificate: true, //self-signed cert error
    options: {
        connectTimeout: 40000
    }
};


sql.connect(sql_config_azure, function (err) {
    if(err) { console.log(err); }
    else { console.log(`Connected to DB: ${sql_config_azure.server}`); }
});

module.exports = {
    sql
}; //Exports the httpServer instance