var express = require('express'),
	db = require('./db/db.js'),
	config = require('./config.js'),
	app = express(),
	server = require('https').createServer(config.keys,app),
	io = require('socket.io').listen(server);

db.init( function (users, events) {	
// db validation & error handling here

	io.configure(function (){
		io.set('authorization', function (req, cb) {
			req;
			return cb(null, true); 
		});
	});


	io.sockets.on('connection', function (socket) {

	    socket.on('open', function (data, cb) {
	    	// db action
	    	// push notify
	    	socket.broadcast.emit('1open',req.otb);
	    	return cb({}); // return 
	    });

	    socket.on('join', function (data, cb) {
	    	// db
	    	// push notify
			events.insert(req.body, function (err, added) {
				if(err) console.log(err);
				return res.json(added[0]);
			});

	    	socket.broadcast.emit('2join',req.evt);
	    	return cb({}); // return event
	    });

	    socket.on('newUser', function (data, cb) {
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

// clients connected by sockets emit events to friends
//  

