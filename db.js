
exports.init = function (cb) {
	var ObjectID = require('mongodb').ObjectID;
	require('mongodb').MongoClient.connect('mongodb://localhost/openDB',function(err,db){
		if(err) console.log(err);

		exports.db = db;		
	var Users = db.collection('user'),
		Events = db.collection('event');

// custom functions and error handling here
		
//////////////////// USER FUNCTIONS ////////////////////
		Users.all = function (cb) {
			this.find().toArray( function (err,users) {
				if (err) console.log(err);
				return cb(users);
			});
		};

		Users.newUser = function (name,email,options,cb) {
			if(cb === undefined){
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
			this.insert(user,function(err,added){
				if(err) console.log(err);
				return cb(added[0]);
			});
		};

		Users.ask = function (id,token,cb) {
			this.insert({id:id,token:token},{upsert:true},function(err,user){
				if(err) console.log(err);
				return cb(user);
			});
		};

		Users.refresh = function (cb) {
			this.remove(function(err){
				if(err) console.log(err);
				else console.log('Users refreshed');
			});
		};


//////////////////// EVENT FUNCTIONS ////////////////////
// for event functions, can pass userID, socket, or full user (would require )
		Events.newOtb = function(user,otb,cb){
			// check for valid times
			var valid = (otb.start < otb.end);
			if (!valid) {
				return;
			}
			this.insert({start:otb.start,end:otb.end, attending: [user._id]},{upsert:true},function(err,added){
				if(err) console.log(err);
				Users.update( user, { $push: {attending: added[0]._id} },function(err){
					if(err) console.log(err);
					return cb(added[0]);
				});
			});
		};

		Events.join = function(user,event,cb){
			if (user.status !== 'open'){ // error handle

			}
			// fetch users events
			console.log(typeof(user._id));
			var oid = new ObjectID(user._id);
			console.log(oid);
			this.find({attending: oid}).toArray( function (err,events) {
				if(err) console.log(err);
				console.log(events);
			});
		};

		return cb(Users,Events);
	});
};