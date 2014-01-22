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


db.init( function (User) {	
// db validation & error handling here

	app.post('/open', function (req, res) {

	});
	app.io.route('open', function (req) {
		// want req.data to include {start, end}
		console.log( req );

	});


	app.post('/join', function (req, res) {

	});
	app.io.route('join', function (req) {
		// want req.data as (at least) 
		// {otb-eid, join-eid, join-uid}
		// with uid from auth headers


	});


	app.post('/newUser', function (req, res) {

	});
	app.io.route('newUser', function (req) {

	});

	app.listen(3000,function(){
		console.log('Listening on port 3000');
	});

});

// clients connected by sockets emit events to friends
//  

