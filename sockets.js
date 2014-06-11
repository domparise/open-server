var server = require('https').createServer(require('./config.js').keys),
	io = require('socket.io').listen(server, {log:false}),
	util = require('util'),
	hat = require('hat');

var logStream = require('fs').createWriteStream('logs/sockets-'+String(Date.now())+'.txt');
function log (str, obj) {
	logStream.write(Date.now()+', '+str+', '+util.format('%j',obj)+'\n');
}

server.listen(3000,function(){
	log('Listening',{});
	console.log('Listening on port 3000');
});

var unknownUsers = {};
exports.handle = function (auth, bind, add, update, fetch, disconnect) {

	io.configure(function (){
		// requires: {uid,authToken}
		io.set('authorization', function (handshake, cb) {
			log('auth handshake',handshake.query);
			console.log('handshaking');
			if (handshake.query.uid === '0' && handshake.query.authToken === 'newUser'){
				log('unknown user handshaking',handshake.query);
				return cb(null, true);
			} else if (handshake.query.uid > 0) {
				log('known user handshaking',handshake.query);
				auth(handshake.query.uid,handshake.query.authToken, function (ans) {
					return cb(null, ans);
				});
			} else {
				return cb(null, false);
			}
		});
	});


	io.sockets.on('connection', function (socket) {
		log('CONNECTION',{socket:socket.id});

		// 'bind' a socket to events attending and friends, so they receive a real time updates; pubsub
		// requires: {uid}
		// returns: success: {}, failure: {error}
		socket.on('bind', function (data, cb) {
			log('BIND',data);
			if (data.uid === 0) {
				// if user unknown, allows 5 seconds to create new user
				var authToken = hat();
				log('generating authToken for unknown user',{authToken:authToken});
				unknownUsers[socket.id] = {
					authToken: authToken,
					timeout: setTimeout( function() {
						socket.disconnect();
						delete unknownUsers[socket.id];
					}, 5000)
				};
				return cb({authToken:authToken});
			}
			socket.uid = data.uid;
			return bind(data.uid, socket, cb);
		});

		// requires: {uid, type, info:{...} }
		//  type: [user, event, activity, join]
		// info: user: {name,email,authToken}
		//       event: {start,end,aid}
		//       activity: {type,title,verb}
		//       join: {eid, evts:[...]}
		// returns: [uid,eid,aid]
		socket.on('add', function (data, cb) {
			log('ADD',data);
			console.log(util.format('ADD: %j',data));
			return add( data.uid, data.type, data.info, socket, cb);
		});

		// requires: {uid, type, iden, field, value}
		//	field: [start,end,type,location]
		//	type: [user, event]
		// emits: {type, id, field, value}
		// returns: success: {}, failure: {error}
		socket.on('update', function (data, cb) {
			log('UPDATE',data);
			console.log(util.format('UPDATE: %j',data));
			return update( data, socket, cb);
		});

		// requires: {uid}
		// returns fetched values, array of notifications
		socket.on('fetch', function (data, cb) {
			log('FETCH',data);
			console.log(util.format('FETCH: %j',data));
			return fetch( data.uid, cb);
		});

		socket.on('disconnect', function () {
			log('DISCONNECT',{socket:socket.id});
			disconnect(socket.uid);
		});
	});
};
