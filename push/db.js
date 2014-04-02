var config = require('../config.js'),
	mysql = require('mysql');
	var sql = mysql.createConnection(config.mysql);

var errorStream = require('fs').createWriteStream('logs/pushDbError-'+String(Date.now())+'.txt');
function logError (str) {
	errorStream.write(Date.now()+', '+str+'\n');
};

function addNotification (userRes, note, cb) {
	var arr = userRes.map(function (elt) {return [elt.uid,note]});
	sql.query('insert into Notification (uid,json) values ?', [arr], function (err, res) {
		if(err) error(err,cb);
		return cb(arr);
	});
};

// requires socketUsers as array of uids
exports.notifyFriends = function (uid, socketUsers, note, cb) {
	sql.query('select uid from Friends where f1=? and visible=1 and f2!=?', [uid, socketUsers], function (err, res) {
		if(err) error(err,cb);
		return addNotification(res,note,cb);
	});
};

exports.notifyEvent = function (eid, socketUsers, note, cb) {
	sql.query('select uid from Attends where eid=? and uid!=?', [eid,socketUsers], function (err, res) {
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

//var a2 = arr.map(function(elt) {return elt.uid});

function error (err,cb) {
	console.log(err);
	logError(err);
	return cb(false);
};