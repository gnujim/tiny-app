const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 8080;
const app = express();

// ** FUNCTIONS **

// generates 6 random alphanumeric characters 'unique shortURL'
function generateRandomString() {
  var charNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  charNum += charNum.toLowerCase() + '0123456789';
  var shortURL = '';
  for (var i = 0; i < 6; i++) {
    var randomIndex = Math.floor(Math.random() * charNum.length);
    shortURL += charNum.charAt(randomIndex);
  }
  // = Math.random()
  //   .toString(36)
  //   .substr(2, 6);
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

// cookie-session middleware
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

// use EJS for template
app.set('view engine', 'ejs');

// ** HARDCODED DATABASE OBJECTS **

// (not good practice to have in global scope)
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

// global users object
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

//
app.get('/urls', (req, res) => {
  let userUrls = urlsForUser(req.session.user_id);
  let templateVars = {
    urls: userUrls
  };
  res.render('urls_index', templateVars);
});

// render urls_new page **must stay under urls
app.get('/urls/new', (req, res) => {
  if (req.session.user_id) {
    res.render('urls_new');
  } else {
    res.redirect('/login');
  }
});

// edit page
app.get('/urls/:id', (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    const templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].longURL
    };
    res.render('urls_show', templateVars);
  } else {
    // display message or prompt
    res.status(403).send('NOOOO');
  } // else if?? url with matching id does not belong to them (if logged in)
});

// redirect short urls
app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// obtain longURL from user, create shortURL, add to database
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

// updates a URL resource and redirects to urls_index ***
app.post('/urls/:id', (req, res) => {
  // modifies long url w corresponding short url
  let long = req.body.longURL;
  let short = req.params.id;
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    //unnecessary because GET?
    urlDatabase[short].longURL = long;
  } else {
    //unnecessary because GET?
    res.status(401).send('no. put error msg hereee');
  }
  res.redirect('/urls');
});

// deletes id and value from urlDatabase
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// GET login
app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('login');
  }
});

// GET register returns a page that includes a form w email and password
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

// POST logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

//
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//--------------------------- other?

//
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

//Hello test page
app.get('/hello', (req, res) => {
  res.end('<html><body>Hello <b>World</b></body></html>\n');
});
