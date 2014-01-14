var connect = require('connect'),
	https = require('https');

var app = connect()
  .use(connect.logger('dev'))
  .use(connect.json());

https.createServer({
	certificate: fs.readFileSync('auth/cert.pem'),
	key: fs.readFileSync('auth/key.pem')
}).listen(3000);