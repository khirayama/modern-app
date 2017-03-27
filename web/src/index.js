const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('cookie-session');
const TwitterStrategy = require('passport-twitter').Strategy;
const axios = require('axios');

const app = express();

const config = {
  twitter: {
    consumerKey: process.env.TWITTER_KEY,
    consumerSecret: process.env.TWITTER_SECRET,
    callbackURL: 'http://localhost:3001/auth/twitter/callback',
  },
};

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(new TwitterStrategy(config.twitter, (token, tokenSecret, profile, done) => {
  axios.post('http://localhost:3000/users', {
    provider: profile.provider,
    uid: profile.id,
    username: profile.username,
    imageUrl: profile.photos[0].value,
  }).then(res => {
    const user = res.data;
    return done(null, user);
  });
}));

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
  keys: [process.env.SECRET_KEY],
  name: '_modern_session',
  maxAge: 1000 * 60 * 24 * 365,
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.send(`
  <a href="/auth/twitter">login with twitter</a>
  `);
});

app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect('/');
    return;
  }
  res.send(`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <script src="https://code.jquery.com/jquery-3.2.1.min.js" integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4=" crossorigin="anonymous"></script>
    </head>
    <body>
      <h1>Loged in</h1>
      <script>
      $.ajax({
        url: '/token',
        method: 'POST',
      }).done(data => {
        console.log(data);
        $.ajax({
          crossDomain: true,
          method: 'GET',
          url: 'http://localhost:3000/user',
          headers: {
            'Authorization': 'Bearer ' + data.token,
          },
        }).done(res => {
          console.log(res);
        });
      });
      </script>
    </body>
  </html>
  `);
});

// token
app.post('/token', (req, res) => {
  const user = req.user;
  axios.post('http://localhost:3000/token', {
    provider: user.provider,
    uid: user.uid,
  }).then(res_ => {
    const token = res_.data;
    res.json(token);
  });
});

// auth
app.use('/auth', new express.Router()
  .get('/:provider', (req, res, next) => {
    const provider = req.params.provider;
    const options = {
      scope: null,
      session: false,
    };
    const authenticate = passport.authenticate(provider, options);

    authenticate(req, res, next);
  })
  .get('/:provider/callback', (req, res, next) => {
    const provider = req.params.provider;
    const options = {
      scope: null,
      session: false,
    };
    const authenticate = passport.authenticate(provider, options, (err, user) => {
      if (!user || err) {
        return res.redirect('/');
      }
      req.login(user, err => {
        if (err) {
          return next(err);
        }
        return res.redirect('/dashboard');
      });
    });

    authenticate(req, res, next);
  })
);
// app.get('/logout', logoutHandler);
// app.get('/destroy_user', destroyUserHandler);


app.listen(3001, () => {
  console.log('Start web server...http://localhost:3001');
});
