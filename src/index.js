"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var http_1 = require("http");
var url_1 = require("url");
var path_1 = require("path");
var socket_io_1 = require("socket.io");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = (0, path_1.dirname)(__filename);
var app = (0, express_1.default)();
var server = (0, http_1.createServer)(app);
var io = new socket_io_1.Server(server, {
    connectionStateRecovery: {}
});
app.get('/', function (_req, res) {
    res.sendFile(__dirname + '/frontEnd/index.html');
});
io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log("user disconnected");
    });
    socket.on('chat message', function (msg) {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
});
server.listen(3000, function () {
    console.log('Listening on Port: 3000');
});
