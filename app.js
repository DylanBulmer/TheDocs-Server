"use strict";

// Server config
const PORT = 80,
      HTTP = true;

var express = require("express");
var logger = require('morgan');
var app = express();
var server = require("http").createServer(app);
var io = require('./io').create(require("socket.io")(server));

// Sharing Sessions between the webserver and the WS server
var session = require("express-session")({
    secret: "my-secret",
    resave: true,
    saveUninitialized: true
  }),
  sharedSession = require("express-socket.io-session")(session);

app.use(session);
io.use(sharedSession);

// Creaing the webserver
 
app.use("/", function(req, res) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("Hello, World!\n\n💚 🔒.js");
});

if (HTTP) {
  server.listen(PORT);
}

module.exports = app;