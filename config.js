var fs = require('fs');

exports.fb = {
	clientID : '493121947470142', 
	clientSecret : 'd7276729f4c722b5d0bc4078373c6dfe',
	callbackURL: "https://0.0.0.0:3000/auth/facebook/callback"
};

exports.keys = {
	key: fs.readFileSync('./auth/key.pem'),
	cert: fs.readFileSync('./auth/cert.pem')
};

exports.twilio = {
	key: 'AC48f71ec4b958d805b3d4a115ad31ffc1',
	secret: '435c7ee1c843dd5bd1c82d4ccbfce47c',
	from: '+17348884244'
};

exports.mysql = {
	host: '0.0.0.0',
	user: 'root',
	password: 'sql',
	database: 'open'
}; // multipleStatements:true allows back to back statements