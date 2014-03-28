config = require('../config.js'),
	mysql = require('mysql');
	var sql = mysql.createConnection(config.mysql),
	util = require('util'),
	fs = require('fs');

var errorStream = fs.createWriteStream('logs/dbError-'+String(Date.now())+'.txt');
function logError (str) {
	errorStream.write(Date.now()+', '+str+'\n');
};

// gathers friends list, for binding a user
exports.fetchFriends = function (uid, cb) {
	// sql.query('select f2 as uid from Friends where f1=? and visible=1',[uid], function (err, res) {
	sql.query('select uid,name from User where uid!=?',[uid], function (err, res) {
		if(err) error(err,cb);
		return cb(res); 
	});
};

exports.makeFriends = function (uid1, uid2, cb) {
	sql.query('insert into Friends(f1,f2) values (?,?)', [uid1,uid2], function (err, res) {
		if(err) error(err,cb);
		return cb();
	});
};

exports.fetchAllPeeps = function (cb) {
	sql.query('select uid,name from User', function (err, res) {
		if(err) error(err,cb);
		return cb(res);
	});
};

// gathers attending list, for binding user
exports.fetchAttended = function (uid, cb) {
	sql.query('select eid from Attends where uid=?', [uid], function (err, res) {
		if(err) error(err,cb);
		return cb(res);
	});
};

// new otb
exports.newOtb = function (data, cb) {
	sql.query('insert into Event(start,end,aid) values (?,?,?)', [data.start,data.end,data.aid], function (err, res) {
		if(err) error(err,cb);
		sql.query('insert into Attends(uid,eid) values (?,?)', [data.uid,res.insertId], function (err, result) {
			if(err) error(err,cb);
			return cb(res.insertId);
		});
	});
};

// join otbs
// deletes/ merges with overlapping otbs
// adds to attending list for event
// current simple version just adds to attends
//
exports.joinEvent = function (uid, eid, cb) {
	sql.query('insert into Attends(uid,eid) values (?,?)', [uid,eid], function (err, res) {
		if(err) error(err,cb);
		return cb({});
	});
};

// update event information
//
exports.updateEvent = function (eid, field, value, cb) {
	sql.query('update Event set ??=? where eid=?', [field,value,eid], function (err, res) {
		if(err) error(err,cb);
		return cb({});
	});
};

exports.updateUser = function (uid, update, cb) {
	sql.query('update User set ? where uid=?',[update,uid], function (err, res) {
		if(err) error(err,cb);
		return cb({});
	});
};

// creating a new activity
exports.createActivity = function (type, title, verb, cb) {
	sql.query('insert into Activity(type,title,verb) values (?,?,?)', [type,title,verb], function (err, res) {
		if(err) error(err,cb);
		return cb(res.insertId);
	});
};

exports.fetchActivity = function (aid, cb) {
	sql.query('select * from Activity where aid=?', [aid], function (err, res) {
		if(err) error(err,cb);
		return cb({aid:res[0].aid,type:res[0].type,title:res[0].title,verb:res[0].verb});
	});
};

exports.newUser = function (name, email, authToken, cb) {
	sql.query('insert into User(name,email,authToken) values (?,?,?)', [name,email,authToken], function (err, res) {
		if(err) error(err,cb);
		return cb(res.insertId);
	});
};

exports.authenticate = function (uid, authToken, cb) {
	sql.query('select name from User where uid=? and authToken=?', [uid,authToken], function (err, res) {
		if(err) error(err,cb);
		if (res) return cb(true);
		else return cb(false);
	});
};

exports.fetchEvent = function (eid, cb) {
	sql.query('select eid,start,end,aid from Event where eid=?',[eid], function (err, evt) {
		if(err) error(err,cb);
		sql.query('select uid from Attends where eid=?',[eid], function (err, res) {
			if(err) error(err,cb);
			var attnds = [];
			for (var i = 0; i < res.length; i++) {
				attnds.push(res[i].uid);
			}
			return cb({
				eid:eid,
				start:evt[0].start,
				end:evt[0].end,
				aid:evt[0].aid,
				attendees:attnds
			});
		});
	});
}

// hack kind of thing
exports.fetchAllEvents = function (cb) {
	time = Math.floor(Date.now()/1000);
	sql.query('select eid,start,end,aid from Event where start>?', [time], function (err, res) {
		if(err) error(err,cb);
		return cb(res);
	});
};

exports.fetchAllAttendees = function (cb) {
	sql.query('select uid,eid from Attends', function (err, res) {
		if(err) error(err,cb);
		return cb(res);
	});
};

exports.devicesForEventPush = function (eid, sockets, cb) {
	sql.query('select u.deviceToken from Attends a, User u where a.eid=? and a.uid=u.uid and a.uid!=?', [eid,sockets], function (err, res) {
		if(err) error(err,cb);
		return cb(res);
	});
};

// requires: sockets: [uid,uid,...]
exports.devicesForFriendPush = function (uid, sockets, cb) {
	sql.query('select u.deviceToken from Friends f, User u where u.uid!=? and u.uid!=? and ((f.f1=u.uid and f.f2=?)or(f.f1=? and f.f2=u.uid))', [uid,sockets,uid,uid], function (err, res) {
		if(err) error(err,cb);
		return cb(res);
	});
};

function error (err,cb) {
	console.log(err);
	logError(err);
	return cb(false);
};