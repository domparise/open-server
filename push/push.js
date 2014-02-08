var apn = require('apn');

var options = {'gateway':'gateway.sandbox.push.apple.com'};

var apnConnection = new apn.Connection(options);

var device = new apn.Device('ff8f9befdf05161087ef9b729b119b5d8e11432ff7cfbe86b78bb579025f650c');

var note = new apn.Notification();

note.expiry = Math.floor(Date.now() / 1000) + 3600;
note.badge = 3;
note.sound = 'ping.aiff';
note.alert = '\uD83D\uDCE7 \u2709 New message';
note.payload = {'messageFrom':'Dom'};

apnConnection.pushNotification(note, device);