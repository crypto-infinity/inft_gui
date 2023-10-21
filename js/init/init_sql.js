/**
* MS SQL Server Connection initialization (MSSQL - Tedious)
*/
const sql = require("mssql");

require('dotenv').config(); //Import .env 
const { SQL_DB_SERVER, SQL_DB_NAME, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID, TEMP_SQL_PASSWORD } = process.env;

// SQL Config for Azure SQL Server
var sql_config_azure = {
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
        connectTimeout: 40000
    }
};

//Dev config
var sql_config_dev = {
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


sql.connect(sql_config_dev, function (err) {
    if(err) { console.log(err); }
    else { console.log(`Connected to DB: ${sql_config_dev.server}`); }
});

module.exports = {
    sql
}; //Exports the httpServer instance