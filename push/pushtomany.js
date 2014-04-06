var apn = require('apn');

var tokens = ["<insert token here>", "<insert token here>"];

if(tokens[0] == "<insert token here>") {
	console.log("Please set token to a valid device token for the push notification service");
	process.exit();
}

// Create a connection to the service using mostly default parameters.

var service = new apn.connection({ gateway:'gateway.sandbox.push.apple.com' });

service.on('connected', function() {
    console.log("Connected");
});

service.on('transmitted', function(notification, device) {
    console.log("Notification transmitted to:" + device.token.toString('hex'));
});

service.on('transmissionError', function(errCode, notification, device) {
    console.error("Notification caused error: " + errCode + " for device ", device, notification);
});

service.on('timeout', function () {
    console.log("Connection Timeout");
});

service.on('disconnected', function() {
    console.log("Disconnected from APNS");
});

service.on('socketError', console.error);


// If you plan on sending identical paylods to many devices you can do something like this.
function pushNotificationToMany() {
    var note = new apn.notification();
    note.setAlertText("Hello, from node-apn!");
    note.badge = 1;

    service.pushNotification(note, tokens);
}

pushNotificationToMany();


// If you have a list of devices for which you want to send a customised notification you can create one and send it to and individual device.
function pushSomeNotifications() {
    for (var i in tokens) {
        var note = new apn.notification();
        note.setAlertText("Hello, from node-apn! You are number: " + i);
        note.badge = i;

        service.pushNotification(note, tokens[i]);
    }
}

pushSomeNotifications();


/////////////////////////////

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
