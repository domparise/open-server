var db = require('./db/mysql.js'),
	config = require('./config.js'),
	sockets = require('./sockets.js'),
	push = require('./push/push.js'),
	util = require('util'),
	fs = require('fs'),
	connected = {};

var logStream = fs.createWriteStream('logs/app-'+String(Date.now())+'.txt');
function log (str, obj) {
	logStream.write(Date.now()+', '+str+', '+util.format('%j',obj)+'\n');
}

//////////// pubsub ////////////

function pubsub (room, uid) {
	if (!(room in connected)) connected[room] = {};
	connected[room][uid] = true;
}
function unpubsub (uid) {
	for (var room in connected) {
		delete connected[room][uid];
	}
}
function uids (room, uid) {
	return Object.keys(connected[room]).map(function(elt){return elt;});
}

/////////////// socket handlers ////////////////

sockets.handle( db.authenticate, bind, add, update, push.fetch, unpubsub);

function bind (uid, socket, cb) {
	db.fetchFriends(uid, function (friends) {
		friends.forEach( function (f) {
			socket.join('user:'+f.uid);
			pubsub('user:'+f.uid,uid);
		});
		db.fetchAttended(uid, function (events) {
			events.forEach( function (e) {
				socket.join('event:'+e.eid);
				pubsub('event:'+e.eid,uid);
			});
			return cb({});
		});
	});
}

function add (uid, type, info, socket, cb) {
	if (type == 'user') 
		newUser( info.name, info.email, info.authToken, socket, cb);
	else if (type == 'event')
		newOtb( uid, info.start, info.end, info.aid, socket, cb);
	else if (type == 'activity') 
		newActivity( uid, info.type, info.title, info.verb, socket, cb);
	else if (type == 'join')
		joinEvent( uid, info.eid, info.evts, socket, cb);
}

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
}

function newOtb (uid, start, end, aid, socket, cb) {
	db.newOtb(uid,start,end,aid, function(eid) {
		socket.join('event:'+eid);
		cb({eid:eid});
		var res = {
			eid  : eid,
			start: start,
			end  : end,
			aid  : aid,
			attendees:[uid]
		};
		socket.broadcast.to('user:'+uid).emit('newOtb', res);
		return push.friends(uid, uids('user:'+uid,uid), {evt:'newOtb',info:res});
	});
}

function newActivity (uid, type, title, verb, cb) {
	db.newActivity( type, title, verb, function (aid) {
		cb({aid:aid});
		var res = {
			aid: aid,
			type: type,
			title: title,
			verb: verb
		};
		socket.broadcast.to('user:'+uid).emit('newAct', res);
		return push.friends(uid, uids('user:'+uid,uid), {evt:'newAct',info:res});
	});
}

function joinEvent (uid, eid, evts, socket, cb) {
	db.joinEvent(uid, eid, function () {
		socket.join('event:'+eid);
		cb({});
		var res = {
			uid: uid,
			eid: eid
		};
		socket.broadcast.to('event:'+eid).emit('joinEvent', res);
		return push.event(uid, uids('event:'+eid,uid), {evt:'joinEvent', info:res});
	});
}

function update (data, socket, cb) {
	var room = String(data.type)+':'+String(data.iden);
	var res = { 
		type: data.type,
		iden: data.iden,
		field: data.field,
		value: data.value
	};
	db.update(data, function () {
		cb({});
		socket.broadcast.to(room).emit('newUpdate',res);
		return push.event(uid, uids(room,uid), {evt:'newUpdate', info:res});
	});
}

process.on("uncaughtException", function(err) { console.log(err); });