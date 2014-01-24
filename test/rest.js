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

	client.post('/open', { 
			_id: 1,
			otb: {
				start: 2,
				end: 5,
				type: 'any'
			}
		}, function(err, req, res, obj) {
		assert.ifError(err);
		console.log('%j', obj);
		

		client.get('/user/1', 
			function(err, req, res, obj) {
			assert.ifError(err);
			console.log('%j', obj);


			client.post('/join', {
				start: 4,
				end: 5, 
				type: 'any'
			}, function (err, req, res, obj) {
				assert.ifError(err);
				console.log('%j', obj);
			});



		
		});



	});



});


