var passport = require('passport'), 
	FacebookTokenStrategy = require('passport-facebook-token').Strategy,
	config = require('../config/config.js');

passport.use('facebook-token', new FacebookTokenStrategy( config.fb, function(accessToken, refreshToken, profile, done) {
	console.log(accessToken);
	console.log(refreshToken);
	console.log(profile);
	users.findByFb( profile.id, function (user) {
		return done(null, user);
	});
}));

exports.validate = function (req,res,next){
	passport.authenticate('facebook-token', function(err, user, info) {
    	if (err) { return next(err); }
    	if (!user) { return res.redirect('/login'); }
    	console.log(user);
    	console.log(info);
    	req.logIn(user, function(err) {
      	if (err) { return next(err); }
      		return res.redirect('/users/' + user.username);
    	});
	})(req, res, next);
}