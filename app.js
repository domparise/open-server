var express = require('express'),
	db = require('./db/mysql.js'),
	config = require('./config.js'),
	app = express(),
	server = require('https').createServer(config.keys,app),
	io = require('socket.io').listen(server);

server.listen(3000,function(){
	console.log('Listening on port 3000');
});




io.configure(function (){
	io.set('authorization', function (handshake, cb) {
		console.log(handshake);
		if(handshake.query.user < 10)
			return cb(null, true); 
		else
			return cb(null, false);
	});
});
// user known at this point

io.sockets.on('connection', function (socket) {

	// 'bind' a socket to events attending and friends, so they receive a real time update
	//
	socket.on('bind', function (req, cb) {
		db.friends(req.user, function (friends) {
			friends.forEach( function (f) {
				console.log('friend:'+f.uid);
			});
		});

		db.attends(req.user, function (events) {
			events.forEach( function (e) {
				console.log('event:' + e.eid);
			});
		});
	});

    socket.on('open', function (req, cb) {
    	// request comes in with start, end, type, 
    	// assume user known through socket at this point: associative array of users accessed by socket.id
    	// db action
    	// push notify

    	socket.broadcast.emit('1open',req.otb);
    });

    socket.on('join', function (req, cb) {
    	// db
    	// push notify

    	socket.broadcast.emit('2join',req.evt);
    	return cb({}); // return event
    });

    socket.on('newUser', function (req, cb) {
    	// db

    });

}); 

