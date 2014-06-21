var mongoose = require('mongoose');

// keep history, data mine
//

var userSchema = mongoose.Schema({

    display_name : String, 
    email: String,
    uid: Number,

    facebook: [{}], // get network
    twitter: [{}], // get connections, any data on followers

    groups: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Group' 
    }],

    nextOtbTime: Date,
    nextOtbEnd: Date,

    pushUid: Number,

    friends: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],

    otb: [{
        start: Date,
        end: Date
    }]

});

userSchema.statics.fetch = function (info, cb) {
    this.findOne(info, function(err, user) {
        if(err) throw (err);
        return cb(user);
    });
};

module.exports = mongoose.model('User', userSchema);