var io = require('socket.io-client');
var socket = io.connect('http://0.0.0.0:3000');
socket.on('connect', function () {
	console.log('connected');
	// console.log(socket);

	socket.emit('auth',{
		id: 'user',
		token: 3
	});

	socket.on('authAnswer',function (data) {
		console.log(data);
		return socket.emit('join',{event:3});
	});


	socket.on('otb',function (data){
		console.log(data);
		return;
	});

	socket.on('disconnect',function(){
		return console.log('disconnected');
	});

	socket.on('reconnect',function(){
		return console.log('reconnected');
	});
});