/*
    Dom Parise - 6/17/14 - chat app 
    sockets.js

    This file encapsulates all of the socket.io event handling logic
*/

var io = require('socket.io').listen(3000) 

var User = require('./model/user.js'),
    push = require('push_server')


require('mongoose').connect('mongodb://localhost:27017/open')

// var io = require('socket.io')(srv); 
// writing module of this as anonymous function is like declaring the internals of it
// inverse of this is like swinging around the function, in callback you're hanging below it
// either way, io gets crafted

io.configure(function (){
    // requires: {uid,authToken}
    io.set('authorization', function (handshake, cb) {
        log('auth handshake',handshake.query);
        console.log('handshaking');
        return cb(null, true);
    });
});


io.on('connection', function (socket) {

    // send suggestions to user, spin up suggestion engine based on time
    socket.on('newUser', function (data) {
        // data.user
        console.log('newUser')
        var user = new User()
        user.info = data.info;
        push.addUser(data.deviceToken, function (uid) {
            user.uid = uid;
            user.save();
        });
    });

    socket.on('otb', function (data) {
        // start, end, id
        User.fetch(data.info, function (user) {
            user.otb.push({ start: data.start, end: data.end });
            user.save();
        });
    });

    socket.on('result', function (data) {
        // do some math
        User.fetch(data.info, function (user) {
        

        });
    });

    socket.on('fetch', function (data, cb) {
        User.fetch(data.info, function (user) {
            push.fetch(user.uid, cb);
        });
    });

});

function log (str, obj) {require('fs').createWriteStream('logs/app-'+String(Date.now())+'.txt').write(Date.now()+', '+str+', '+require('util').format('%j',obj)+'\n');}