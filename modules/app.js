// Load configuration depending on environment
var env       = process.env.NODE_ENV || 'development';
var config    = require('../config')[env];

var port      = config.port;
var host      = config.host;

// Load required node modules
var express   = require('express');
var app       = express();
var server    = require('http').createServer(app);
var minimist  = require('minimist');
var basicAuth = require('basic-auth');

// Parse command line arguments
app.argv = minimist(process.argv.slice(2), {
    string: [ 'iri' ],
    alias: {
        h: 'help',
        i: 'iri',
        r: 'refresh',
        p: 'port'
    }
});

if (app.argv.refresh) {
    if ((app.argv.refresh < 5) || (app.argv.refresh > 600)) {
        console.log('Refresh Value must be within 5 to 600 seconds.');
        process.exit(0);
    }
}

if (app.argv.help) {
    console.log("IPM:    IOTA Peer Manager");
    console.log("        Manage and monitor IOTA peer health status in beautiful dashboard.");

    console.log("Usage:");
    console.log("iota-pm [--iri=iri_api_url] [--port=your_local_port] [--refresh=interval]");
    console.log("  -i --iri     = The API endpoint for IOTA IRI implementation (Full Node). ");
    console.log("  -p --port    = Local server IP and port where the dashboard web server should be running");
    console.log("  -r --refresh = Refresh interval in seconds for IRI statistics gathering (default 10s)");
    console.log("  -h --help    = print this message");
    console.log("");
    console.log("Example.");
    console.log("iota-pm -i http://127.0.0.1:14800 -p 127.0.0.1:8888");
    console.log("IPM will connect to IOTA endpoint and produce the status at localhost port 8888");
    console.log("To view the dashboard, simply open a browser and point to http://127.0.0.1:8888");
    console.log("");
    process.exit(0);
}

if (typeof app.argv.port === 'string') {
    var portArgs = app.argv.port.split(':');
    port = portArgs[1];
    host = portArgs[0];
} else {
    if (app.argv.port) {
        port = app.argv.port;
    }
}

server.listen(port, host);

console.log('Serving IOTA peer dashboard at http://' + host + ':' + port);

// Authenticator
var authMiddleware = function (req, res, next) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm="Authorization Required"');

        return res.sendStatus(401);
    };

    var user = basicAuth(req);

    if (!user
        || !user.name
        || !user.pass
        || (user.name !== config.auth.user)
        || (user.pass !== config.auth.pass)
    ) {
        return unauthorized(res);
    };

    return next();
};

app.get('/', authMiddleware, function (req, res, next) {
    return next();
});

/**
 * Socket.io
 */
var socketApi = require('../socketApi');
var io        = socketApi.io;

io.attach(server);

module.exports = app;
