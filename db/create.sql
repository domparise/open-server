/* 	Dom Parise 11/19/2013
*		Open data model
* 		Open Alpha+
*
* 	quickly empty and recreate tables
* 	run queries.sql to populate with sample
*/

DROP TABLE IF EXISTS `Suggests`;
DROP TABLE IF EXISTS `Friends`;
DROP TABLE IF EXISTS `Attends`;
DROP TABLE IF EXISTS `Event`;
DROP TABLE IF EXISTS `User`;

# Represents people using the app
#
# will want to change email to not null at release
# (didnt wanna fuck with urlencoding emails)
CREATE TABLE `User` (
  `uid` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

# Represents events and OTBs
# base activities:{food,fun,fitness,any,other}
CREATE TABLE `Event` (
  `eid` int(11) NOT NULL AUTO_INCREMENT,
  `start` int(11) NOT NULL,
  `end` int(11) NOT NULL,
  `activity` varchar(100) NOT NULL,
  `creator` int(11) NOT NULL,
  `descr` varchar(100) DEFAULT NULL,
  `location` point DEFAULT NULL,
  `numAttending` int(11) DEFAULT 1,
  `lastupdate` int(11) NOT NULL,
  KEY `origin` (`creator`),
  CONSTRAINT `origin` FOREIGN KEY (`creator`) REFERENCES `User` (`uid`),
  PRIMARY KEY (`eid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

# Represents attending an event
# mid (manager uid) represents who to send suggestions to 
#
--  CREATE TABLE `Attends` (
--   `uid` int(11) NOT NULL,
--   `eid` int(11) NOT NULL,
--   `mid` int(11) DEFAULT NULL,
--   `lastupdate` int(11) NOT NULL,
--   KEY `attendee` (`uid`),
--   KEY `attending` (`eid`),
--   KEY `manager` (`mid`),
--   CONSTRAINT `attendee` FOREIGN KEY (`uid`) REFERENCES `User` (`uid`),
--   CONSTRAINT `attending` FOREIGN KEY (`eid`) REFERENCES `Event` (`eid`),
--   CONSTRAINT `manager` FOREIGN KEY (`mid`) REFERENCES `User` (`uid`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
 CREATE TABLE `Attends` (
  `uid` int(11) NOT NULL,
  `eid` int(11) NOT NULL,
  `mid` int(11) DEFAULT NULL,
  `lastupdate` int(11) NOT NULL,
  KEY `attending` (`eid`),
  CONSTRAINT `attending` FOREIGN KEY (`eid`) REFERENCES `Event` (`eid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

# Represents friendships
# relation in both directions indicate pairing
# visible indicates whether or not data appears on feed
# 
CREATE TABLE `Friends` (
  `f1` int(11) NOT NULL,
  `f2` int(11) NOT NULL,
  `visible` int(1) NOT NULL,
  `lastupdate` int(11) NOT NULL,
  PRIMARY KEY (`f1`,`f2`),
  KEY `with` (`f2`),
  CONSTRAINT `shares` FOREIGN KEY (`f1`) REFERENCES `User` (`uid`),
  CONSTRAINT `with` FOREIGN KEY (`f2`) REFERENCES `User` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

# Represents event update suggestions
# nconfirmed incremented upon conformation
-- CREATE TABLE `Suggests` (
--   `sid` int(11) NOT NULL AUTO_INCREMENT,
--   `uid` int(11) NOT NULL,
--   `eid` int(11) NOT NULL,
--   `attr` varchar(100) NOT NULL,
--   `val` varchar(100) NOT NULL,
--   `nconfirmed` int(11) NOT NULL DEFAULT 1,
--   `lastupdate` int(11) NOT NULL,
--   PRIMARY KEY (`uid`,`eid`,`attr`),
--   KEY `suggest_id` (`sid`),
--   KEY `event` (`eid`),
--   CONSTRAINT `suggestor` FOREIGN KEY (`uid`) REFERENCES `User` (`uid`),
--   CONSTRAINT `event` FOREIGN KEY (`eid`) REFERENCES `Event` (`eid`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=latin1;

## need triggers for:
# numattending on event
# num_to_approve on suggests