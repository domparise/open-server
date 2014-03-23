var express = require('express'),
	db = require('./db/mysql.js'),
	config = require('./config.js'),
	app = express(),
	server = require('https').createServer(config.keys,app),
	io = require('socket.io').listen(server, {log:false}),
	util = require('util'),
	fs = require('fs'),
	exec = require('child_process').exec,
	hat = require('hat');

var logStream = fs.createWriteStream('logs/app-'+String(Date.now())+'.txt');
function log (str, obj) {
	logStream.write(Date.now()+', '+str+', '+util.format('%j',obj)+'\n');
}

server.listen(3000,function(){
	log('Listening',{});
	console.log('Listening on port 3000');
});

io.configure(function (){
	// requires: {uid,authToken}
	io.set('authorization', function (handshake, cb) {
		log('auth handshake',handshake.query);
		console.log('handshaking');
		if (handshake.query.uid === '0' && handshake.query.authToken === 'newUser'){
			log('unknown user handshaking',handshake.query);
			return cb(null, true);
		} else if (handshake.query.uid > 0) {
			log('known user handshaking',handshake.query);
			var ans = db.authenticate(handshake.query.uid,handshake.query.authToken);
			console.log(ans);
			return cb(null, ans);
		} else {
			return cb(null, false);
		}
	});
});
// user known at this point

var unknownUsers = {};
io.sockets.on('connection', function (socket) {
	log('CONNECTION',{socket:socket.id});

	// 'bind' a socket to events attending and friends, so they receive a real time updates; pubsub
	// requires: {uid}
	// returns: success: {}, failure: {error}
	socket.on('bind', function (data, cb) {
		log('BIND',data);
		if (data.uid === 0) {
			// if user unknown, allows 5 seconds to create new user
			var authToken = hat();
			log('generating authToken for unknown user',{authToken:authToken});
			unknownUsers[socket.id] = {
				authToken: authToken,
					timeout: setTimeout( function() {
					socket.disconnect();
					delete unknownUsers[socket.id];
				}, 5000)
			};
			return cb({authToken:authToken});
		}
		db.fetchFriends(data.uid, function (friends) {
			friends.forEach( function (f) {
				socket.join('friend:'+f.uid);
			});
			db.fetchAttended(data.uid, function (events) {
				events.forEach( function (e) {
					socket.join('event:' + e.eid);
				});
				return cb({});
			});
		});
	});

	// requires: {name,email,authToken}
	// returns: {uid}
	socket.on('newUser', function (data, cb) {
		log('NEWUSER',data);
		if (unknownUsers[socket.id].authToken === data.authToken) {
			clearTimeout(unknownUsers[socket.id].timeout);
			db.newUser(data.name,data.email,data.authToken, function (uid) {
				return cb({uid:uid});
			});
		}
	});

	// requires: {uid,start,end,aid}
	// emits: newOtb:{eid,start,end,aid,attendees[]}
	// returns: success: {eid}, failure: {error}
	socket.on('open', function (data, cb) {
		log('OPEN',data);
		console.log(util.format('OPEN: %j',data));
		db.newOtb(data, function(eid) {
			log('open',{returned:eid,broadcast:{
				eid  : eid,
				start: data.start,
				end  : data.end,
				aid : data.aid,
				attendees:[data.uid]
			}});
			socket.join('event:'+eid);
			cb({eid:eid});
			return socket.broadcast.to('friend:'+data.uid).emit('newOtb', {
				eid  : eid,
				start: data.start,
				end  : data.end,
				aid : data.aid,
				attendees:[data.uid]
			});
		});
		// push notify
	});

	// requires: {uid,eid,deletes[]}
	// emits: {uid,eid}
	// returns: success: {}, failure: {error}
	socket.on('join', function (data, cb) {
		log('JOIN',data);
		console.log(util.format('JOIN: %j',data));
		db.joinEvent(data.uid, data.eid, function () {
			log('join',{broadcast:{
				uid: data.uid,
				eid: data.eid
			}});
			cb({});
			return socket.broadcast.to('event:'+data.eid).emit('joinEvent',{
				uid: data.uid,
				eid: data.eid
			});
		});
		// push notify
	});

	// requires: {uid,eid,field,value}
	//	field: [start,end,type,location]
	// emits: {eid,field,value}
	// returns: success: {}, failure: {error}
	socket.on('update', function (data, cb) {
		log('UPDATE',data);
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

	// requires: {eid}
	// returns: {eid,start,end,aid,attendees[]}
	socket.on('fetchEvent', function (data, cb) {
		log('FETCHEVENT',data);
		db.fetchEvent(data.eid, function(evnt) {
			return cb(evnt);
		});
	});

	// returns [{eid,start,end,aid,attendees[...]},...]
	socket.on('fetchEvents', function (data, cb) {
		log('FETCHEVENTS',data);
		db.fetchAllEvents(function (events) {
			db.fetchAllAttendees(function (attendees) {
				for(var i = 0; i < events.length; i++) {
					events[i].attendees = [];
					for(var j = 0; j < attendees.length; j++) {
						if(attendees[j].eid === events[i].eid) {
							events[i].attendees.push(attendees[j].uid);
						}
					}
				}
				return cb(events);
			});
		});
	});

	// returns: [{uid,name},...]
	socket.on('fetchFriends', function (data, cb) {
		log('FETCHFRIENDS',data);
		db.fetchFriends(function(friends) {
			return cb(friends);
		});
	});

	// requires: {uid,type,title,verb}
	// returns: {aid}
	socket.on('createActivity', function (data, cb) {
		log('CREATEACTIVITY',data);
		db.createActivity(data.type, data.title, data.verb, function (aid) {
			return cb({aid:aid});
		});
	});

	// requires: {uid,aid}
	// returns: {aid,type,title,verb}
	socket.on('fetchActivity', function (data, cb) {
		log('FETCHACTIVITY',data);
		db.fetchActivity(data.aid, function (activity) {
			return cb(activity);
		});
	});

	socket.on('disconnect', function () {
		log('DISCONNECT',{socket:socket.id});
	});
});

app.post('/api/gitpush', function (req, res) {
	exec('git pull', function() {
		console.log('pulled update from github');
	});
});

process.on("uncaughtException", function(err) { console.log(err); });