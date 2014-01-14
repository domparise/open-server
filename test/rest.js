/* REST */
var restify = require('restify'),
	assert = require('assert');

var client = restify.createJsonClient({
	url: 'https://0.0.0.0:3000',
	rejectUnauthorized: false
});


client.basicAuth('user','1234');

client.post('/open', { 
		id: '52d34a3b6108445fe861dddd',
		otb: {
			start: 14,
			end: 15
		}
	}, 
	function(err, req, res, obj) {
	assert.ifError(err);
	console.log('%d -> %j', res.statusCode, res.headers);
	console.log('%j', obj);
	return;
});


client.post('/join', { 
		user: {
			email: 'd0m@dom.com',
			fbToken: 'b0642f9108d5d5976df313768f28db41'
		},
		event: 3 
	}, 
	function(err, req, res, obj) {
	assert.ifError(err);
	console.log('%d -> %j', res.statusCode, res.headers);
	console.log('%j', obj);
	return;
});