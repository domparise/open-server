var express = require('express.io'),
	fs = require('fs'),
	db = require('./db/db.js'),
	config = require('./config.js');

app = express();
app.https(config.keys).io();
// app.http().io();

app.use(express.cookieParser());
app.use(express.session({secret: 'yolo'}));
app.use(express.static('test'));

app.get('/', function (req, res) {
	res.sendfile('test/test.html');
});


db.init( function (User, Utility) {	
// db validation & error handling here


/*	Utility.newUser('dom@dom','dom', function (user1) {
		Utility.newUser('joe@joe','joe', function (user2) {
			user1.open(1,5, function(otb) {
				user2.open(2,6,function(join) {
					user1.join(otb.eid,join.eid,function(res) {
						console.log(res);
					});
				});
			});
		});
	});*/


	app.post('/open', function (req, res) {

	});
	app.io.route('open', function (req) {
		// want req.data to include {start, end}
		req.session.user.open(req.data.start,req.data.end, function (eid) {
			req.io.respond(eid);
			eid.uid = req.session.user.info._id;
			req.io.join('evt-'+eid.eid);
			req.io.broadcast('newOTB', eid);
		});

	});


	app.post('/join', function (req, res) {

	});
	app.io.route('join', function (req) {
		// want req.data as (at least) 
		// {otb-eid, join-eid}
		// with uid from auth headers
		req.io.leave('evt-'+req.data.otb);
		req.session.user.join(req.data.otb,req.data.join, function(eid) {
			req.io.respond(eid);
			eid.uid = req.session.user.info._id;
			req.io.room('evt-'+eid.eid).broadcast('joined', eid);
			req.io.join('evt-'+eid.eid);
		});

	});


	app.post('/newUser', function (req, res) {

	});
	app.io.route('newUser', function (req) {
		Utility.newUser(req.data.email,req.data.name, function(user) {
			req.session.user = user;
			req.session.save( function () {
				req.io.respond({id:user.info._id});
			});
		});
	});

	app.listen(3000,function(){
		console.log('Listening on port 3000');
	});

});

// clients connected by sockets emit events to friends
//  

