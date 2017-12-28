#!/usr/bin/env node

// Load configuration depending on environment
var env      = process.env.NODE_ENV || 'development';
var config   = require('./config')[env];
var app      = require('./modules/app');
var express  = require('express');
var path     = require('path');
var IOTA     = require('iota.lib.js');
var jsonfile = require('jsonfile');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

var socketApi = require('./socketApi');
var io        = socketApi.io;

var sockets = [];

//var gNodeInfo = {};
//var gTags     = {};


//var tagFileName = (process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] || process.cwd()) + '/iota-pm.conf';
//
//jsonfile.readFile(tagFileName, function (err, obj) {
//    if (err) {
//        console.log('Unable to locate any previous tag file at', tagFileName);
//    } else {
//        if (obj) {
//            console.log('Restored tags from', tagFileName);
//            gTags = Object.assign(gTags, obj);
//        }
//    }
//});
//
//function saveConfig () {
//    jsonfile.writeFile(tagFileName, gTags, { spaces: 2 }, function (err) {
//        if (err) {
//            console.error(err);
//        }
//    });
//}

io.on('connection', function (socket) {
    sockets.push(socket);

    getSystemInfo();
    getNeighbors();

    socket.on('disconnect', function(data){
        var i = sockets.indexOf(socket);

        if (i !== -1) {
            sockets.splice(i, 1);
        }
    });

//    socket.on('addPeer', function (data) {
//        console.log("!!!!Adding peer", data);
//
//        try {
//            iota.api.addNeighbors([data.address], function(error, result) {
//                if (error) {
//                    console.error(error);
//                    socket.emit('result', error.message);
//                } else {
//                    socket.emit('result', "Peer added Successfully. Please also update your IRI config file (if required)");
//                    updatePeerInfo();
//                }
//            });
//
//            saveConfig();
//        } catch(e){
//            socket.emit('result', e.message);
//        }
//    });

    socket.on('removePeer', function (data) {
        console.log('Removing peer', data);

        try {
            iota.api.removeNeighbors([ data.address ], function(error, result) {
                if (error) {
                    console.error(error);
                    socket.emit('result', error.message);
                } else {
                    socket.emit('peerDeleted', data);
                }
            });
        } catch (e) {
            socket.emit('result', e.message);
        }
    });

//    socket.on('updateTag', function (data) {
//        gTags[data.address] = data.tag;
//        saveConfig();
//    });
});

function emitToAllSockets(event, data, callback)
{
    sockets.forEach(function (socket) {
        socket.emit(event, data, callback);
    });
}

// Create IOTA instance directly with provider
var iota = new IOTA({
    'provider': (app.argv.iri || 'http://localhost:14800')
});

/**
 * Update list of neighbors.
 *
 * @param {Array} peers List of neighbors
 *
 * @return {void}
 */
function updatePeerInfo(peers)
{
//console.log('updatePeerInfo');
//    emitToAllSockets('updatePeerList', peers, function (data) {
//console.log('updatePeerList');
//        if (data.result) {
//console.log(data);
//
//        }
//    });

    peers.forEach(function (peer) {
        var hostname = peer.address.match(/:/g)
            ? peer.address.slice(0, peer.address.indexOf(':'))
            : peer.address;

        var iotaPeer = new IOTA({
            'host': 'http://' + hostname,
            'port': 14265
        });

        // Try to load node info of neighbor
        iotaPeer.api.getNodeInfo(function (error, data) {
            console.log('Getting node info:', hostname + ':14265');

            if (error) {
                console.error(error.message);

                peer.nodeInfo = false;
            } else {
                peer.nodeInfo = data;
            }

//            peer.tag = gTags[peer.address] || 'Unknown Peer';

            emitToAllSockets('peerInfo', peer);
        })
    });
}

/**
 * Get all neighbors of node.
 *
 * @return {void}
 */
function getNeighbors()
{
    iota.api.getNeighbors(function (error, data) {
        if (error) {
            console.error(error);
        } else {
            updatePeerInfo(data);
        }
    });
}

/**
 * Get node information.
 *
 * @return {void}
 */
function getSystemInfo()
{
    iota.api.getNodeInfo(function (error, data) {
        if (error) {
            console.error(error);

            emitToAllSockets('nodeInfo', false);
        } else {
            emitToAllSockets('nodeInfo', data);
        }
    });
}

// Update system info
setInterval(function () {
    getSystemInfo();
}, 30000);

// Update list of neighbors
setInterval(function () {
    getNeighbors();
}, (app.argv.refresh * 1000) || 10000);
