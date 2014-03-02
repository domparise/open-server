var express = require('express'),
	db = require('./db/mysql.js'),
	config = require('./config.js'),
	app = express(),
	server = require('https').createServer(config.keys,app),
	io = require('socket.io').listen(server, {log:false}),
	util = require('util');

server.listen(3000,function(){
	console.log('Listening on port 3000');
});


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

	// 'bind' a socket to events attending and friends, so they receive a real time updates
	// pubsub
	//
	socket.on('bind', function (data, cb) {
		db.getFriends(data.user, function (friends) {
			friends.forEach( function (f) {
				// console.log('friend:'+f.uid);
				socket.join('friend:'+f.uid);
			});
		});

		db.getAttended(data.user, function (events) {
			events.forEach( function (e) {
				// console.log('event:' + e.eid);
				socket.join('event:' + e.eid);
			});
		});
	});

// setTimeout(function() {
// socket.emit('joinEvent',{
// uid:2,
// eid:14
// });
// },2000);

	// requires: {uid,start,end,type}
	// emits: newOtb:{eid,start,end,type,attendees[]}
	// returns: {eid}
    socket.on('open', function (data, cb) {
		console.log(util.format('OPEN: %j',data));
		db.newOtb(data, function(eid) {
			cb({eid:eid});
			return socket.broadcast.to('friend:'+data.uid).emit('newOtb', {
				eid:eid,
				start:data.start,
				end:data.end,
				type:data.type,
				attendees:[data.uid]
			});
		});
		// push notify
	});

	// requires: {uid,eid}
	// emits: {uid,eid}
		//
	socket.on('join', function (data, cb) {
		console.log(util.format('JOIN: %j',data));
		db.joinEvent(data.uid, data.eid, function () {
			cb({});
			return socket.broadcast.to('event:'+data.eid).emit('joinEvent',data);
		});
		// push notify
	});

	// requires: {uid,eid,field,value}
	// emits: {eid,field,value}
	//
	socket.on('update', function (data, cb) {
		console.log(util.format('UPDATE: %j',data));
		// db
		// push notify

		socket.emit('joinEvent',data.evt);
		return cb({}); // return event
	});

	socket.on('newUser', function (data, cb) {
		console.log(data);
		// db
		return cb({});
	});

}); 

