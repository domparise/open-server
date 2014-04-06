var config = require('../config.js'),
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
exports.newOtb = function (uid, start, end, aid, cb) {
	sql.query('insert into Event(start,end,aid) values (?,?,?)', [start,end,aid], function (err, res) {
		if(err) error(err,cb);
		sql.query('insert into Attends(uid,eid) values (?,?)', [uid,res.insertId], function (err, result) {
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

// creating a new activity
exports.newActivity = function (type, title, verb, cb) {
	sql.query('insert into Activity(type,title,verb) values (?,?,?)', [type,title,verb], function (err, res) {
		if(err) error(err,cb);
		return cb({aid:res[0].insertId});
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

///////////////// New Methods /////////////////

exports.update = function (type, id, update, cb) {
	var table = '';
	var idType = '';
	if (type === 'updateUser') {
		table = 'User';
		idType = 'uid';
	} else if (type === 'updateEvent') {
		table = 'Event';
		idType = 'eid';
	}
	sql.query('update ?? set ? where ??=?',[table,update,idType,id], function (err, res) {
		if(err) error(err, cb);
		return cb({});
	});
};

exports.fetch = function (type, value, cb) {
	var table = '';
	if (type === 'uid') table = 'User';
	else if (type === 'eid') table = 'Event';
	else if (type === 'aid') table = 'Activity';
	sql.query('select * from ?? where ??=?',[table,type,value], function (err, res) {
		if(err) error(err,cb);
		else if (type === 'eid') {
			sql.query('select uid from Attends where eid=?',[eid], function (err, result) {
				if(err) error(err,cb);
				var attends = [];
				for (var i = 0; i < result.length; i++) {
					attends.push(result[i].uid);
				}
				return cb({
					eid:eid,
					start: res[0].start,
					end: res[0].end,
					aid: res[0].aid,
					attendees: attends
				});
			});
		}
		else return cb(res[0]);
	});
};

exports.fetchAll = function (type, cb) {
	error('not implemented',cb);
}


function error (err,cb) {
	console.log(err);
	logError(err);
	return cb(false);
};