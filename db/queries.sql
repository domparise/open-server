/* 	Dom Parise 11/19/2013
*		Open data model
* 		Open Alpha+
*
* 	sample data used for test
* 	beginning populates, end queries
*/

insert into User(email,connected) values ('user@user.com',1); 		#1
insert into User(email,connected) values ('other@other.com',1); 	#2
insert into User(email,connected) values ('popular@nice.com',1); 		#3
insert into User(email,connected) values ('exclusive@cool.com',1); 	#4
insert into User(email,connected) values ('loner@lol.com',1); 		#5

# Friends 
insert into Friends(f1,f2,visible) values (1,2,1); #user and other
insert into Friends(f1,f2,visible) values (2,1,1);
insert into Friends(f1,f2,visible) values (1,3,1); #user and popular
insert into Friends(f1,f2,visible) values (3,1,1);
insert into Friends(f1,f2,visible) values (2,3,1); #other and popular
insert into Friends(f1,f2,visible) values (3,2,1);
insert into Friends(f1,f2,visible) values (2,4,1); #other and exclusive
insert into Friends(f1,f2,visible) values (4,2,1);
insert into Friends(f1,f2,visible) values (3,4,1); #popular and exclusive
insert into Friends(f1,f2,visible) values (4,3,1);
insert into Friends(f1,f2,visible) values (1,4,0); #pending request for exclusive from user
insert into Friends(f1,f2,visible) values (5,4,0); #pending request for exclusive from loner
insert into Friends(f1,f2,visible) values (1,5,1); #user and loner friends
insert into Friends(f1,f2,visible) values (5,1,1); 
insert into Friends(f1,f2,visible) values (5,3,1); #popular and loner friends
insert into Friends(f1,f2,visible) values (3,5,0); #popular doesnt want loner to see

# Events: time represented in seconds since 0
# Event, 4 participants, now for an hour
# dom friend of friend to exclusive, loner is friend of friend with dom
insert into Event(start,end,type) values (6, 3606, 'food');
insert into Attends(uid,eid) values (4,1); #exclusive going
insert into Attends(uid,eid) values (3,1); #popular going
insert into Attends(uid,eid) values (2,1); #other going
insert into Attends(uid,eid) values (1,1); #user is going
insert into Attends(uid,eid) values (5,1); #loner going

# OTB, 2 hours from now, open for 2 hours
# greg is open
insert into Event(start,end,type) values (7211, 14411, 'fun');
insert into Attends(uid,eid) values (2,2); 

# OTB, 1 hour from now, open for 3 hours
# dom is open
insert into Event(start,end,type) values (3612, 10812, 'fun');
insert into Attends(uid,eid) values (1,3); 

# OTB, now for 5 hours
# loner is open
insert into Event(start,end,type) values (13, 18013, 'fitness');
insert into Attends(uid,eid) values (5,4); 

# OTB, .5 hour from now, open for 2 hours
# exclusive is open
insert into Event(start,end,type) values (1814,9014, 'any');
insert into Attends(uid,eid) values (4,5); 

##
##
/*
#select list of all friend ids
select if(f1=2,f2,f1) as friend from Friends where f1=2 or f2=2;

#feed
select distinct eid from Attends where id=any(select if(f1=2,f2,f1) as id from Friends where f1=2 or f2=2) or id=2;

#select user who is friend
select firstname,lastname,location,hometown,email from User,Friends where id=1 and ((f1=1 and f2=2) or (f1=2 and f2=1));

#top 
select id from Attends where eid=1 and mid is null;

#top friends
select distinct id from Attends a,Friends F1,Friends F2 where eid=1 and mid is null and F1.f1=F2.f2 and F2.f1=F1.f2 and F1.f2=a.id and F1.f1=1;

#friends not top
select distinct id from Attends a,Friends F1,Friends F2 where eid=1 and mid is not null and F1.f1=F2.f2 and F2.f1=F1.f2 and F1.f2=a.id and F1.f1=1;

#events attended by friends
select distinct e.eid,start,end,activity,descr,group_concat(distinct others.uid) as attending 
from Event e, Attends a, Attends others, Friends s,Friends w, User u
where u.uid='2' and s.f1=u.uid 
and s.f2=w.f1 and s.f1=w.f2   
and s.visible=1 and w.visible=1 
and s.f2=a.uid and others.eid=a.eid
and e.lastupdate>u.lastupdate 
and a.eid=e.eid
group by e.eid;

#visible friends of a user
#friend s shares with friend w
select distinct s.f2 as friend 
from Friends s,Friends w 
where s.f1='5' 
and s.f2=w.f1 and s.f1=w.f2 
and s.visible=1 and w.visible=1;
*/

# will want to update event for lastupdate time, instead of specific values
# so that only one sync needs to get called

# when initial-joining latest start, earliest end emitted as suggestions
# as well as assigned


###########################################
#FEED
###########################################
-- select distinct e.eid,start,end,activity,descr,group_concat(distinct others.uid) as attending 
-- from Event e, Attends a, Attends others, Friends s,Friends w, User u
-- where u.uid='2' and s.f1=u.uid 
-- and s.f2=w.f1 and s.f1=w.f2   
-- and s.visible=1 and w.visible=1 
-- and s.f2=a.uid and others.eid=a.eid
-- and e.lastupdate>u.lastupdate 
-- and a.eid=e.eid
-- group by e.eid;

#suggestions exist as whole different beast


###########################################
#TEST
###########################################

/*
#test events attended by friends:
select distinct e.eid,start,end,activity,descr,group_concat(distinct others.uid) as attending  
from Event e, Attends a, Attends others, Friends s,Friends w   
where s.f1='5' and s.f2=w.f1 and s.f1=w.f2   
and s.visible=1 and w.visible=1 
and s.f2=a.uid and others.eid=a.eid   
group by a.eid;
#+-----+-------+-------+----------+-------+--------- --+
#| eid | start | end   | activity | descr | attending |
#+-----+-------+-------+----------+-------+-----------+
#|   2 |  7211 | 14411 | fun      | NULL  | 3,4,5,1,2 |
#|   5 |  1814 |  9014 | any      | NULL  | 1         |
#+-----+-------+-------+----------+-------+-----------+
insert into Attends(uid,eid,lastupdate) values (1,2,0);
select distinct e.eid,start,end,activity,descr,group_concat(distinct others.uid) as attending  
from Event e, Attends a, Attends others, Friends s,Friends w   
where s.f1='5' and s.f2=w.f1 and s.f1=w.f2   
and s.visible=1 and w.visible=1 
and s.f2=a.uid and others.eid=a.eid   
group by a.eid;
#+-----+-------+-------+----------+-------+-----------+
#| eid | start | end   | activity | descr | attending |
#+-----+-------+-------+----------+-------+-----------+
#|   2 |  7211 | 14411 | fun      | NULL  | 3,4,5,1,2 |
#|   4 |    13 | 18013 | fitness  | NULL  | 2,1       |
#|   5 |  1814 |  9014 | any      | NULL  | 1         |
#+-----+-------+-------+----------+-------+-----------+
