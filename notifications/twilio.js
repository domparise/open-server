var config = require('../config.js');
var client = require('twilio')(config.twilio.key,config.twilio.secret);
 
// Use this convenient shorthand to send an SMS:
client.sendSms({
    to:'+16169162477',
    from: config.twilio.from,
    body:'yolo'
}, function(err, msg) {
    if(err) console.log(err);
    else {
        console.log('Success! The SID for this SMS message is:');
        console.log(msg.sid);
        console.log('Message sent on:');
        console.log(msg.dateCreated);
    }
});