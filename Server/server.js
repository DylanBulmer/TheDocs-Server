#!/usr/bin/env node

'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const path = require('path');
const pug = require('pug');
const Store = require('./modules/store.js');
const store = new Store();

// Require Web views and sources to get packaged
const admin = path.join(__dirname, '/views/admin.pug');
const css = path.join(__dirname, '/public/css/main.css');
const cssMD = path.join(__dirname, '/public/css/markdown.css');
const img = path.join(__dirname, '/public/image/TheDocsLogoNew_White.svg');

// Settings
const port = store.get("port");

//MySQL Setup
const db = require('./modules/database.js');

// Make the server use things
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

// Verify a connection
app.post('/', function (req, res) {
    res.send({
        'url': store.get("url"),
        'host': store.get("host"),
        'organization': store.get("organization"),
        'check': true
    });
});

// Login to the docs
app.post('/login', function (req, res) {
    let { username, password } = req.body;
    console.log(username + " is logging in");
    db.login(username, password, function (data) {
        res.json(data);
    });
});

// Register a user
app.post('/register', function (req, res) {
    let profile = req.body;
    db.register(profile, function (data) {
        res.json(data);
    });
});

// Serach the docs
app.post('/search', function (req, res) {
    let profile = req.body;
    db.searchKeyword(profile.key, profile, function (data) {
        res.json(data);
    });
});

// Get todo list
app.post('/todo', function (req, res) {
    let body = req.body;
    db.getTodo(body.profile, body.opts, function (data) {
        res.json(data);
    });
});

// Add to todo list
app.post('/todo/new', function (req, res) {
    let profile = req.body.profile;
    let item = req.body.item;

    db.newTodo(profile, item, function (data) {
        res.json(data);
    });

});

// update todo list
app.post('/todo/update', function (req, res) {
    let profile = req.body.profile;
    let item = req.body.item;

    db.updateTodo(profile, item, function (data) {
        res.json(data);
    });

});

// Create a new doc
app.post('/new', function (req, res) {
    let doc = req.body;

    // When all is good; go here
    let next = function () {
        let keys = doc.keywords;
        delete doc.keywords;

        console.log(doc, keys);
        db.createDocument(doc, keys, function callback(data) {
            res.json(data);
        });
    };

    // Check for project
    if (doc['project_id'].new) {
        db.db.query("SELECT * FROM projects", function (err, result) {
            let test = true;
            if (result.length > 0) {
                for (let i = 0; i < result.length; i++) {
                    if (result[i].name === doc['project_id'].new) {
                        doc.project_id = result[i].id;
                        test = false;
                    }
                }
            }

            if (test) {
                db.createProject(doc['project_id'].new, function (err, result) {
                    if (err) {
                        return res.send({ err: err });
                    } else {
                        // Add id to project
                        doc['project_id'] = result.id;

                        next();
                    }
                });
            } else {
                next();
            }
        });
    } else {
        next();
    }
});

app.post('/new/project', (req, res) => {
    let project = req.body;
    db.createProject(project.name, (err, result) => {
        res.json({
            err: err,
            result: result
        });
    }, project);
});

// Get projects
app.get('/projects', function (req, res) {
    db.getProjects(function (projects) {
        res.json(projects);
    });
});

app.post('/projects/current', (req, res) => {
    let profile = req.body;

    db.getJoinedProjects(profile, data => {
        res.json(data);
    });
});

app.post('/project/join/:id', (req, res) => {
    let profile = req.body;

    db.joinProject(profile, req.params.id, data => {
        res.json(data);
    });
});

app.post('/project/leave/:id', (req, res) => {
    let profile = req.body;

    db.leaveProject(profile, req.params.id, data => {
        res.json(data);
    });
});

// Get a doc by it's ID
app.post('/doc', function (req, res) {
    let post = req.body;
    db.getDoc(post.profile, post.id, function (doc) {
        res.json(doc);
    });
});

// POST journal
app.post('/journal', (req, res) => {
    // The post request must be an array of arrays
    // Ex: [ [ user_id, project_id, description ], [ ... ] ]
    db.createJournal(req.body, (err, result) => {
        if (err) {
            console.log(err);
            res.send(false);
        } else {
            console.log(result);
            res.send(true);
        }
    });
});

// POST journal
app.get('/journals/:date', (req, res) => {
    // The post request must be an array of arrays
    // Ex: [ [ user_id, project_id, description ], [ ... ] ]
    db.getJournalsFromDate(req.body, new Date(req.params.date), (err, result) => {
        if (err) {
            console.error(err);
            res.send(err);
        } else {
            console.log(result);
            res.send(result);
        }
    });
});

// Get a log
// PRE: Send in account info to gain access
app.post('/log/:type/:id', (req, res) => {
    let profile = req.body;

    let info, data, log;
    if (req.params.type === "user") {
        info = db.getUserAsync(req.params.id).then((user) => { data = user; });
    } else if (req.params.type === "project") {
        info = db.getProjectAsync(profile, req.params.id).then((project) => { data = project; });
    } else {
        data = req.params.type;
    }
    let logs = db.getLog(profile, req.params.type, req.params.id || null, 0).then((events) => {
        log = events;
    });
    Promise.all([info, logs]).then(() => {
        return res.json({
            "info": data,
            "logs": log
        });
    });
});

app.post('/log/:type/:id/:offset', function (req, res) {
    let profile = req.body;

    let info, data, log;
    if (req.params.type === "user") {
        info = db.getUserAsync(req.params.id).then((user) => { data = user; });
    } else if (req.params.type === "project") {
        info = db.getProjectAsync(req.params.id).then((project) => { data = project; });
    } else {
        data = req.params.type;
    }
    let logs = db.getLog(profile, req.params.type, req.params.id || null, 0).then((events) => {
        log = events;
    });
    Promise.all([info, logs]).then(() => {
        return res.json({
            "info": data,
            "logs": log
        });
    });
});
// END OF LOGS

app.get('/admin', (req, res) => {

    // code == 0 -> nothing; code == 1 -> success; code == -1 -> error;
    let message = {
        code: 0,
        text: "",
        form: ""
    };

    if (!store.get("firstTime")) {
        let users;
        let mysql = store.get("mysql");
        let org = store.get("organization");

        let p = db.getNumUsers().then(data => {
            users = data;
        });

        Promise.all([p]).then(() => {
            res.render('admin', {
                user: 'Test User',
                message: message,
                data: {
                    port: store.get("port"),
                    url: store.get("url"),
                    host: store.get("host"),
                    code: store.get("code"),
                    mysql: {
                        connection: db.isConnected,
                        users: db.isConnected ? users : 'N/A',
                        settings: {
                            host: db.isConnected ? mysql.host : 'N/A',
                            database: db.isConnected ? mysql.database : 'N/A',
                            user: db.isConnected ? mysql.user : 'N/A'
                        }
                    },
                    organization: {
                        name: org.name,
                        statement: org.statement
                    }
                }
            });
        });
    } else {
        res.redirect('/register');
    }
});

app.post('/admin', (req, res) => {
    let form = req.body;
    console.log("Req Data:" + JSON.stringify(req.accepts));

    // code == 0 -> nothing; code == 1 -> success; code == -1 -> error;
    let message = {
        code: 0,
        text: "",
        form: form.type
    };
    
    let mysql = store.get("mysql");
    let org = store.get("organization");

    let config = new Promise(callback => {
        console.log("Form data:" + JSON.stringify(form), "Org data:" + JSON.stringify(form["org[name]"]));
        switch (form.type) {
            case "general":

                console.log("Saving general config.");

                store.set("port", form.port);
                store.set("url", form.url);
                store.set("host", form.host);
                store.set("code", form.code);
                org.name = form["org[name]"];
                org.statement = form["org[statement]"];
                store.set("organization", org);

                console.log("Saved new configuration");

                callback();
                break;
            case "mysql":
                console.log("in mysql config handler");
                // testing passwords
                if (form.password !== "" && form.password === form.confirm_password) {
                    mysql.password = form.password;
                } else if (form.password !== "") {
                    message.code = -1;
                    message.text = "Passwords do not match!";
                }
                mysql.host = form.host;
                mysql.database = form.database;
                mysql.user = form.username;
                if (message.code === 0) {
                    message.code = 1;
                    message.text = "New configuration has been saved!\nRestarting database connection.";
                    console.log("Restart database");
                    db.restart().then(result => {
                        callback();
                    });
                } else {
                    callback();
                }
                break;
            default:
                callback();
                break;
        }
    });

    let users;

    let p = db.getNumUsers().then(data => {
        users = data;
    });

    Promise.all([p, config]).then(() => {
        console.log("return data");
        res.render('admin', {
            user: 'Test User',
            message: message,
            data: {
                port: store.get("port"),
                url: store.get("url"),
                host: store.get("host"),
                code: store.get("code"),
                mysql: {
                    connection: db.isConnected,
                    users: db.isConnected ? users : 'N/A',
                    settings: {
                        host: db.isConnected ? mysql.host : 'N/A',
                        database: db.isConnected ? mysql.database : 'N/A',
                        user: db.isConnected ? mysql.user : 'N/A'
                    }
                },
                organization: {
                    name: org.name,
                    statement: org.statement
                }
            }
        });
    });
});

app.listen(port, function () {
    console.log('TheDocs Server running on ' + port + '!');

    if (store.get("firstTime") === true) {
        console.log('');
        console.log('Please go to http://localhost:' + port + '/admin to setup the server!');
        console.log('');
    } else {
        // Connect to database after the app starts running
        db.connect();
    }
});