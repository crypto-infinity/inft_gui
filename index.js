//dependencies initialization
const {app,sql} = require("./initializer")

//WebServer GET & POST Methods
app.get('/', (req, res) => {
    res.render('index');      
});

app.post("/register", (req, res) => {
    try
    {
        console.log("Querying the DB...")
        var request = new sql.Request();

        var name = req.body.name;
        var email = req.body.email;
        var subject = req.body.subject;
        var message = req.body.message;

        request.input('name', sql.VarChar, name);
        request.input('email', sql.VarChar, email);
        request.input('subject', sql.VarChar, subject);
        request.input('message', sql.VarChar, message);

        var query = "INSERT INTO [SalesLT].Contact (name,email,subject,message) VALUES (@name,@email,@subject,@message)";

        request.query(query, function (err, recordset) { 
            if (err){
                console.log("Error: " + err)
                res.render('error', {error: err});
            } 
            // send records as a response, if any
            console.log(recordset);
            res.render('register', {name: name, email: email, subject: subject, message: message}); //generate register page with form-passed data
        });
    }
    catch(err){
        res.render('error', {error: err})
    }
});

app.post("/requests", (req, res) =>{
    var request = new sql.Request();
    var query = "SELECT * FROM [SalesLT].Contact";
    request.query(query, (err, recordset) => {
        if (err){
            console.log("Error: " + err)
            res.render('error', {error: err});
        }
        res.render('requests', {_records: JSON.stringify(recordset.recordset)});
    })
})

// //TEST DEV REFERENCE `'"

// app.get("/requests",(req, res) =>{

//     console.log(html);
//     res.send(html);
// })

// app.get('/register', (req, res) => {
//     res.render('register', {name: "notset", email: "notset", subject: "notset", message: "notset"});     
// });
// app.get('/register', (req, res) => {
//     res.render('register', {name: "notset", email: "notset", subject: "notset", message: "notset"});     
// });