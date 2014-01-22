var io = require('socket.io-client');
var socket = io.connect('https://0.0.0.0:3000', {secure: true});
socket.on('connect', function () {
	console.log('connected');
	// console.log(socket);

	socket.emit('auth',{
		name: 'user',
		token: 3
	});

	socket.on('authAnswer',function (data) {
		console.log(data);
		return socket.emit('open',{start:3,end:5});
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