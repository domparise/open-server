/*  Dom Parise 11/19/2013
*   Open data model
*     Open Alpha+
*
*   quickly empty and recreate tables
*   run queries.sql to populate with sample
*/

DROP TABLE IF EXISTS `Friends`;
DROP TABLE IF EXISTS `Attends`;
DROP TABLE IF EXISTS `Event`;
DROP TABLE IF EXISTS `Activity`;
DROP TABLE IF EXISTS `Otb`;
DROP TABLE IF EXISTS `Notification`;
DROP TABLE IF EXISTS `User`;

# Represents people using the app
#
CREATE TABLE `User` (
  `uid` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `authToken` int(100) DEFAULT NULL,
  `deviceToken` int(100) DEFAULT NULL,
  `noteCount` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`name`,`email`),
  KEY `uid` (`uid`),
  KEY `userHash` (`uid`,`email`) USING HASH
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

# Push notifications
# considered having notification id
CREATE TABLE `Notification` (
  `uid` int(11) NOT NULL,
  `json` varchar(256) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `user` (`uid`),
  KEY `userNoteHash` (`uid`) USING HASH,
  CONSTRAINT `user` FOREIGN KEY (`uid`) REFERENCES `User` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TRIGGER incNotification AFTER INSERT ON Notification FOR EACH ROW UPDATE User SET noteCount = noteCount + 1 WHERE uid=NEW.uid;
CREATE TRIGGER decNotification AFTER DELETE ON Notification FOR EACH ROW UPDATE User SET noteCount = noteCount - 1 WHERE uid=OLD.uid;

# Represents event activities
# activity types:{food,fun,fitness,anything,other}
CREATE TABLE `Activity` (
  `aid` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(100) NOT NULL,
  `title` varchar(100) NOT NULL,
  `verb` varchar(100) NOT NULL,
  PRIMARY KEY (`aid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

# Represents events
CREATE TABLE `Event` (
  `eid` int(11) NOT NULL AUTO_INCREMENT,
  `start` int(11) NOT NULL,
  `end` int(11) NOT NULL,
  `aid` int(11) NOT NULL,
  `location` point DEFAULT NULL,
  `numAttending` int(11) NOT NULL DEFAULT 0,
  KEY `activity` (`aid`),
  KEY `eventHash` (`eid`,`aid`) USING HASH,
  CONSTRAINT `activity` FOREIGN KEY (`aid`) REFERENCES `Activity` (`aid`),
  PRIMARY KEY (`eid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

# Represents attending an event
# mid (manager uid) represents who to send suggestions to 
 CREATE TABLE `Attends` (
  `uid` int(11) NOT NULL,
  `eid` int(11) NOT NULL,
  KEY `attending` (`eid`),
  KEY `user` (`uid`),
  CONSTRAINT `attendee` FOREIGN KEY (`uid`) REFERENCES `User` (`uid`),
  CONSTRAINT `attending` FOREIGN KEY (`eid`) REFERENCES `Event` (`eid`) ON DELETE CASCADE,
  PRIMARY KEY (`eid`,`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TRIGGER incAttending AFTER INSERT ON Attends FOR EACH ROW UPDATE Event SET numAttending = numAttending + 1 WHERE eid=NEW.eid;
CREATE TRIGGER decAttending AFTER DELETE ON Attends FOR EACH ROW UPDATE Event SET numAttending = numAttending - 1 WHERE eid=OLD.eid;

# Represents friendships
# relation in both directions indicate pairing
# visible indicates whether or not data appears on feed
# 
CREATE TABLE `Friends` (
  `f1` int(11) NOT NULL,
  `f2` int(11) NOT NULL,
  `visible` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`f1`,`f2`),
  KEY `with` (`f2`),
  CONSTRAINT `shares` FOREIGN KEY (`f1`) REFERENCES `User` (`uid`),
  CONSTRAINT `with` FOREIGN KEY (`f2`) REFERENCES `User` (`uid`),
  KEY `userFriendHash` (`f1`,`f2`) USING HASH
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

# Base Activities
insert into Activity(type,title,verb) values ('Anything','Anything','do something'); #1
insert into Activity(type,title,verb) values ('Food','Food','get food'); #2
insert into Activity(type,title,verb) values ('Fun','Fun','do something fun'); #3
insert into Activity(type,title,verb) values ('Fitness','Fitness','work out'); #4

