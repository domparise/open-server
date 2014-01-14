var io = require('socket.io-client');
var socket = io.connect('http://0.0.0.0:3000');
socket.on('connect', function () {
	console.log('connected');

	socket.emit('open',{
		start: 1,
		end: 3
	});

});
socket.on('custom event', function () {
  // server emitted a custom event
});
socket.on('disconnect', function () {
  // socket disconnected
});