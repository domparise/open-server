var config = require('../config.js'),
	// mysql = require('mysql'),
	mongo = require('mongodb'),
	ObjectID = mongo.ObjectID;
// var sql = mysql.createConnection(config.mysql);

exports.init = function (cb) {
	mongo.MongoClient.connect('mongodb://localhost/open', function (err,db) {
		if(err) console.log(err);

		db.collection('user').remove(function(){}); // users keep track of their otbs, stick to nosql
		db.collection('event').remove(function(){});

		var users = db.collection('user'),
			events  = db.collection('events');
			users.ObjectID = ObjectID;

//join

/*//// EVENTS ////
Join:
	assuming users only see events they can join, and assuming otbs overlap (only can join overlapping otb)
	- load event
	- check if their OTB overlaps 
		- if !otb, simple join (with db top action)
		- take event of higher eventId, start = max(starts), end = min(ends)
		- ask if users want to suggest attributes
	- no open time after overlaps

Open:
	- if attending event during added OTB, add remainder as OTB(s)
	- no 'negative' times, if open currently, otb starts when requested
	- if already open during new otb, extend current otb

Update event:
	changes to start/end time modify all otbs of active users who have otbs before/after event
	if attributes not all set, users can suggest them

*/

		return cb( users,events );
		// treat otbs as events, but with single user attending
		// core data users are keeping track of their own otbs, and any otb appearing on a feed is attendable

	});
};