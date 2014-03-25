var apn = require('apn');

var options = {'gateway':'gateway.sandbox.push.apple.com'};

var apnConnection = new apn.Connection(options);

var device = new apn.Device('6de845f34b2dec914bd161feca1a9a3e6ea0b448818358cac1529313c7756619');

var note = new apn.Notification();

note.expiry = Math.floor(Date.now() / 1000) + 3600;
note.badge = 1;
note.sound = 'ping.aiff';
note.alert = '\uD83D\uDCE7 \u2709 New message';
note.payload = {'messageFrom':'Dom'};

apnConnection.pushNotification(note, device);