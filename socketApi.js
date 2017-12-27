var socket_io = require('socket.io');
var io        = socket_io();
var socketApi = {};
var sockets   = [];

socketApi.io = io;

module.exports = socketApi;
