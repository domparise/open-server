config = require('../config.js'),
	mysql = require('mysql');
	var sql = mysql.createConnection(config.testMysql),
	util = require('util'),
	fs = require('fs');

var errorStream = fs.createWriteStream('logs/dbError-'+String(Date.now())+'.txt');
function logError (str) {
	errorStream.write(Date.now()+', '+str+'\n');
};

// gathers friends list, for binding a user
exports.getFriends = function (uid, cb) {
	sql.query('select f2 as uid from Friends where f1=? and visible=1',[uid], function (err, res) {
		if(err) error(err,cb);
		return cb(res); 
	});
};

// gathers attending list, for binding user
exports.getAttended = function (uid, cb) {
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
		if (res.length === 1) return true;
		else return false;
	});
};

function error (err,cb) {
	console.log(err);
	logError(err);
	return cb(false);
};