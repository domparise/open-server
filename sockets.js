var server = require('https').createServer(config.keys),
	io = require('socket.io').listen(server, {log:false});


var logStream = require('fs').createWriteStream('logs/sockets-'+String(Date.now())+'.txt');
function log (str, obj) {
	logStream.write(Date.now()+', '+str+', '+util.format('%j',obj)+'\n');
}

server.listen(3000,function(){
	log('Listening',{});
	console.log('Listening on port 3000');
});

var unknownUsers = {};
exports.handle = function (auth, bind, newUser, newOtb, newActivity, update, fetch, fetchAll) {

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

		// requires: {name,email,authToken}
		// returns: {uid}
		socket.on('newUser', function (data, cb) {
			log('NEWUSER',data);
			if (unknownUsers[socket.id].authToken === data.authToken) {
				clearTimeout(unknownUsers[socket.id].timeout);
				return newUser(data.name, data.email, data.authToken, socket, cb);
			}
		});

		// requires: {uid,start,end,aid}
		// emits: newOtb:{eid,start,end,aid,attendees[]}
		// returns: success: {eid}, failure: {error}
		socket.on('newOtb', function (data, cb) {
			log('OPEN',data);
			console.log(util.format('OPEN: %j',data));
			return newOtb(data.uid, data.start, data.end, data.aid, socket, cb);
		});

		// requires: {uid,type,title,verb}
		// returns: {aid}
		socket.on('newActivity', function (data, cb) {
			log('NEWACTIVITY',data);
			return newActivity(data.type, data.title, data.verb, cb);
		});

		// requires: {type, uid/eid, update:{field,value} }
		//	field: [start,end,type,location,attendees]
		//	type: [updateEvent,updateUser]
		// emits: {eid/uid, update: {field,value} }
		// returns: success: {}, failure: {error}
		socket.on('update', function (data, cb) {
			log('UPDATE',data);
			console.log(util.format('UPDATE: %j',data));
			return update(uid, eid, update, socket, cb);
		});

		// requires: {type, value}
		// 	type: [uid, eid, aid, events, friends, activities]
		// returns: fetched value
		socket.on('fetch', function (data, cb) {
			log('FETCH',data);
			console.log(util.format('FETCH: %j',data));
			if (data.value === undefined) ////// NOT IMPLEMENTED YET
				return fetchAll(data.type, cb); // no db.fetchAll yet
			else
				return fetch(data.type, data.value, cb);
		});

		socket.on('disconnect', function () {
			log('DISCONNECT',{socket:socket.id});
		});
	});
}