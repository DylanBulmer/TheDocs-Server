'use strict';

var bcrypt = require('bcrypt');
var mysql = require('mysql');
var store = require('../modules/store');

// Recurcively Test user
const loginTest = (username, password, users, seek) => {
    if (seek < users.length) {
        if (users[seek].username === username || users[seek].email === username) {
            if (bcrypt.compareSync(password, users[seek].password)) {
                // log data
                let date = new Date();
                console.log(users[seek].name_first + " " + users[seek].name_last + " (" + username + ") logged in at " + date);
                // send data back
                return { err: "", result: users[seek] };
            } else {
                return { err: "Invalid Password!" };
            }
        } else {
            return loginTest(username, password, users, seek + 1);
        }
    } else {
        return { err: 'There is no user named ' + username + '!' };
    }
};

class database {
    constructor() {
        this.data = store.get("mysql");
        this.isConnected = false;
        this.db;
    }

    // Connect to database
    connect() {
        let self = this;
        this.db = mysql.createConnection(this.data);

        this.db.connect(function (err) {
            if (err) {
                self.isConnected = false;
                console.log("MySQL ERROR: " + err.code);
                setTimeout(self.connect, 2000);
            } else {
                if (self.data.database === "") {
                    console.log("Please enter a database in the config.json file!");
                } else {
                    console.log();
                    console.log("MySQL Connection Established");
                    self.isConnected = true;
                    self.verifyDataBase();
                }
            }

            self.db.on('error', function (err) {
                console.log('MySQL Error: ', err.message);
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    self.isConnected = false;
                    self.connect();
                } else {
                    throw err;
                }
            });
        });
    }

    restart() {
        this.db.end((err) => {
            if (err) console.error(err.message);

            console.log("\nRestarting database connection!\n");

            this.data = store.get("mysql");
            this.connect();
        });
    }

    verifyDataBase() {
        // POST: Checks to see if everything is set up correctly
        console.log();
        console.log("Checking tables...");
        console.log();
        this.db.query("CREATE TABLE IF NOT EXISTS `users` (`id` int(11) NOT NULL AUTO_INCREMENT,`username` varchar(20) NOT NULL,`password` varchar(255) NOT NULL,`email` varchar(254) NOT NULL,`name_first` varchar(50) NOT NULL,`name_last` varchar(45) NOT NULL,`token` VARCHAR(255) NOT NULL,PRIMARY KEY (`id`),UNIQUE KEY `id_UNIQUE` (`id`),UNIQUE KEY `username_UNIQUE` (`username`),UNIQUE KEY `email_UNIQUE` (`email`)) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;", (err, result) => {
            if (err) {
                console.log(err.message);
                console.log("CREATE TABLE 'Users' ........ Failed");
            } else {
                console.log("TABLE 'Users' ............... Good");
            }
        });
        this.db.query("CREATE TABLE IF NOT EXISTS `projects` (`id` int(11) NOT NULL AUTO_INCREMENT,`name` varchar(50) NOT NULL DEFAULT 'Unnamed Project',`description` varchar(255) DEFAULT NULL,`homepage` varchar(255) DEFAULT NULL,`started` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,`completed` timestamp NULL DEFAULT NULL,PRIMARY KEY (`id`)) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;", (err, result) => {
            if (err) {
                console.log(err.message);
                console.log("CREATE TABLE 'Projects' ..... Failed");
            } else {
                console.log("TABLE 'Projects' ............ Good");
            }
        });
        this.db.query("CREATE TABLE IF NOT EXISTS `keywords` (`id` int(11) NOT NULL AUTO_INCREMENT,`keyword` varchar(50) NOT NULL,`doc_id` int(10) unsigned NOT NULL,PRIMARY KEY (`id`),UNIQUE KEY `id_UNIQUE` (`id`)) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;", (err, result) => {
            if (err) {
                console.log(err.message);
                console.log("CREATE TABLE 'Keywords' ..... Failed");
            } else {
                console.log("TABLE 'Keywords' ............ Good");
            }
        });
        this.db.query("CREATE TABLE IF NOT EXISTS `documents` (`id` int(11) NOT NULL AUTO_INCREMENT,`user_id` int(4) NOT NULL,`project_id` int(4) NOT NULL,`title` varchar(60) NOT NULL,`url` varchar(255) DEFAULT NULL,`description` varchar(255) NOT NULL,`solution` blob NOT NULL,`created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY (`id`),UNIQUE KEY `id_UNIQUE` (`id`)) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;", (err, result) => {
            if (err) {
                console.log(err.message);
                console.log("CREATE TABLE 'Documents' .... Failed");
            } else {
                console.log("TABLE 'Documents' ........... Good");
            }
        });
        this.db.query("CREATE TABLE IF NOT EXISTS `journals` (`id` int(11) NOT NULL AUTO_INCREMENT,`user_id` int(4) NOT NULL,`project_id` int(4) NOT NULL,`created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,`description` varchar(255) NOT NULL,PRIMARY KEY (`id`)) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;", (err, result) => {
            if (err) {
                console.log(err.message);
                console.log("CREATE TABLE 'Journals' ..... Failed");
            } else {
                console.log("TABLE 'Journals' ............ Good\n");
            }
        });
    }

    // Login User
    login(username, password, callback) {
        let user;
        this.db.query("SELECT * FROM users", function (err, result) {
            if (err) throw err;
            console.log("User is connecting");
            return callback(loginTest(username, password, result, 0));
        });
    }

    // Register User
    register(profile, callback) {
        let user;
        let db = this.db;
        this.db.query("SELECT * FROM users", function (err, result) {
            if (err) throw err;
            if (store.get("code") !== profile.code) {
                return callback({
                    "err": "Invailid Registration Code!"
                });
            } else {
                for (let i = 0; i < result.length; i++) {
                    if (result[i].username === profile.username) {
                        return callback({
                            "err": "That username is already in use!"
                        });
                    } else if (result[i].email === profile.email) {
                        return callback({
                            "err": "That email is already in use!"
                        });
                    }
                }

                // Generate Token

                let passHash = 0;
                let divide = 0;
                let token = "";

                for (let i = 0; i < profile.password.length; i++) {
                    passHash += profile.password.charCodeAt(i);
                }

                divide = Math.ceil(passHash / 21);

                while (passHash > divide) {
                    let letter = String.fromCharCode(48 + passHash % 74);
                    token += letter;
                    passHash -= divide;
                }

                token = bcrypt.hashSync(token, passHash % 21);

                // Save user to database

                bcrypt.hash(profile.password, 10, function (err, hash) {
                    db.query("INSERT INTO users (name_first, name_last, username, email, password, token) VALUES ('" + profile.name_first + "', '" + profile.name_last + "', '" + profile.username + "', '" + profile.email + "', '" + hash + "', '" + token + "' )", (err, rows, field) => {
                        let id = rows.insertId;

                        profile.token = token;
                        profile.id = id;

                        return callback({
                            "result": profile,
                            "err": ""
                        });
                    });
                });
            }
        });
    }

    // Use this function to validate if the user is logged in/is the current user
    async checkUser(profile) {
        // profile must include: id, user( name || email ) and token.
        return new Promise(callback => {
            profile = profile.user;
            this.db.query("SELECT * FROM users WHERE id=" + profile.id, function (err, rows, fields) {
                if (err) callback(err);
                let user = rows[0];

                if ((profile.username === user.username || profile.username === user.email) && profile.token === user.token) {
                    return callback(true);
                } else {
                    return callback(false);
                }
            });
        });
    }

    // Search method used with AJAX
    searchKeyword(key, profile, callback) {

        this.checkUser(profile).then(check => {
            if (check) {
                // Fix this: change offset to the number of already loaded elements.
                let offset = 0;
                let self = this;
                this.db.query("SELECT * FROM keywords WHERE keyword LIKE '%" + key + "%' ORDER BY id DESC LIMIT 25 OFFSET " + offset, function (err, rows, fields) {
                    if (err) throw err;
                    // Add Doc title to each element
                    let data = [];
                    if (rows.length > 0) {
                        for (let i = 0; i < rows.length; i++) {
                            self.getDoc(rows[i].doc_id, function (doc) {
                                if (data.length === 0) {
                                    rows[i]['title'] = doc.title;
                                    rows[i]['project'] = doc.project;
                                    data.push(rows[i]);
                                } else {
                                    for (let d = 0; d < data.length; d++) {
                                        if (data[d].doc_id === rows[i].doc_id) {
                                            if (data[d].keyword !== rows[i].keyword) {
                                                data[d].keyword += ', ' + rows[i].keyword;
                                            }
                                        } else if (d === data.length - 1) {
                                            rows[i]['title'] = doc.title;
                                            rows[i]['project'] = doc.project;
                                            data.push(rows[i]);
                                        }
                                    }
                                }

                                if (i === rows.length - 1) {
                                    let respond = {
                                        err: false,
                                        result: data
                                    };
                                    callback(respond);
                                }
                            });
                        }
                    } else {
                        let respond = {
                            err: false,
                            result: data
                        };
                        callback(respond);
                    }
                });
            } else {
                callback({ err: "You're not logged in!" });
            }
        });
    }

    // Submit a new document to the database
    createDocument(doc, keywords, callback) {
        // PRE  doc      = { user_id: '', project_id: '', title: '', url: '', desc: '', solution: '' }
        //      keywords = [ ['keyword'], ['keyword'] ]; doc_id will be added automatically
        let docID = null;
        let db = this.db;

        db.query("INSERT INTO documents SET ?", doc, function (err, results, fields) {
            if (err) {
                console.log(err);
                return callback({
                    'err': err.message
                });
            } else {
                // Get id of inserted item
                docID = results.insertId;

                // Add doc_id to all keywords
                let keys = [];
                for (let i = 0; i < keywords.length; i++) {
                    keys.push([keywords[i], docID]);
                }

                // Next store keywords
                db.query("INSERT INTO keywords (keyword, doc_id) VALUES ?", [keys], function (err, result) {
                    if (err) {
                        console.log(err);
                        return callback({
                            'err': err.message
                        });
                    } else {
                        // return doc id if all goes well.
                        return callback({
                            'err': '',
                            'result': {
                                'id': docID
                            }
                        });
                    }
                });
            }
        });
    }

    // create a new project; use when user needs to add project
    createProject(name, callback, opts) {
        if (opts) {
            let project = opts;

            this.db.query("insert into projects SET ?", project, function (err, result) {
                if (err) {
                    console.log(err);
                    return callback({
                        'err': err.message
                    });
                } else {
                    return callback(false, { 'id': result.insertId });
                }
            });
        } else {
            this.db.query("insert into projects (name) values ('" + name + "' )", function (err, result) {
                if (err) {
                    console.log(err);
                    return callback({
                        'err': err.message
                    });
                } else {
                    return callback(false, { 'id': result.insertId });
                }
            });
        }
    }

    // create a new journal
    createJournal(journals, callback) {
        this.db.query("insert into journals (user_id, project_id, description) values ? ", [journals], function (err, result) {
            if (err) {
                console.log(err);
                return callback({
                    'err': err.message
                });
            } else {
                return callback(false, { 'id': result.insertId });
            }
        });
    }

    // Get projects
    getProjects(callback) {
        // Fix this: change offset to the number of already loaded elements.
        this.db.query("SELECT * FROM projects ORDER BY id DESC", function (err, rows, fields) {
            if (err) throw err;
            callback(rows);
        });
    }

    // Get project by ID
    getProject(id, callback) {
        // Fix this: change offset to the number of already loaded elements.
        this.db.query("SELECT * FROM projects WHERE id=" + id, function (err, rows, fields) {
            if (err) throw err;
            callback(rows[0]);
        });
    }

    async getProjectAsync(id) {
        return new Promise(callback => {
            this.db.query("SELECT * FROM projects WHERE id=" + id, function (err, rows, fields) {
                if (err) throw err;
                callback(rows[0]);
            });
        });
    }

    // Get doc by ID
    getDoc(id, callback) {
        let self = this;
        // Get Doc
        this.db.query("SELECT * FROM documents WHERE id=" + id, function (err, rows, fields) {
            if (err) throw err;

            // Set doc
            let doc = rows[0];

            // Get project name
            self.getProject(doc.project_id, function (project) {
                doc['project'] = project.name;

                // Get the creator of the doc
                self.getUser(doc.user_id, function (user) {
                    doc['user'] = user;

                    // Get keywords associated with the doc
                    self.getKeywords(id, function (keywords) {
                        doc['keywords'] = keywords;

                        // Give back doc
                        callback(doc);
                    });
                });
            });
        });
    }

    getUser(id, callback) {
        this.db.query("SELECT * FROM users WHERE id=" + id, function (err, rows, fields) {
            if (err) throw err;
            let user = rows[0];

            // Remove sensitive data
            delete user.password;
            delete user.email;
            delete user.username;

            callback(user);
        });
    }

    async getUserAsync(id) {
        return new Promise(callback => {
            this.db.query("SELECT * FROM users WHERE id=" + id, function (err, rows, fields) {
                if (err) throw err;
                let user = rows[0];

                // Remove sensitive data
                delete user.password;
                delete user.email;
                delete user.username;

                callback(user);
            });
        });
    }

    getKeywords(id, callback) {
        this.db.query("SELECT * FROM keywords WHERE doc_id=" + id, function (err, rows, fields) {
            if (err) throw err;

            // create an array of keywords
            let keys = [];
            for (let i = 0; i < rows.length; i++) {
                keys.push(rows[i].keyword);
            }

            callback(keys);
        });
    }

    async getNumUsers() {
        return new Promise(resolve => {
            if (this.isConnected) {
                this.db.query("SELECT id FROM users", function (err, rows, fields) {
                    resolve(rows.length);
                });
            } else {
                resolve(0);
            }
        });
    }

    /**
     * @returns {Function} callback will be returned 
     * @param {String} type Type of log to grab
     * @param {Number} id ID should be a number
     * @param {Number} offset Increment by one to get 25 more logs
     * @param {Function} callback Callback the log with a function
     */
    async getLog(type, id, offset) {

        return new Promise(callback => {
            let docs, journals, d, p;
            switch (type) {
                case "user":
                    // Grab Documents and journals by user
                    this.db.query("SELECT results.*, users.name_first, users.name_last FROM ((SELECT id, user_id, project_id, title, created FROM documents) UNION ALL (SELECT id, user_id, project_id, NULL AS title, created FROM journals)) AS results LEFT JOIN users ON (users.id = results.user_id) WHERE user_id = " + id + " ORDER BY created DESC LIMIT 20 OFFSET " + 20 * offset, (err, rows, fields) => {
                        if (err) {
                            return callback(err);
                        } else {
                            return callback(rows);
                        }
                    });

                    break;
                case "project":
                    // Grab documents and journals by project
                    this.db.query("SELECT results.*, users.name_first, users.name_last FROM ((SELECT id, user_id, project_id, title, created FROM documents) UNION ALL (SELECT id, user_id, project_id, NULL AS title, created FROM journals)) AS results LEFT JOIN users ON (users.id = results.user_id) WHERE project_id = " + id + " ORDER BY created DESC LIMIT 20 OFFSET " + 20 * offset, (err, rows, fields) => {
                        if (err) {
                            return callback(err);
                        } else {
                            return callback(rows);
                        }
                    });
                    break;
                case "activity":
                    // Grab documents and journals for all users
                    this.db.query("SELECT results.*, users.name_first, users.name_last FROM ((SELECT id, user_id, project_id, title, created FROM documents) UNION ALL (SELECT id, user_id, project_id, NULL AS title, created FROM journals)) AS results LEFT JOIN users ON (users.id = results.user_id) ORDER BY created DESC LIMIT 20 OFFSET " + 20 * offset, (err, rows, fields) => {
                        if (err) {
                            return callback(err);
                        } else {
                            return callback(rows);
                        }
                    });
                    break;
                default:
                    return callback("Event Logs");
            }
        });
    }
}

module.exports = new database();