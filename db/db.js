var config = require('../config.js'),
	mysql = require('mysql'),
	mongo = require('mongodb'),
	ObjectID = mongo.ObjectID;
var sql = mysql.createConnection(config.mysql);

exports.init = function (cb) {
	sql.connect( function (err) {
		if(err) console.log(err);
	mongo.MongoClient.connect('mongodb://localhost/open', function (err,db) {
		if(err) console.log(err);

		db.collection('user').remove(function(){});

		var User = function (id) {
			var uid = id;
			var users = db.collection('user');
			this.open = function (start,end,cb) { // assuming valid input
				var time = Date.now() * 1000;
				sql.query('insert Event (start,end,creator,lastUpdate) values (?,?,?,?)', [start,end,uid,time], function (err, res) { // want to make sure correct eid is used
					if(err) console.log(err);
					return cb({ eid:res.insertId });
				});
			};
			this.join = function (otb,join,cb) { // (otb eid, join eid, uid of other) // add options later
				var time = Date.now() * 1000;
				sql.query('select j.numAttending as num, j.start as js, j.end as je, j.creator as oid, o.start as os, o.end as oe from Event j, Event o where j.eid = ? and o.eid = ?', [join,otb], function (err, res) {
					if(err) console.log(err);
					var evt = res[0];
					sql.query('delete from Event where eid = ?', [otb], function (err, result) {
						if(err) console.log(err);
						if (evt.num === 1) { // joining an otb
							sql.query('update Event set start = ?, end = ?, numAttending = 2, lastUpdate = ? where eid = ?', [Math.max(evt.js,evt.os),Math.min(evt.je,evt.oe),time,join], function (err, res) {
								if(err) console.log(err);
								sql.query('insert Attends (uid,eid,lastUpdate) values (?,?,?),(?,?,?)', [uid,join,time,evt.oid,join,time], function (err, res) {
									if(err) console.log(err);
									return cb({ eid:join });
								});
							});
						} else { // joining an event
							sql.query('update Event set numAttending = numAttending + 1, lastUpdate = ? where eid = ?', [time,join], function (err, res) {
								if(err) console.log(err);
								sql.query('insert Attends (uid,eid,lastUpdate) values (?,?,?)', [uid,join,time], function (err, res) {
									if(err) console.log(err);
									return cb({ eid:join });
								});
							});
						}
					});
				});
			};
		};

		var Utility = {
			newUser: function (email,name,cb) {
				sql.query('insert User (email) values (?)', [email], function (err, res) {
					if(err) console.log(err);
					var user = new User(res.insertId);
					db.collection('user').insert({ _id: res.insertId, email: email, name:name }, function (err, added) {
						if(err) console.log(err);
						user.info = added[0];
						return cb(user);
					});
				});
			}
		}

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

		return cb( User, Utility );
	})});
};