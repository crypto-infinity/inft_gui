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
    if (err){
        res.render('error', {error: err});
    } 
    console.log(`Connected to DB: ${sql_config.server}`);
});

module.exports = sql;