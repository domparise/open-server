var apn = require('apn'),
	db = require('./db.js');

var connection = new apn.Connection({'gateway':'gateway.sandbox.push.apple.com'});
var test = new apn.Device('6de845f34b2dec914bd161feca1a9a3e6ea0b448818358cac1529313c7756619');

function sendNotifications (devices, alert, json, cb) {
	var note = new apn.Notification();
	note.payload = json;
	note.alert = alert;
	devices.forEach(function (device) {
		var device = new apn.Device(device.deviceToken);
		note.badge = device.noteCount;
		connection.pushNotification(note,device);
	});
	return cb();
};

exports.friends = function (uid, connectedUsers, json, cb) {
	db.notifyFriends(uid, connectedUsers, json, function (devices) {
		var alert = 'Friend:'+String(uid)+' is open.';
		return sendNotifications(devices, alert, json, cb);
	});
};

exports.event = function (eid, connectedUsers, json, cb) {
	db.notifyEvent(eid, connectedUsers, json, function (devices) {
		var alert = 'Event:'+String(eid)+' has been updated.';
		return sendNotifications(devices, alert, json, cb);
	});
};

exports.fetch = function (uid, cb) {
	return db.fetchNotifications(uid, cb);
};