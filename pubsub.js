
var User = function (deviceToken, uid) {
    // user channels

    //
};

var cache = {}; // holds channels / topics / rooms

exports.sub = function (channel, uid, socket) {
    if (cache[channel] == undefined) cache[channel] = { uid: socket };
    else cache[channel][uid] = socket;
};

exports.unsub = function (channel, uid) {
    delete cache[channel][uid];
};

// need to set socket value to null when disconnected
exports.pub = function (channel, msg, data) { 
    var topic = cache[channel];
    var uids = [];
    for (var uid in topic) { 
        var sock = topic[uid];
        if(sock) sock.emit(msg, data);
        else uids.push(uid);
    }
    require('push_server').notify(uids, msg, data);

}; // do this or just broadcast and push notify to all