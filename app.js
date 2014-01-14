var restify = require('restify'),
	fs = require('fs'),
	socketio = require('socket.io'),
	db = require('./db.js');

// var app = restify.createServer({
// 	certificate: fs.readFileSync('auth/cert.pem'),
// 	key: fs.readFileSync('auth/key.pem')
// });
var app = restify.createServer();
var io = socketio.listen(app);

app.use(restify.bodyParser());
app.use(restify.authorizationParser());

app.use(function (req,res,next) {
	// console.log(req.headers);
	// console.log(req.authorization);
	console.log(req.body);
	next();
});

app.listen(3000,function(){
	console.log('Listening on port 3000');
});


db.init(function(users,events){	

function auth (req,res,next) {
	console.log(req.authorization);
	if(req.authorization.basic.username === 'user' && req.authorization.basic.password === '1234') {
		users.get(req.body.id, function(user){
			req.user = user;
			next();
		});
	}
	else res.json({error:'authentication'})
}

	app.post('/open',auth,function(req,res,next){
		events.newOtb(req.body.otb,function(otb){
			console.log(otb);
			res.json(otb);
		});
	});

	app.post('/join',auth,function(req,res,next){

		res.json({});
	});

	app.post('/suggest',auth,function(req,res,next){
		res.json({});
	});

	app.post('/',function(req,res,next){	
		res.json({});
	});

});