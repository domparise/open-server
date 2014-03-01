config = require('../config.js'),
	mysql = require('mysql');
	var sql = mysql.createConnection(config.mysql);

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
	sql.query('insert into Event(start,end,type) values (?,?,?)', [data.uid,data.start,data.end,data.type], function (err, res) {
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
exports.joinEvent = function (uid, otb, join, cb) {
	sql.query('insert into Attends(uid,eid) values (?,?)', [uid,join], function (err, res) {
		if(err) error(err,cb);
		if(otb !== 0) {
			sql.query('delete from Event where eid=?', [otb], function (err, res) {
				if(err) error(error,cb);
				return cb({});
			});
		}
		return cb({});
	});
};

exports.updateEvent = function (uid, eid, cb) {
	sql.query('insert into Attends(uid,eid) values (?,?)', [uid,join], function (err, res) {
		if(err) error(err,cb);
		if(otb !== 0) {
			sql.query('delete from Event where eid=?', [otb], function (err, res) {
				if(err) error(error,cb);
				return cb({});
			});
		}
		return cb({});
	});
};


function error (err,cb) {
	console.log(err);
	return cb(false);
};