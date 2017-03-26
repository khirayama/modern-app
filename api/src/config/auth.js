const passport = require('passport');
const passportJWT = require('passport-jwt');
const User = require('../models/user');
const config = require('./config');

const params = {
  secretOrKey: config.jwtSecret,
  jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
};

module.exports = () => {
  const strategy = new passportJWT.Strategy(params, (payload, done) => {
    // const user = users[payload.id] || null;

    if (user) {
      return done(null, {id: user.id});
    } else {
      return done(new Error('User not found'), null);
    }
  });

  passport.use(strategy);

  return {
    initialize: () => {
      return passport.initialize();
    },
    authenticate: () => {
      return passport.authenticate('jwt', config.jwtSession);
    }
  };
};
