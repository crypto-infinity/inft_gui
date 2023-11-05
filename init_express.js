/**
* Webserver initialization, based on Express framework
*/
const express = require('express');
const bodyParser = require("body-parser");
const sessions = require('express-session');
const { Server } = require("socket.io");
const { createServer } = require("http");
const path = require('path'); 

//Express initialization
const app = express();              
const port = 443; //WebServer Port

//Websocket initialization
const httpServer = createServer(app);
const io = new Server(httpServer, {
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true
    },
    maxHttpBufferSize: 1e7 // Maximum 10 MB of HTTP Upload
}); //Socket.io HTTP Wrapper

const oneDay = 1000 * 60 * 60 * 24;

try {
    //webserver listener and registrations
    httpServer.listen(port, () => { console.log(`Now listening on port ${port}`); }); //HTTP & WS

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
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

module.exports = {
    app,
    io
}; //Exports the httpServer instance