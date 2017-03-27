const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jwt-simple');

const auth = require('./config/auth')();
const User = require('./models').User;
const config = require('./config/config');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});
app.use(bodyParser.json());
app.use(auth.initialize());

function omitUser(user) {
  return Object.assign({}, {
    id: user.id,
    provider: user.provider,
    uid: user.uid,
    username: user.username,
    imageUrl: user.imageUrl,
  });
}

// user
app.get('/user', auth.authenticate(), (req, res) => {
  User.findOne({where: {id: req.user.id}}).then(user => {
    res.json(omitUser(user));
  });
});

app.post('/users', (req, res) => {
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
  }}).spread(user => {
    res.json(omitUser(user));
  });
});

app.post('/token', (req, res) => {
  if (req.body.provider && req.body.uid) {
    const provider = req.body.provider;
    const uid = req.body.uid;

    User.findOne({where: {
      provider,
      uid,
    }}).then(user => {
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
