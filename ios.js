var express = require('express'),
	config = require('./config.js'),
	app = express(),
	server = require('https').createServer(config.keys,app),
	io = require('socket.io').listen(server);


// io.configure(function (){
// 	io.set('authorization', function (req, cb) {
// 		req;
// 		return cb(null, true); 
// 	});
// });


io.sockets.on('connection', function (socket) {

    socket.on('authorization', function (req, cb) {
        console.log(req);
        return cb(null, true);
    });

    socket.on('open', function (req, cb) {
    	// db action
    	// push notify
    	socket.broadcast.emit('1open',req.otb);
    	return cb({}); // return 
    });

    socket.on('join', function (req, cb) {
    	// db
    	// push notify
    	socket.broadcast.emit('2join',req.evt);
    	return cb({}); // return event
    });

    socket.on('newUser', function (req, cb) {
    	// db
    	return cb({}); // return user
    })

}); 

server.listen(3000);