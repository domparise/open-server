var express = require('express'),
	db = require('./db/mysql.js'),
	config = require('./config.js'),
	app = express(),
	server = require('https').createServer(config.keys,app),
	io = require('socket.io').listen(server, {log:false}),
	util = require('util'),
	fs = require('fs');

var logStream = fs.createWriteStream('logs/app-'+String(Date.now())+'.txt');
function log (str, obj) {
	logStream.write(Date.now()+', '+str+', '+util.format('%j',obj)+'\n');
}

server.listen(3000,function(){
	console.log('Listening on port 3000');
});

io.configure(function (){
	io.set('authorization', function (handshake, cb) {
		log('auth handshake',handshake.query);
		if(handshake.query.user < 10)
			return cb(null, true); 
		else
			return cb(null, false);
	});
});
// user known at this point

io.sockets.on('connection', function (socket) {
	log('CONNECTION',{socket:socket.id});

	// 'bind' a socket to events attending and friends, so they receive a real time updates; pubsub
	// requires: {uid}
	// returns: success: {}, failure: {error}
	socket.on('bind', function (data, cb) {
		log('BIND',{socket:socket.id,data:data});
		db.getFriends(data.uid, function (friends) {
			friends.forEach( function (f) {
				socket.join('friend:'+f.uid);
			});
			db.getAttended(data.uid, function (events) {
				events.forEach( function (e) {
					socket.join('event:' + e.eid);
				});
				return cb({});
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
	// returns: success: {eid}, failure: {error}
	socket.on('open', function (data, cb) {
		log('OPEN',{socket:socket.id,data:data});
		console.log(util.format('OPEN: %j',data));
		db.newOtb(data, function(eid) {
			cb({eid:eid});
			return socket.broadcast.to('friend:'+data.uid).emit('newOtb', {
				eid  :eid,
				start:data.start,
				end  :data.end,
				type :data.type,
				attendees:[data.uid]
			});
		});
		// push notify
	});

	// requires: {uid,eid,deletes[]}
	// emits: {uid,eid}
	// returns: success: {}, failure: {error}
	socket.on('join', function (data, cb) {
		log('JOIN',{socket:socket.id,data:data});
		console.log(util.format('JOIN: %j',data));
		db.joinEvent(data.uid, data.eid, function () {
			cb({});
			return socket.broadcast.to('event:'+data.eid).emit('joinEvent',{
				uid: data.uid,
				eid: data.eid
			});
		});
		// push notify
	});

	// requires: {uid,eid,field,value}
	//	field as in [start,end,type,location]
	// emits: {eid,field,value}
	// returns: success: {}, failure: {error}
	socket.on('update', function (data, cb) {
		log('UPDATE',{socket:socket.id,data:data});
		console.log(util.format('UPDATE: %j',data));
		db.updateEvent(data.eid,data.field,data.value, function () {
			cb({});
			return socket.broadcast.to('event:'+data.eid).emit('updateEvent',{
				eid  : data.eid,
				field: data.field,
				value: data.value
			});
		});
	});

	socket.on('newUser', function (data, cb) {
		log('NEWUSER',{socket:socket.id,data:data});
		console.log(util.format('NEWUSER: %j',data));
		// db
		return cb({});
	});

	socket.on('disconnect', function () {
		log('DISCONNECT',{socket:socket.id});
	});

}); 

