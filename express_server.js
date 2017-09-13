const express = require('express');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 8080;

const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

//generates 6 random alphanumeric characters 'unique shortURL'
//for now, global scope
const generateRandomString = () => {
  var shortURL = Math.random()
    .toString(36)
    .substr(2, 6);
  return shortURL;
};

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.end('Hello!');
});

//redirect short urls
app.get('/u/:shortURL', (req, res) => {
  //let longURL =
  res.redirect(longURL);
});

//when /urls request, render views/urls_index.ejs and pass in templateVars
app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  console.log(req.body);
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.get('/urls/:id', (req, res) => {
  console.log('/urls/id here');
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render('urls_show', templateVars);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.end('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
