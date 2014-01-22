/*	Dom Parise 11/19/2013
*		Open Alpha+
*
*	Restful API for open app 
*		modules:
*			restify: restful api
*			mysql2: mysql interaction
*			apn: apple push notifications
*
*/
	//TODO:
	// test sync
	// corner test joins
	// error checking on events already attending
	// may need to check friends in certain places?

	// possibly handle push notifications by using next callback, 
	// returning to function that notifies 
	// refine based on specificity

////////////////////*/SERVER/*//////////////////////
	var restify = require('restify');
	var server = restify.createServer();
	server.use(restify.acceptParser(server.acceptable));
	server.use(restify.queryParser());
	server.use(restify.bodyParser());
	server.listen(8808, function () {
	  console.log('open listening on %s', server.url);
	});

	var mysql = require('mysql2');
	var db = mysql.createConnection({
	    host     : 'localhost',
	    user     : 'root',
	    password : 'sql',
	    database : 'open',
	});
	db.connect();

	var apn = require('apn');
	var apnConnection = new apn.Connection({ 
		"gateway": "gateway.sandbox.push.apple.com" 
	});
	 
	var util = require('util');

///////////////////*/HELPERS/*//////////////////////
	function time(){
		return Math.floor(Date.now()/1000);
	}

	function arrCmp(arr1, arr2){
	    if(arr1.length !== arr2.length)
	        return false;
	    for(var i = arr1.length; i--;) {
	        if(arr1[i] !== arr2[i])
	            return false;
	    }
	    return true;
	}

////////////////////*/USERS/*///////////////////////
	// Functions to operate on users

	// Create a new user
	// send back newly created userid
	// need to allow for options for additionals
	// currently allows same combinations to exist, will want to enforce w/ email
	function new_user(req,res){
		util.log(util.format("new_user:%j",req.params));
		var t = time();
		var qry = 'insert User(firstname,lastname,lastupdate,lastsync)'+
			'values('+db.escape(req.params.fname)+','+db.escape(req.params.lname)+','+t+','+t+');'; 
		db.query(qry,function(err){
			if(err){req.send({error:"failed to create user"});return;}
			qry = 'select uid from User where firstname='+db.escape(req.params.fname)+' and lastname='+
				db.escape(req.params.lname)+' and lastupdate='+t+' and lastsync='+t+';';
			db.query(qry,function(err,rows){
				if(err){req.send({error:"failed to get new uid"});return;}
				else res.send(rows[0]);
			});
		});
	// }server.post('/new/user/:fname/:lname/',new_user);
	}server.get('/new/user/:fname/:lname/',new_user);

	// need auth to ensure real transfers
	// to eliminate check for the unescaped req.params
	// assumes user exists
	function edit_user(req,res){
		util.log(util.format("edit_user:%j",req.params));
		var qry = 'update User set '+req.params.attr+'='+db.escape(req.params.val)
			+',lastupdate='+time()+' where uid='+req.params.uid+';';
		db.query(qry,function(err){
			if(err)res.send({error:"failed to update user"});
			else res.send({});
		});
	// }server.post('/:uid/user/:attr/:val/',edit_user);
	}server.get('/:uid/user/:attr/:val/',edit_user);

	// using userid in route to eliminate header confusion
	// and so uid is required 

 ///TEST//////////////////////////////////////TEST//
 // New user
 // curl -X POST -H "Content-Type:application/json;" http://localhost:8808/new/u/greg/azv/
 // should insert into DB and return new userid
 /////// 
 // Edit user
 // curl -X POST -H "Content-Type:application/json;" http://localhost:8808/2/user/lastname/greggy/
 // should change user 2's lastname to greggy

///////////////////*/FRIENDS/*//////////////////////
	// Friends represented by 2-way relationship
	// choose to share their events with others or not
	// these functions 'send' 'friend requests' 
	// as well as toggle share
	//
	// both required user id and other id

	// want to push notify other user when sharing with them
	function share(req,res){
		util.log(util.format("share:%j",req.params));
		var qry = 'insert into Friends(f1,f2,visible,lastupdate) values('+
			req.params.uid+','+req.params.oid+',1,'+time()+')'
			+' on duplicate key update visible=1,lastupdate='+time()+';';
		db.query(qry,function(err){
			if(err)res.send({error:"failed to share"});
			else res.send({});
		});
	// }server.post('/:uid/share/:oid/',share);
	}server.get('/:uid/share/:oid/',share);

	// assumes mutual sharing and one user wants to disable this
	function unshare(req,res){
		util.log(util.format("unshare:%j",req.params));
		var qry = 'update Friends set visible=0,lastupdate='+time()
			+' where f1='+req.params.uid+' and f2='+req.params.oid+' and visible=1;';
		db.query(qry,function(err){
			if(err){console.log(err);res.send({error:"failed to unshare"});}
			else res.send({});
		});
	// }server.post('/:uid/unshare/:oid/',unshare);
	}server.get('/:uid/unshare/:oid/',unshare);

 ///TEST//////////////////////////////////////TEST//
 // share
 // curl -X POST -H "Content-Type:application/json;" http://localhost:8808/3/share/1/
 // inserts or toggles
 //////
 // unshare
 // curl -X POST -H "Content-Type:application/json;" http://localhost:8808/3/unshare/1/
 // toggles

///////////////////*/EVENTS/*///////////////////////
	// Events begin as OTBs then are joined by others
	// joining is special and cool

	// New OTB
	// expects start and end time as UNIX integer
	function open(req,res){
		util.log(util.format("open:%j",req.params));
		var t = time();
		var qry = 'insert Event(start,end,activity,lastupdate)'+
			'values('+req.params.start+','+req.params.end+','+
			db.escape(req.params.activity)+','+t+');'; 
		db.query(qry,function(err){
			if(err){res.send({error:"failed to create event"});return;}
			qry = 'select eid from Event where start='+req.params.start+' and end='+req.params.end+
				' and activity='+db.escape(req.params.activity)+' and lastupdate='+t+';';
			db.query(qry,function(err,rows){
				if(err){res.send({error:"failed to get new eid"});return;}
				qry = 'insert into Attends(uid,eid,lastupdate) values('+req.params.uid+','+
					rows[0].eid+','+time()+');';
				db.query(qry,function(err){
					if(err){console.log({error:"failed to inticate attending"});return;}
				});
				res.send(rows[0]);
			});
		});
	// }server.post('/:uid/open/:start/:end/:activity/',open);
	}server.get('/:uid/open/:start/:end/:activity/',open);
	// need to push to friends with relevant situation

	// possibly can be optimized
	// whole range of push notifications when joining

	// joining self dupicates attends
	function join(req,res){
		util.log(util.format("join:%j",req.params));
		var data = {uid:req.params.uid,eid:req.params.eid,top:"",friends:"",topF:""};
		DB_join(data,function(result){
			if(result !== 'success')
				res.send({error:"failed to join within "+result});
			else res.send({});
		});
	// }server.post('/:uid/join/:eid/',join);
	}server.get('/:uid/join/:eid/',join);

 ///////////////JOIN HELPERS///////////////
	function DB_join(data,cb){
		// console.log('DB_join');
		DB_FnotT(data);									// manage all not in T
		DB_friendsAttn(data,function(){
			DB_top(data,function(){
				if(data.top.length === 1){ 				// if 1 friend in T
					DB_merge(data);						// joining open friend
					return cb('success');				// merge with T
				}else if(data.top.length === 0){ 		// if none
					return cb('success');				// event from FoF
				}else{ 									// if some F in T 
					DB_topF(data,function(){
						if(arrCmp(data.top,data.topF)){ // if friends with all T
							DB_merge(data);				// merge with top
							return cb('success');
						}else{ 							// else all friends manage you
							for(var i=0;i<data.friends.length;i++){
								DB_manage(data.friends[i].uid,data.uid,data.eid);
							}
							return cb('success');
						}	
					});
				}
			});
		});
	}

	// need to step through these to check new functionality
	// also want to add visibility w/ friends 
	//

	// Select users at top of heirarchy
	function DB_top(data,cb){
		// console.log('DB_top');
		db.query('select uid from Attends where mid is null and eid='+data.eid+';',function(err,rows){
			if(err) console.log(err);
			data.top = rows;
			return cb();
		});
	}

	// Select friends attending specific event
	function DB_friendsAttn(data,cb){
		// console.log('DB_friendsAttn');
		db.query('select uid from Attends a, Friends F1, Friends F2 where a.eid='+data.eid+' and F1.f2=a.uid and F1.f1=F2.f2 and F2.f1=F1.f2 and F1.f1='+data.uid+';',function(err,rows){
			if(err) console.log(err);
			data.friends = rows;
			return cb();
		});
	}

	// Select all friends
	function DB_friends(data,cb){
		// console.log('DB_friends');
		db.query('select F1.f2 as uid from Friends F1, Friends F2 where F1.f1=F2.f2 and F2.f1=F1.f2 and F1.f1='+data.uid+';',function(err,rows){
			if(err) console.log(err);
			data.friends = rows;
			return cb();
		});
	}

	// Friends not on top, always managed by joiner
	function DB_FnotT(data){
		// console.log('DB_FnotT');
		db.query('select distinct F1.f2 as uid from Attends a,Friends F1,Friends F2 where eid='+data.eid+
			' and mid is not null and F1.f1=F2.f2 and F2.f1=F1.f2 and F1.f2=a.uid and F1.f1='+data.uid+';',function(err,rows){
			if(err) console.log(err);
			for(var i = 0;i<rows.length;i++){
				DB_manage(data.uid,rows[i].uid,data.eid);
			}
			return;
		});
	}

	// Insert managing relationship
	function DB_manage(u1,u2,eid){ // u1 manages u2
		// console.log(u1+' manages '+u2);
		db.query('insert Attends set uid='+u2+', eid='+eid+', mid='+u1+', lastUpdate='+time()+';',function(err){
			if(err) console.log(err);
			return;
		});
	}

	// Select friends on top
	function DB_topF(data,cb){
		// console.log('DB_topF');
		db.query('select distinct uid from Attends a,Friends F1,Friends F2 where eid='+data.eid+
			' and mid is null and F1.f1=F2.f2 and F2.f1=F1.f2 and F1.f2=a.uid and F1.f1='+data.uid+';',function(err,rows,fields){ //top friends
			if(err) console.log(err);
			data.topF = rows;
			return cb();
		});
	}

	// Join with top of heirarchy
	function DB_merge(data){
		// console.log('DB_merge');
		db.query('insert Attends set uid='+data.uid+', eid='+data.eid+', lastUpdate='+time()+';',function(err){
			if(err) console.log(err);
			return;
		});
	}
 
 ///TEST//////////////////////////////////////TEST//
 // open
 // curl -X POST -H "Content-Type:application/json;" http://localhost:8808/2/open/11/22/yolo
 // insert into events and attends
 //////
 // join
 // curl -X POST -H "Content-Type:application/json;" http://localhost:8808/1/join/2
 // does a buncha shit

//////////////*/SUGGEST/CONFIRM*////////////////////
	// newer concept, might need some ironing
	// when user suggests update to event, 
	// pushes suggestion to specific people, forming heirarchy

	// push notification depending on managers
	// here pushes play the major part of this functionality
	function suggest(req,res){
		util.log(util.format("suggest:%j",req.params));
		var t = time();
		var qry = 'insert Suggests(uid,eid,attr,val,lastupdate) values('+req.params.uid+','
			+req.params.eid+','+db.escape(req.params.attr)+','+db.escape(req.params.val)+','+t+');'; 
		db.query(qry,function(err){
			if(err){req.send({error:"failed to create suggestion"});return;}
			qry = 'select sid from Suggests where uid='+req.params.uid+' and eid='+req.params.eid+
				' and attr='+db.escape(req.params.attr)+';';
			db.query(qry,function(err,rows){
				if(err){req.send({error:"failed to get new sid"});return;}
				else res.send(rows[0]);
			});
		});
	// }server.post('/:uid/suggest/:eid/:attr/:val/',suggest);
	}server.get('/:uid/suggest/:eid/:attr/:val/',suggest);

	// assumes users dont confirm their own suggestions (implicit/default) 
	function confirm(req,res){
		util.log(util.format("confirm:%j",req.params));
		var qry = 'update Suggests set nconfirmed=nconfirmed+1,lastupdate='+time()+
			' where sid='+req.params.sid+';';
		db.query(qry,function(err){
			if(err){console.log(err);res.send({error:"failed to confirm"});}
			else res.send({});
		});
	// }server.post('/:uid/confirm/:sid/',confirm);
	}server.get('/:uid/confirm/:sid/',confirm);

 ///TEST//////////////////////////////////////TEST//
 // suggest
 // curl -X POST -H "Content-Type:application/json;" http://localhost:8808/1/suggest/1/activity/drinking
 // should return sid
 /////////
 // confirm 
 // curl -X POST -H "Content-Type:application/json;" http://localhost:8808/2/confirm/1
 // increments numconfirmed 

	///needa kinda work towards suggesting: ie
	// curl -X POST -H "Content-Type:application/json;" http://localhost:8808/new/user/dommy/p/
	// returns {"uid":1}
	// curl -X POST -H "Content-Type:application/json;" http://localhost:8808/new/user/greggy/a/
	// returns {"uid":2}
	// curl -X POST -H "Content-Type:application/json;" http://localhost:8808/1/open/14/16/yolo 
	// returns {"eid":1}
	// curl -X POST -H "Content-Type:application/json;" http://localhost:8808/2/join/1
	// returns {}
	// curl -X POST -H "Content-Type:application/json;" http://localhost:8808/1/suggest/1/activity/drinking
	// returns {"sid":1}
	// curl -X POST -H "Content-Type:application/json;" http://localhost:8808/2/confirm/1
	// returns {}

//////////////////*/DATAMGMT/*//////////////////////

/// remove joiners OTB when joining // possibly by 'ending' their OTB then


///////////
//working to now design from the user perspective
//

// Want feed to return array of users that are friends and number of 'other'

	function feed(req,res){
		util.log(util.format("feed:%j",req.params));
		var data = {feed:""};
		var qry =	'select distinct e.eid,start,end,activity,descr,group_concat(distinct others.uid) as attending ' 
					+'from Event e, Attends a, Attends others, Friends s,Friends w, User u '
					+'where u.uid='+req.params.uid+' and s.f1=u.uid and s.f2=w.f1 and s.f1=w.f2 and s.visible=1 and w.visible=1 ' 
					+'and s.f2=a.uid and others.eid=a.eid and e.lastupdate>u.lastupdate and a.eid=e.eid group by e.eid;';
		db.query(qry,function(err,rows){
			if(err)res.send({error:"failed to get feed"});
			data.feed=rows;
			res.send(data);
		});
	// }server.post('/:uid/feed/',feed);
	}server.get('/:uid/feed/',feed);

	// assumes that eventids are obtained from friend specific function like feed
	function event_info(req,res){
		util.log(util.format("info:%j",req.params));
		var data = {event:{info:"",attending:"",suggestions:""}};
		db.query('select start,end,activity,descr from Event where eid='+req.params.eid+';',function(err,rows){
			if(err)res.send({error:"failed to get event"});
			data.event.info=rows[0];
			// assumed that on device, you know your friends, and you can differentiate between friends and 'others'
			db.query('select distinct uid from Attends where eid='+req.params.eid+';',function(err,rows){
				if(err)res.send({error:"failed to get attending"});
				data.event.attending=rows;
				db.query('select sid,attr,val,nconfirmed from Suggests where eid='+req.params.eid+';',function(err,rows){
					if(err)res.send({error:"failed to get suggestions"});
					data.event.suggestions=rows;
					res.send(data);
				});
			});
		});
	// }server.post('/:uid/info/:eid/',event_info);
	}server.get('/:uid/info/:eid/',event_info);


////////////////////////

	// Basic utility function to load individual element
	// may need to error check privledges on uid on this guy
	function load(req,res){
		util.log(util.format("load:%j",req.params));
		if(req.params.type === 'eid')
			var qry = 'select eid,start,end,activity,descr from Event where '+req.params.type+'='+req.params.id+';';
		if(req.params.type === 'uid')
			var qry = 'select uid,firstname,lastname,hometown,email from User where '+req.params.type+'='+req.params.id+';';
		db.query(qry,function(err,rows){
			if(err)res.send({error:"failed to load "+req.params.type});
			else res.send(rows[0]);
		});
	// }server.post('/:uid/load/:type/:id/',load);
	}server.get('/:uid/load/:type/:id/',load);
	// type: {uid,eid}

	// need to refine this to more specifically prioritize loads
	// need to specifically select attrs because locations (points) mess things up
	function sync(req,res){
		util.log(util.format("sync:%j",req.params));
		var data = {users:"",events:"",attending:"",suggestions:""};
		db.query('select eid,start,end,activity,descr from Event e,User u where u.uid='+req.params.uid+' and e.lastupdate>u.lastsync;',function(err,rows){
			if(err)res.send({error:"failed to sync events"});
			data.events=rows;
			db.query('select u2.uid,u2.firstname,u2.lastname,u2.hometown,u2.email from User u1,User u2 where u1.uid='+req.params.uid+' and u2.lastupdate>u1.lastsync;',function(err,rows){
				if(err)res.send({error:"failed to sync users"});
				data.users=rows;
				db.query('select a.uid,a.eid from User u,Attends a where u.uid='+req.params.uid+' and a.lastupdate>u.lastsync;',function(err,rows){
					if(err)res.send({error:"failed to sync attending"});
					data.attending=rows;
					db.query('select sid,eid,attr,val,nconfirmed from Suggests s,User u where u.uid='+req.params.uid+' and s.lastupdate>u.lastsync;',function(err,rows){
						if(err)res.send({error:"failed to sync suggestions"});
						data.suggestions=rows;
						db.query('update User set lastsync='+time()+' where uid='+req.params.uid+';',function(err){
							if(err)res.send({error:"updating sync time"});
							res.send(data);
						});
					});
				});
			});
		});
	// }server.post('/:uid/sync/',sync);
	}server.get('/:uid/sync/',sync);

/*	function sync_all(req,res){
		var data = {users:"",events:"",attending:"",suggestions:""};
		db.query('select eid,start,end,activity,descr from Event e,User u where u.uid='+req.params.uid+' and e.lastupdate>u.lastsync;',function(err,rows){
			if(err)res.send({error:"failed to sync events"});
			data.events=rows;
			db.query('select u2.uid,u2.firstname,u2.lastname,u2.hometown,u2.email from User u1,User u2 where u1.uid='+req.params.uid+' and u2.lastupdate>u1.lastsync;',function(err,rows){
				if(err)res.send({error:"failed to sync users"});
				data.users=rows;
				db.query('select a.uid,a.eid from User u,Attends a where u.uid='+req.params.uid+' and a.lastupdate>u.lastsync;',function(err,rows){
					if(err)res.send({error:"failed to sync attending"});
					data.attending=rows;
					db.query('select sid,eid,attr,val,nconfirmed from Suggests s,User u where u.uid='+req.params.uid+' and s.lastupdate>u.lastsync;',function(err,rows){
						if(err)res.send({error:"failed to sync suggestions"});
						data.suggestions=rows;
						db.query('update User set lastsync='+time()+' where uid='+req.params.uid+';',function(err){
							if(err)res.send({error:"updating sync time"});
							res.send(data);
						});
					});
				});
			});
		});
	// }server.post('/:uid/syncall/',sync_all);
	}server.get('/:uid/syncall/',sync_all);*/


	function load_all(req,res){
		util.log(util.format("load_all:%j",req.params));
		var data = {users:"",events:"",attending:"",suggestions:""};
		db.query('select eid,start,end,activity,descr from Event;',function(err,rows){
			if(err)res.send({error:"failed to sync events"});
			data.events=rows;
			db.query('select uid,firstname,lastname,hometown,email from User;',function(err,rows){
				if(err)res.send({error:"failed to sync users"});
				data.users=rows;
				db.query('select uid,eid from Attends;',function(err,rows){
					if(err)res.send({error:"failed to sync attending"});
					data.attending=rows;
					db.query('select sid,eid,attr,val,nconfirmed from Suggests s;',function(err,rows){
						if(err)res.send({error:"failed to sync suggestions"});
						data.suggestions=rows;
						res.send(data);
					});
				});
			});
		});
	// }server.post('/:uid/sync/',sync);
	}server.get('/load/all/',load_all);

	// function clean(req,res){
	// 	db.query('truncate table Event;',function(err){
	// 		if(err)res.send({error:"failed to delete events"});
	// 		db.query('truncate table User;',function(err){
	// 			if(err)res.send({error:"failed to delete users"});
	// 			db.query('truncate table Attends;',function(err){
	// 				if(err)res.send({error:"failed to delete attending"});
	// 				db.query('truncate table Suggests;',function(err){
	// 					if(err)res.send({error:"failed to delete suggestions"});
	// 					res.send({msg:"database emptied"});
	// 				});
	// 			});
	// 		});
	// 	});
	// }server.get('/clean/all/',clean);

 ///TEST/////////////////////////////////////////////TEST//
 // sync
 // curl -X POST -H "Content-Type:application/json;" http://localhost:8808/1/sync
 // who knows what it returns lol
 /////////
 // load
 // curl -X POST -H "Content-Type:application/json;" http://localhost:8808/1/load/uid/3
 // returns data on user 3



// below doesnt work here, but need to consider exceptions for fault-tolerant server
process.on('uncaughtException', function (err) {
    console.log(err);
}); 