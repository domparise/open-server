var express = require('express'),
	db = require('./db/mysql.js'),
	config = require('./config.js'),
	sockets = require('./sockets.js'),
	push = require('./push/push.js'),
	util = require('util'),
	fs = require('fs'),
	hat = require('hat'),
	connected = {};

var logStream = fs.createWriteStream('logs/app-'+String(Date.now())+'.txt');
function log (str, obj) {
	logStream.write(Date.now()+', '+str+', '+util.format('%j',obj)+'\n');
}

server.listen(3000,function(){
	log('Listening',{});
	console.log('Listening on port 3000');
});

function pubsub (room, uid) {
	if !(room in connected) connected[room] = {};
	connected[room][uid] = true;
};
function unpubsub (uid) {
	for (var room in connected) {
		delete connected[room][uid];
	}
};
function uids (room, uid) {
	return Object.keys(connected[room]).map(function(elt){return elt});
}

sockets.handle( db.authenticate, bind, add, update, db.fetch, db.fetchAll, unpubsub);

function bind (uid, socket, cb) {
	db.fetchFriends(data.uid, function (friends) {
		friends.forEach( function (f) {
			socket.join('user:'+f.uid);
			pubsub('user:'+f.uid,uid);
		});
		db.fetchAttended(data.uid, function (events) {
			events.forEach( function (e) {
				socket.join('event:'+e.eid);
				pubsub('event:'+e.eid,uid);
			});
			return cb({});
		});
	});
};

function add (uid, type, info, socket, cb) {
	if (type == 'user') 
		newUser( info.name, info.email, info.authToken, socket, cb);
	else if (type == 'event')
		newOtb( uid, info.start, info.end, info.aid, socket, cb);
	else if (type == 'activity') 
		db.newActivity( info.type, info.title, info.verb, function (aid) {
			return cb({aid:aid});
		});
};

function newUser (name, email, authToken, socket, cb) {
	db.newUser( name, email, authToken, function (uid) {
		cb({uid:uid});
		db.fetchAllPeeps(function(peeps) {
			peeps.forEach( function(elt) {
				db.makeFriends(uid,elt.uid, function () {
					if(uid !== elt.uid) socket.emit('newFriend',elt);
					socket.join('user:'+elt.uid);
				});
			});
		});
	});
};

function newOtb (uid, start, end, aid, socket, cb) {
	db.newOtb(uid,start,end,aid, function(eid) {
		var response = {
			eid  : eid,
			start: start,
			end  : end,
			aid : aid,
			attendees:[uid]
		};
		log('open',{returned:eid,broadcast:response});
		socket.join('event:'+eid);
		cb({eid:eid});
		socket.broadcast.to('user:'+uid).emit('newOtb', response);
		return push.friends(uid, uids('user:'+uid,uid), response, function() {});
	});
}

function update (uid, type, info, socket, cb) {
	var room = String(info.id);
	var response = { update: info };
	if (type === 'updateEvent') {
		room = 'event:'+room;
		response.eid = eid;
	} else if (type === 'updateUser') {
		room = 'user:'+room;
		response.uid = uid;
	}
	db.update(type, info, function () {
		cb({});
		socket.broadcast.to(room).emit(type,response);
		return push.event(uid, uids(room,uid), response, function() {});
	});
};

process.on("uncaughtException", function(err) { console.log(err); });