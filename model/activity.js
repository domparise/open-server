var mongoose = require('mongoose');

var activitySchema = mongoose.Schema({

    display_name : String,
    characteristics: [{}],
    groups: [{}],

    people: [{        
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],

    groups: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'activity' 
    }],

});

// create the model for activitys and expose it to our app
module.exports = mongoose.model('activity', activitySchema);