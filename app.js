var restify = require('restify'),
	fs = require('fs'),
	socketio = require('socket.io'),
	db = require('./db.js'),
	clients = {};

var app = restify.createServer();
var io = socketio.listen(app);

app.listen(3000,function(){
	console.log('Listening on port 3000');
});

db.init(function(Users,Events){	
	// db validation & error handling here
	// Users.refresh();
	// Events.refresh();

	io.sockets.on('connection', function (socket) { 
		//try to use closures here to set socket?
// on connection, validate user or make new user, and load model from db
		clients[socket.id] = socket;
// challenge userid and token
		socket.on('auth', function (user) {
			Users.ask(user.id, user.token, function (user) {
				console.log('authenticated');
				clients[socket.id].user = user;
				socket.emit('authAnswer',user);
			});
		});

		socket.on('open', function (data) {
			console.log('open:');
			Events.newOtb(clients[socket.id].user[0], data, function (otb) {
				socket.emit('otb',otb);			
			});
		});

		socket.on('join', function (data) {
			Events.join(clients[socket.id].user[0], data, function (event) {
				socket.emit('event',event);
			});
		});

		socket.on('disconnect',function(){
			delete clients[socket.id];
			console.log(clients);
		});
	});
});

// clients connected by sockets emit events to friends
//  