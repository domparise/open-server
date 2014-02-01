var express = require('express'),
	db = require('./db/db.js'),
	config = require('./config.js'),
	app = express(),
	server = require('https').createServer(config.keys,app),
	io = require('socket.io').listen(server),
	clients = {};

app.set(express.static('/test'));

db.init( function (users, events) {	
// db validation & error handling here

	io.configure(function (){
		io.set('authorization', function (handshake, cb) {
			if(handshake.query.user < 10)
				return cb(null, true); 
			else
				return cb(null, false);
		});
	});
	// user known at this point

	io.sockets.on('connection', function (socket) {
		// hopefully can use auth step to associate sockets with users at this point
		clients[socket.id].socket = socket;

		clients[1].socket = socket;
		clients[1].user.id = 1;

		socket.on('bind', function (req, cb) {
			// 'bind' a socket to events attending and friends, so they receive a real time update
			 

		});

	    socket.on('open', function (req, cb) {
	    	// request comes in with start, end, type, 
	    	// assume user known through socket at this point: associative array of users accessed by socket.id
	    	// db action
	    	// push notify
	    	events.insert({ start: req.data.start, end: req.data.end, 
	    					type: req.data.type, attending:[ clients[1].user.id ] }, 
	    	function (err, added) {
	    		if(err) err_handler(err,cb); 
	    		else return cb({});
	    	});

	    	socket.broadcast.emit('1open',req.otb);
	    });

	    socket.on('join', function (req, cb) {
	    	// db
	    	// push notify
			events.insert(req.body, function (err, added) {
				if(err) console.log(err);
				return res.json(added[0]);
			});

	    	socket.broadcast.emit('2join',req.evt);
	    	return cb({}); // return event
	    });

	    socket.on('newUser', function (req, cb) {
	    	// db
	    	users.insert(req.body, function (err, added) {
				if(err) console.log(err);
				return res.json(added[0]);
			});

	    });

	}); 


	app.get('/event/:id', function (req, res) {
		events.find({ _id: Number(req.params.id) }).toArray( function (err, found) {
			if(err) console.log(err);
			res.json(found[0]);
		});
	});


	server.listen(3000,function(){
		console.log('Listening on port 3000');
	});

});

function err (err, cb) {
	console.log(err);
	return cb({error:err});
};


// clients connected by sockets emit events to friends
//  

