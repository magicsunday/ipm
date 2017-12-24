#!/usr/bin/env node


//Load configuration depending on environment
var env       = process.env.NODE_ENV || 'development';
var config    = require('./config')[env];

//var express   = require('express');
var app       = require('./modules/app');
var express   = require('express');
var path      = require('path');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));


var rest = require('restler');
var IOTA = require('iota.lib.js');
var async = require('async');
var jsonfile = require('jsonfile');

var socketApi = require('./socketApi');
var io        = socketApi.io;

//var io = require('socket.io')(server);

var gNodeInfo = {};
var gPeerInfo = [];
var gTags = {};

var tagFileName = (process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] || process.cwd()) +"/iota-pm.conf";

jsonfile.readFile(tagFileName, function(err, obj) {
      if (err) {
          console.log("Unable to locate any previous tag file at", tagFileName);
      }
      else if (obj) {
          console.log("Restored tags from ", tagFileName);
          gTags = Object.assign(gTags, obj);
      }
});


function generator(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

var sockets = [];


function saveConfig (){
    jsonfile.writeFile(tagFileName, gTags, {spaces: 2}, function (err) {
    if (err) console.error(err);
    });
}

io.on('connection', function (s) {
    sockets.push(s);

    s.emit('nodeInfo', gNodeInfo);

  updatePeerInfo();
  s.on('disconnect', function(data){
    var i = sockets.indexOf(s);
    if(i != -1) {
        sockets.splice(i, 1);
    }
  });

  s.on('addPeer', function (data) {
    console.log("!!!!Adding peer",data);
    try{
        iota.api.addNeighbors([data.address], function(error, result) {
        if (error) {
            console.error(error);
            s.emit('result', error.message);
        } else {
            s.emit('result', "Peer added Successfully. Please also update your IRI config file (if required)");
            updatePeerInfo();
        }
        });
        saveConfig();
    }
    catch(e){
        s.emit('result', e.message);
    }
  });

  s.on('removePeer', function (data) {
    console.log("!!!!Removing peer",data);
    try {
        iota.api.removeNeighbors([data.address], function(error, result) {
        if (error) {
            console.error(error);
            s.emit('result', error.message);
        } else {
            s.emit('peerDeleted', data);
        }
        });
    }
    catch(e){
        s.emit('result', e.message);
    }
  });

  s.on('updateTag', function (data) {
       gTags[data.address] = data.tag;
       saveConfig();
  });

});

// Create IOTA instance directly with provider
var iota = new IOTA({
    'provider': (app.argv.iri || 'http://localhost:14800')
});

function updateNodeInfo() {
    sockets.forEach(function (s) {
        s.emit('nodeInfo', gNodeInfo);
    });
}

function updatePeerInfo(peer) {
    gPeerInfo.forEach(function (peer) {
        peer.tag = gTags[peer.address] || 'Unknown Peer';

        sockets.forEach(function (s) {
            s.emit('peerInfo', peer);
        });
    });
}


function getNeighbours() {
    iota.api.getNeighbors(function (error, peers) {
        if (error) {
            console.error(error);
        } else {
            //console.log(peers);
            gPeerInfo = peers;
            updatePeerInfo();
        }
    });
}

setInterval(function () {
// now you can start using all of the functions
    getNeighbours();
}, (app.argv.refresh * 1000) || 10000);


function getSystemInfo() {
    iota.api.getNodeInfo(function (error, success) {
        if (error) {
            console.error(error);
        } else {
            //console.log(success);
            gNodeInfo = success;
            updateNodeInfo();
        }
    });
}

getSystemInfo();
getNeighbours();

setInterval(function(){
    getSystemInfo();
},30000);
