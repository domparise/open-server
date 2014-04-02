var express = require('express'),
	db = require('./db/mysql.js'),
	config = require('./config.js'),
	sockets = require('./sockets.js'),
	util = require('util'),
	fs = require('fs'),
	hat = require('hat');

var logStream = fs.createWriteStream('logs/app-'+String(Date.now())+'.txt');
function log (str, obj) {
	logStream.write(Date.now()+', '+str+', '+util.format('%j',obj)+'\n');
}

server.listen(3000,function(){
	log('Listening',{});
	console.log('Listening on port 3000');
});

sockets.handle(db.authenticate, bind, newUser, newOtb, db.newActivity, update, db.fetch, db.fetchAll );

function bind (uid, socket, cb) {
	db.fetchFriends(data.uid, function (friends) {
		friends.forEach( function (f) {
			socket.join('user:'+f.uid);
		});
		db.fetchAttended(data.uid, function (events) {
			events.forEach( function (e) {
				socket.join('event:' + e.eid);
			});
			return cb({});
		});
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
		return socket.broadcast.to('user:'+uid).emit('newOtb', response);
	});
	// push notify
}

function newActivity (type, title, verb, cb) {
	db.newActivity(type, title, verb, function (aid) {
		return cb({aid:aid});
	});
};

function update (type, id, update, socket, cb) {
	var room = String(id);
	var response = { update: update };
	if (type === 'updateEvent') {
		room = 'event:'+room;
		response.eid = eid;
	} else if (type === 'updateUser') {
		room = 'user:'+room;
		response.uid = uid;
	}
	db.update(type, id, update, function () {
		cb({});
		return socket.broadcast.to(room).emit(type,response);
	});
};


process.on("uncaughtException", function(err) { console.log(err); });