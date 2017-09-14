const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 8080;
const app = express();

//generates 6 random alphanumeric characters 'unique shortURL'
//for now, global scope
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

//middleware
app.use(bodyParser.urlencoded({ extended: true }));

//
app.use(cookieParser());

//
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//use EJS for template
app.set('view engine', 'ejs');

//(not good practice to have in global scope)
const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

//global user object
var users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

// ** ROUTES **

//root
app.get('/', (req, res) => {
  res.end('Hello!');
});

//when /urls request, render views/urls_index.ejs and pass in templateVars
app.get('/urls', (req, res) => {
  let templateVars = {
    username: req.cookies['username'],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

//render urls_new page
app.get('/urls/new', (req, res) => {
  let templateVars = { username: req.cookies['username'] };
  res.render('urls_new', templateVars);
});

//once redirected, render urls_show page
app.get('/urls/:id', (req, res) => {
  let templateVars = {
    username: req.cookies['username'],
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render('urls_show', templateVars);
});

//redirect short urls
app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//obtain longURL from user, create shortURL, add to database
app.post('/urls', (req, res) => {
  console.log(req.body);
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

//??? why is adding in get and not post?
//updates a URL resource and redirects to urls_index
app.post('/urls/:id', (req, res) => {
  //modifies long url w corresponding short url

  res.redirect('/urls');
});

//deletes id and value from urlDatabase
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//GET login

//GET register returns a page that includes a form w email and password
app.get('/register', (req, res) => {
  res.render('register');
});

//login route
app.post('/login', (req, res) => {
  let username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

//register handler
app.post('/register', (req, res) => {
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  let userId = generateRandomString();
  for (key in users) {
    if (userEmail === users[key].email) {
      res.status(400).send('Bad Request. Email already exists.');
    }
  }
  if (!userEmail || !userPassword) {
    res.status(400).send('Bad Request');
  }
  users[userId] = {
    id: userId,
    email: userEmail,
    password: userPassword
  };
  console.log(users[userId]);
  res.cookie('user_id', userId);
  res.redirect('/urls');
});

//POST logout
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

//
//--------------------------- other?

//
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

//Hello test page
app.get('/hello', (req, res) => {
  res.end('<html><body>Hello <b>World</b></body></html>\n');
});
