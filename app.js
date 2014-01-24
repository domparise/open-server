var express = require('express.io'),
	fs = require('fs'),
	db = require('./db/db.js'),
	config = require('./config.js');
	// http://162.243.40.239:3000/
app = express();
app.http().io();

app.use(express.json());
app.use(express.static('test'));

db.init( function (users, events) {	
// db validation & error handling here

	app.get('/reset', function (req, res) {
		users.remove(function(){});
		events.remove(function(){});
		res.send('yolo');
	});

	app.post('/newUser', function (req, res) {
		users.insert(req.body, function (err, added) {
			if(err) console.log(err);
			return res.json(added[0]);
		});
	});


	app.post('/open', function (req, res) {
		users.update({ _id:req.body._id }, { 
			$push: { otb: req.body.otb }
		},{upsert:true,multi:false}, function (err, updated) {
			if(err) console.log(err);
			return res.json();
		});

	});


	app.post('/join', function (req, res) {
		events.insert(req.body, function (err, added) {
			if(err) console.log(err);
			return res.json(added[0]);
		});
	});


	app.get('/event/:id', function (req, res) {
		events.find({ _id: Number(req.params.id) }).toArray( function (err, found) {
			if(err) console.log(err);
			res.json(found[0]);
		});
	});
	app.get('/events', function (req, res) {
		events.find().toArray( function (err, found) {
			res.json(found);
		});
	});


	app.get('/user/:id', function (req, res) {
		users.find({ _id: Number(req.params.id) }).toArray( function (err, found) {
			if(err) console.log(err);
			res.json(found[0]);
		});
	});
	app.get('/users', function (req, res) {
		users.find().toArray( function (err, found) {
			res.json(found);
		});
	});


	app.listen(3000,function(){
		console.log('Listening on port 3000');
	});

});

// clients connected by sockets emit events to friends
//  

