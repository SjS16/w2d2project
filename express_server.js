//set requirements
var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");


//tell express to use ejs as templating engine
app.set("view engine", "ejs");

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purplemonkeydinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Helpers

function isAlreadyRegistered(email) {
 for (let key in users) {
  const user = users[key];
  if (user.email === email) {
    return true;
  }
 }
 return false;
}

//Routes

app.get("/", (req, res) => {
  res.end("Hello!");
});

//pass url data from views/urls_index to express_server.js
app.get("/urls", (req, res) => { //new route handle for /urls
  let templateVars = { urls: urlDatabase,
  username: req.cookies["username"]};
  res.render("urls_index", templateVars); //pass url data to template
});

//use urls_new to render endpoint /urls/new
app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"]};
  res.render("urls_new", templateVars);
});

//new route to render single url display page
app.get("/urls/:id", (req, res) => { //new route handle for /urls
  const templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
   let templateVars = { username: req.cookies["username"]};
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  let templateVars = { username: req.cookies["username"]};
  const { email, password } = req.body;
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Please Fill All Required Fields");
  } else if (isAlreadyRegistered(email)) {
    res.status(400).send("User already registered");
  } else {
    userID = generateRandomString();
    users[userID] = {
      id: userID,
      email: email,
      password: password
    }
    res.cookie('userID', userID);
    res.redirect('/urls');
  }
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL
    let templateVars = { username: req.cookies["username"]};
  res.redirect(`/urls`);
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  shortURL = generateRandomString();
  urlDatabase[shortURL] = ("http://" + longURL);
    let templateVars = { username: req.cookies["username"]};
  res.redirect(`http://localhost:8080/urls/${shortURL}`);        // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:id/delete", (req, res) => {
  shortURL = req.params.id;
  delete urlDatabase[shortURL];
    let templateVars = { username: req.cookies["username"]};
  res.redirect("/urls/");
});

app.get("/u/:shortURL", (req, res) => {
   let longURL = urlDatabase[req.params.shortURL];
     let templateVars = { username: req.cookies["username"]};
  res.redirect(longURL);
});

app.post("/logout", (req, res) => {
  res.clearCookie('username', req.body.username);
  res.redirect('/urls');
});

app.get("/hello", (req, res) => {
    let templateVars = { username: req.cookies["username"]};
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

//function to generate unique short url string
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }return text;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
