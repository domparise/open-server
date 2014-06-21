var mongoose = require('mongoose');

var locationSchema = mongoose.Schema({

    display_name : String,
    calc: {},
    lat: String,
    lon: String,

    venue: {},

    groups: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'location' 
    }],

});

module.exports = mongoose.model('location', locationSchema);