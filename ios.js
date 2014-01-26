var express = require('express');
var app = express();

var io = require('socket.io').listen(3000);

io.sockets.on('connection', function (socket) {
	console.log(socket.id);
	socket.on('sup', function (data) {
		console.log(data);
		console.log('sup event');
	});
    socket.emit('yolo', {yolo:'dolo',solo:'dolo'});

}); 
