config = require('../config.js'),
	mysql = require('mysql');
	var sql = mysql.createConnection(config.mysql);

// gathers friends list, for binding a user
exports.friends = function (uid, cb) {
	sql.query('select f2 as uid from Friends where f1=? and visible=1',[uid], function (err, res) {
		if(err) error(err,cb);
		return cb(res); 
	});
};

// gathers attending list, for binding user
exports.attends = function (uid, cb) {
	sql.query('select eid from Attends where uid=?', [uid], function (err, res) {
		if(err) error(err,cb);
		return cb(res);
	});
};

// new otb
exports.open = function (uid, otb, cb) {
	sql.query('insert into Event(start,end,type) values (?,?,?)', [uid,otb.start,otb.end,otb.type], function (err, res) {
		if(err) error(err,cb);
		sql.query('insert into Attends(uid,eid) values (?,?)', [uid,res.insertId], function (err, result) {
			if(err) error(err,cb);
			return cb(res.insertId);
		});
	});
};

// join otbs
exports.join = function (uid, otb, join, cb) {
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