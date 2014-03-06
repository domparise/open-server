OPEN Server  
===========  
DOLODEV LLC  
v0.1  

tests:
files for testing currently exists in same directory as source, with test appended.
for database, use testOpen db instead of open db;
logs also log to test log files;
files exist as:
test<fileName>.<ext>

logs:
log file directories exist in each relevant directory, where log files are created as:
<fileName>-<unixTime>.txt files