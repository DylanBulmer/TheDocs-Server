"use strict";
 
const path = require('path');

const greenlock = require("greenlock-express")
  .create({
    // Let's Encrypt v2 is ACME draft 11
    // Note: If at first you don't succeed, stop and switch to staging
    // https://acme-staging-v02.api.letsencrypt.org/directory
    server: "https://acme-staging-v02.api.letsencrypt.org/directory", // "https://acme-v02.api.letsencrypt.org/directory",
    version: "draft-11",

    email: "dylan@bulmersolutions.com",
    agreeTos: true, // You must accept the ToS as the host which handles the certs
    configDir: path.join(__dirname, "./.config/acme/"),
    communityMember: false,
    telemetry: true, // Contribute telemetry data to the project

    // approveDomains is the right place to check a database for
    // email addresses with domains and agreements and such
    approveDomains: approveDomains,

    // Using your express app:
    // simply export it as-is, then include it here
    app: require("./app.js")

    //, debug: true
  });

const server = greenlock.listen(80, 443);

function approveDomains(opts, certs, cb) {
	// Only one domain is listed with *automatic* registration via SNI
	// (it's an array because managed registration allows for multiple domains,
	//                                which was the case in the simple example)
	console.log(opts.domains);

	// The domains being approved for the first time are listed in opts.domains
	// Certs being renewed are listed in certs.altnames
	if (certs) {
		opts.domains = [certs.subject].concat(certs.altnames);
	}

	checkDb(opts.domains, function(err, agree, email) {
		if (err) {
			cb(err);
			return;
		}

		// Services SHOULD automatically accept the ToS and use YOUR email
		// Clients MUST NOT accept the ToS without asking the user
		opts.agreeTos = agree;
		opts.email = email;

		// NOTE: you can also change other options such as `challengeType` and `challenge`
		// (this would be helpful if you decided you wanted wildcard support as a domain altname)
		// opts.challengeType = 'http-01';
		// opts.challenge = require('le-challenge-fs').create({});

		cb(null, { options: opts, certs: certs });
	});
}

//
// My User / Domain Database
//
function checkDb(domains, cb) {
	// This is an oversimplified example of how we might implement a check in
	// our database if we have different rules for different users and domains
	var domains = ["thedocs.bulmersolutions.com"];
	var userEmail = "dylan@bulmersolutions.com";
	var userAgrees = true;
	var passCheck = opts.domains.every(function(domain) {
		return -1 !== domains.indexOf(domain);
	});

	if (!passCheck) {
		cb(new Error("Server Error: Domain not allowed"));
	} else {
		cb(null, userAgrees, userEmail);
	}
}