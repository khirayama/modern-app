const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jwt-simple');

const auth = require('./config/auth')();
const User = require('./models/user');
const config = require('./config/config');

const app = express();

app.use(bodyParser.json());
app.use(auth.initialize());

// user
app.get('/user', auth.authenticate(), (req, res) => {
  User.find({where: {id: req.user.id}}).spread(user => {
    res.json(user);
  });
});

app.post('/user', (req, res) => {
  const provider = req.body.provider;
  const uid = req.body.uid;
  const username = req.body.username;
  const imageUrl = req.body.imageUrl;

  User.findOrCreate({where: {
    provider,
    uid,
  }, defaults: {
    provider,
    uid,
    username,
    imageUrl,
  }}).spread((user, created) => {
    if (created) {
      res.sendStatus(200);
    } else {
      res.sendStatus(409);
    }
  });
});

app.post('/token', (req, res) => {
  if (req.body.provider && req.body.uid) {
    const provider = req.body.provider;
    const uid = req.body.uid;
    User.find({where: {
      provider: provider,
      uid: uid,
    }}).spread(user => {
      if (user) {
        const payload = {id: user.id};
        const token = jwt.encode(payload, config.jwtSecret);

        res.json({token});
      } else {
        res.sendStatus(401);
      }
    });
  } else {
    res.sendStatus(401);
  }
});

app.listen(3000, () => {
  console.log('Start API server...http://localhost:3000');
});
