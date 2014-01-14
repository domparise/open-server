exports.init = function (cb) {
	require('mongodb').MongoClient.connect('mongodb://localhost/openDB',function(err,db){
		if(err) console.log(err);

		exports.db = db;		
	var userCollection = db.collection('user'),
		eventCollection = db.collection('event'),
		
//////////////////// USER FUNCTIONS ////////////////////
		users = {
			collection: userCollection,
			get: function(id,cb){
				userCollection.find({'_id':new require('mongodb').BSONPure.ObjectID(id)}).next(function(err,user){
					if(err) console.log(err);
					return cb(user);
				});
			},
			findByFb: function(id,cb){
				userCollection.findOne({'fbId':id},function(err,user){
					if(err) console.log(err);
					return cb(user);
				});
			},
			all: function(cb){
				userCollection.find().toArray(function(err,users){
					if(err) console.log(err);
					return cb(users);
				});
			},
			newUser: function (name,email,options,cb) {
				if(cb == undefined){
					console.log('callback needed for newUser()');
					return;
				}

				// auth code here:
				//
				var friends,
					devices;

				if('friends' in options)
					friends = options.friends;
				else friends = null;

				if('devices' in options)
					devices = options.devices;
				else devices = null;

				// options of staus, location, friends, devices
				var user = {
					friends:friends,
					devices:devices,
					notifications:[],
					info:{
						name:name,
						email:email,
						status:'busy',	//{busy,open,attending}
						location:null
					}
				};
				userCollection.insert(user,function(err,added){
					if(err) console.log(err);
					return cb(added[0]);
				});
			}
		},

//////////////////// EVENT FUNCTIONS ////////////////////
		events = {
			collection: eventCollection,
			newOtb: function(otb,cb){
				// check for valid otb

				eventCollection.insert(otb,function(err,added){
					if(err) console.log(err);
					return cb(added[0]);
				});
			}
		};
		return cb(users,events);
	});
};