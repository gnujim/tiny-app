const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 8080;
const app = express();

// ** FUNCTIONS **

// function that generates 6 random alphanumeric characters
function generateRandomString() {
  var charNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  charNum += charNum.toLowerCase() + '0123456789';
  var shortURL = '';
  for (var i = 0; i < 6; i++) {
    var randomIndex = Math.floor(Math.random() * charNum.length);
    shortURL += charNum.charAt(randomIndex);
  }
  return shortURL;
}

// function that returns array of user specific urlPair objects
function urlsForUser(id) {
  let urls = [];
  for (key in urlDatabase) {
    if (id === urlDatabase[key].userID) {
      let urlPairs = {
        shortUrl: key,
        longUrl: urlDatabase[key].longURL
      };
      urls.push(urlPairs);
    }
  }
  return urls;
}

// ** MIDDLEWARE **

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: 'session',
    keys: ['secret']
  })
);

// res.locals
app.use(function locals(req, res, next) {
  res.locals.user = users[req.session.user_id];
  res.locals.shortURL = req.params.id;
  res.locals.longURL = urlDatabase[req.params.id];
  next();
});

app.set('view engine', 'ejs');

// ** HARDCODED DATABASE OBJECTS **

// hardcoded urlDatabase object
var urlDatabase = {
  b2xVn2: {
    userID: 'userRandomID',
    longURL: 'http://www.lighthouselabs.ca'
  },
  '9sm5xK': {
    userID: 'user2RandomID',
    longURL: 'http://www.google.com'
  },
  '8sme4k': {
    userID: 'user2RandomID',
    longURL: 'http://www.facebook.com'
  }
};

// hardcoded users object (user database)
var users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: '$2a$10$ecEcOT15ekLpW5iMg8dALu7HRzJL5Cr6qx1FZUmFPOk5oKHLmxb9S'
    // 'purple-monkey-dinosaur'
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: '$2a$10$hQOInZ/Kl.FyH13eU343UezvdzGWd9zU3ryDw3d9trgOCvUMhmmyi'
    // 'dishwasher-funk'
  }
};

// ** ROUTES **

// if user is logged in, head to /urls
// if not logged in, prompt to /login
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// urls index page
// shows list of URLs user has created
app.get('/urls', (req, res) => {
  let userUrls = urlsForUser(req.session.user_id);
  let templateVars = {
    urls: userUrls
  };
  res.render('urls_index', templateVars);
});

// renders page that allows logged in user to add new urls
// if not logged in, redirects to login
app.get('/urls/new', (req, res) => {
  if (req.session.user_id) {
    res.render('urls_new');
  } else {
    res.redirect('/login');
  }
});

// renders page that allows user to edit their existing short url
//
app.get('/urls/:id', (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    const templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].longURL
    };
    res.render('urls_show', templateVars);
  } else {
    res.status(403).send('Forbidden.');
  }
});

// redirects shortURL to longURL site
app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// generates a short URL, saves it, associates it with user in database
app.post('/urls', (req, res) => {
  let long = req.body.longURL;
  let short = generateRandomString();
  let id = req.session.user_id;
  let newData = {};
  urlDatabase[short] = {
    userID: id,
    longURL: long
  };
  res.redirect(`/urls/${short}`);
});

// updates a url if user is logged in
app.post('/urls/:id', (req, res) => {
  let long = req.body.longURL;
  let short = req.params.id;
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    urlDatabase[short].longURL = long;
  }
  res.redirect('/urls');
});

// deletes urls from urlDatabase
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// login page, redirects to index if user already logged in
app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('login');
  }
});

// register page, redirects to index if user already logged in
app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('register');
  }
});

// login handler
app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let user_id;
  for (let key in users) {
    if (email === users[key].email) {
      user_id = key;
    }
  }
  if (user_id) {
    if (bcrypt.compareSync(password, users[user_id].password)) {
      req.session.user_id = user_id;
    } else {
      res.status(403).send('Forbidden. Invalid password.');
    }
  } else {
    res.status(403).send('Forbidden. User does not exist.');
  }
  res.redirect('/urls');
});

// register handler
app.post('/register', (req, res) => {
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  if (!userEmail || !userPassword) {
    res.status(400).send('Bad Request');
  }
  for (key in users) {
    if (userEmail === users[key].email) {
      res.status(400).send('Bad Request. Email already exists.');
    }
  }
  let userId = generateRandomString();
  let hashedPassword = bcrypt.hashSync(userPassword, 10);
  users[userId] = {
    id: userId,
    email: userEmail,
    password: hashedPassword
  };
  req.session.user_id = userId;
  res.redirect('/urls');
});

// logout deletes cookie, redirects to index
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

//
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// ** EARLIER STEPS IN PROJECT **

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

//Hello test page
app.get('/hello', (req, res) => {
  res.end('<html><body>Hello <b>World</b></body></html>\n');
});
