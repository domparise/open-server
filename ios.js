var express = require('express'),
	config = require('./config.js'),
	app = express(),
	server = require('https').createServer(config.keys,app),
	io = require('socket.io').listen(server);

app.use(express.session());
app.use(express.cookieParser({secret:'yolo'}));

io.configure(function (){
	io.set('authorization', function (handshakeData, callback) {
		console.log(handshakeData);
		callback(null, true); 
	});
});


io.sockets.on('connection', function (socket) {

    socket.emit('1join', function (data) {
    	console.log('emit');
    });

    socket.on('auth', function (data, cb) {
    	console.log(data);
    	cb('sup');
    });
}); 

server.listen(3000);