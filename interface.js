var express = require('express'),
	mysql = require('mysql');
var sql = mysql.createConnection({
	host: '0.0.0.0',
	user: 'root',
	password: 'sql',
	database: 'open',
	multipleStatements:true
}),
	app = express();

app.listen('2999', function () {
	console.log('Database interface online:2999');
});

app.get('/', function (req, response) {
	var text = '<h3>Database interface</h3><p>/empty to empty<br>/seed to seed</p>';
	sql.query('select * from User', function (err, res) {
		if(err) return response.send(err);
		text += '<pre>use with caution:\n\tthese are real changes to the live database;\n\tclose connected applications before making changes\nUSERS:\n' + JSON.stringify(res,null,'  ');
		sql.query('select * from Event', function (err, res) {
			if(err) return response.send(err);
			text += '\n--------------\nEVENTS:\n' + JSON.stringify(res,null,'  ');
			sql.query('select * from Attends', function (err, res) {
				if(err) return response.send(err);
				text += '\n--------------\nATTENDS:\n' + JSON.stringify(res,null,'  ');
				sql.query('select * from Friends', function (err, res) {
					if(err) return response.send(err);
					text += '\n--------------\nFRIENDS:\n' + JSON.stringify(res,null,'  ');
					return response.send(text);
				});
			});
		});
	});
});

app.get('/empty', function (req, res) {
	var query = 'DROP TABLE IF EXISTS `Suggests`;DROP TABLE IF EXISTS `Friends`;DROP TABLE IF EXISTS `Attends`;DROP TABLE IF EXISTS `Event`;DROP TABLE IF EXISTS `Otb`;DROP TABLE IF EXISTS `User`;CREATE TABLE `User` (`uid` int(11) NOT NULL AUTO_INCREMENT,`email` varchar(100) NOT NULL,`token` int(100),`connected` tinyint(1) NOT NULL,	  PRIMARY KEY (`uid`)	) ENGINE=InnoDB DEFAULT CHARSET=latin1;	CREATE TABLE `Event` (	  `eid` int(11) NOT NULL AUTO_INCREMENT,	  `start` int(11) NOT NULL,	  `end` int(11) NOT NULL,	  `type` varchar(100) NOT NULL,	  `location` point DEFAULT NULL,	  `numAttending` int(11) NOT NULL DEFAULT 0,	  PRIMARY KEY (`eid`)	) ENGINE=InnoDB DEFAULT CHARSET=latin1;	 CREATE TABLE `Attends` (	  `uid` int(11) NOT NULL,	  `eid` int(11) NOT NULL,	  KEY `attending` (`eid`),	  KEY `user` (`uid`),	  CONSTRAINT `attendee` FOREIGN KEY (`uid`) REFERENCES `User` (`uid`),	  CONSTRAINT `attending` FOREIGN KEY (`eid`) REFERENCES `Event` (`eid`) ON DELETE CASCADE,	  PRIMARY KEY (`eid`,`uid`)	) ENGINE=InnoDB DEFAULT CHARSET=latin1;	CREATE TRIGGER incAttending AFTER INSERT ON Attends FOR EACH ROW UPDATE Event SET numAttending = numAttending + 1 WHERE eid=NEW.eid;	CREATE TRIGGER decAttending AFTER DELETE ON Attends FOR EACH ROW UPDATE Event SET numAttending = numAttending - 1 WHERE eid=OLD.eid;	CREATE TABLE `Friends` (	  `f1` int(11) NOT NULL,	  `f2` int(11) NOT NULL,	  `visible` tinyint(1) NOT NULL,	  PRIMARY KEY (`f1`,`f2`),	  KEY `with` (`f2`),	  CONSTRAINT `shares` FOREIGN KEY (`f1`) REFERENCES `User` (`uid`), CONSTRAINT `with` FOREIGN KEY (`f2`) REFERENCES `User` (`uid`)) ENGINE=InnoDB DEFAULT CHARSET=latin1;';
	sql.query(query, function (err) {
		if(err) return res.send(err);
		return res.redirect('/');
	});
});

app.get('/seed', function (req, res) {
	var query = 'insert into User(email,connected) values ("user@user.com",1); 		insert into User(email,connected) values ("other@other.com",1); 	insert into User(email,connected) values ("popular@nice.com",1); 	insert into User(email,connected) values ("exclusive@cool.com",1); 	insert into User(email,connected) values ("loner@lol.com",1); 		insert into Friends(f1,f2,visible) values (1,2,1);insert into Friends(f1,f2,visible) values (2,1,1);insert into Friends(f1,f2,visible) values (1,3,1);insert into Friends(f1,f2,visible) values (3,1,1);insert into Friends(f1,f2,visible) values (2,3,1);insert into Friends(f1,f2,visible) values (3,2,1);insert into Friends(f1,f2,visible) values (2,4,1);insert into Friends(f1,f2,visible) values (4,2,1);insert into Friends(f1,f2,visible) values (3,4,1);insert into Friends(f1,f2,visible) values (4,3,1);insert into Friends(f1,f2,visible) values (1,4,0);insert into Friends(f1,f2,visible) values (5,4,0);insert into Friends(f1,f2,visible) values (1,5,1);insert into Friends(f1,f2,visible) values (5,1,1); insert into Friends(f1,f2,visible) values (5,3,1);insert into Friends(f1,f2,visible) values (3,5,0);insert into Event(start,end,type) values (6, 3606, "food");insert into Attends(uid,eid) values (4,1);insert into Attends(uid,eid) values (3,1);insert into Attends(uid,eid) values (2,1);insert into Attends(uid,eid) values (1,1);insert into Attends(uid,eid) values (5,1);insert into Event(start,end,type) values (7211, 14411, "fun");insert into Attends(uid,eid) values (2,2); insert into Event(start,end,type) values (3612, 10812, "fun");insert into Attends(uid,eid) values (1,3); insert into Event(start,end,type) values (13, 18013, "fitness");insert into Attends(uid,eid) values (5,4); insert into Event(start,end,type) values (1814,9014, "any");insert into Attends(uid,eid) values (4,5);';
	sql.query(query, function (err) {
		if(err) return res.send(err);
		return res.redirect('/');
	});
});

