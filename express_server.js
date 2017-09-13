const express = require('express');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 8080;
const app = express();

//middleware
app.use(bodyParser.urlencoded({ extended: true }));

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

//generates 6 random alphanumeric characters 'unique shortURL'
//for now, global scope
const generateRandomString = () => {
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
};

// ** ROUTES **

app.get('/', (req, res) => {
  res.end('Hello!');
});

//redirect short urls
app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//when /urls request, render views/urls_index.ejs and pass in templateVars
app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

//render urls_new page
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

//allow user to enter new longURL
app.post('/urls', (req, res) => {
  console.log(req.body);
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

//user can add to urlDatabase
app.get('/urls/:id', (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render('urls_show', templateVars);
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

//
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

//Hello test page
app.get('/hello', (req, res) => {
  res.end('<html><body>Hello <b>World</b></body></html>\n');
});
