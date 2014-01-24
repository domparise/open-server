/* REST */
var restify = require('restify'),
	assert = require('assert');

var client = restify.createJsonClient({
	url: 'http://0.0.0.0:3000',
});


client.post('/newUser', {
		name: 'dom',
		email: 'dom@dom.com',
		_id: 1
	}, function (err, req, res, obj) {
	assert.ifError(err);
	console.log('%j', obj);

	client.get('/users', function(err, req, res, obj) {
		assert.ifError(err);
		console.log('%j', obj);
	});



});


