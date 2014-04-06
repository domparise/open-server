var config = require('../config.js'),
	mysql = require('mysql');
	var sql = mysql.createConnection(config.mysql);

var errorStream = require('fs').createWriteStream('logs/pushDbError-'+String(Date.now())+'.txt');
function logError (str) {
	errorStream.write(Date.now()+', '+str+'\n');
};

function fetchDevices (users, note, cb) {
	var arr = users.map(function (elt) {return elt.uid});
	sql.query('select deviceToken,noteCount from User where uid=?', [arr], function (err, res) {
		if(err) error(err,cb);
		return cb(res);
	});
};

function addNotification (users, note, cb) {
	var arr = users.map(function (elt) {return [elt.uid,note]});
	sql.query('insert into Notification (uid,json) values ?', [arr], function (err, res) {
		if(err) error(err,cb);
		return fetchDevices(users, note, cb);
	});
};

// requires socketUsers as array of uids
exports.notifyFriends = function (uid, connectedUsers, note, cb) {
	sql.query('select uid from Friends where f1=? and visible=1 and f2!=?', [uid, connectedUsers], function (err, res) {
		if(err) error(err,cb);
		return addNotification(res,note,cb);
	});
};

// requires socketUsers as array of uids
exports.notifyEvent = function (eid, connectedUsers, note, cb) {
	sql.query('select uid from Attends where eid=? and uid!=?', [eid,connectedUsers], function (err, res) {
		if(err) error(err,cb);
		return addNotification(res,note,cb);
	});
};

exports.fetchNotifications = function (uid, cb) {
	sql.query('select json from Notification where uid=?', [uid], function (err, res) {
		if(err) error(err,cb);
		return cb(res);
	});
};

function error (err,cb) {
	console.log(err);
	logError(err);
	return cb(false);
};