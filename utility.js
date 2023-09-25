/**
* JS Function Library
*/

const INFT_Library = {
    userExistinDB(sql,username){
        var request = new sql.Request();

        request.input('username',sql.VarChar, username);
        var query = "SELECT * FROM [SalesLT].Login WHERE username=@username";

        request.query(query, function (err, recordset) {
            if (err){ //handling DB errors
                console.log("Error: " + err)
                req.session.destroy();
                res.render('error', {error: err});
            }
            if(recordset.recordset.length > 0){ return recordset; }
            else{ return false; }
        });
    }
}

module.exports = {
    INFT_Library
}; 