//set requirements
var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieSession = require('cookie-session')
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');


//tell express to use ejs as templating engine
app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: [process.env.SECRET_KEY || 'dvelopment']
}));

app.use(bodyParser.urlencoded({extended: true}));

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purplemonkeydinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
}

var urlDatabase = {
  "b2xVn2": {
    shorturl: "b2xVn2",
    longurl: "http://www.lighthouselabs.ca",
    userid: "user2RandomID"
  },
  "9sm5xK": {
    shorturl:"9sm5xK",
    longurl: "http://www.google.com",
    userid: "userRandomID"
  } 
}

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

function getUrlsForUser(id) {
  let obj = {};
  Object.keys(urlDatabase).forEach(function (key) {
    if (urlDatabase[key].userid === id) {
      obj[key] = urlDatabase[key]
    }
  })
  return obj;
}


//Routes

app.get("/", (req, res) => {
  let templateVars = {
    user: req.session.userid
  };
  if (!templateVars.user) {
    res.redirect('/login');
  } res.redirect('/urls');
});

//use urls_new to render endpoint /urls/new
app.get("/urls/new", (req, res) => {

  if (!req.session.userid) {
      res.redirect('/login');
    } 
  let templateVars = {
    user: req.session.userid,
    email: users[req.session.userid].email
  };
  res.render("urls_new", templateVars);
});

//new route to render single url display page
app.get("/urls/:id", (req, res) => { //new route handle for /urls
  if (!urlDatabase.hasOwnProperty(req.params.id)) {
    res.status(400).send("URL does not exist")
  }
  const templateVars = { 
     shorturl: req.params.id, 
     longurl: urlDatabase[req.params.id].longurl, 
     user: req.session.userid,
     email: users[req.session.userid].email
   };
  if (!templateVars.user) {
    res.redirect('/login');
  } if (templateVars.user !== urlDatabase[req.params.id].userid) {
    res.status(401).send("Not your URL")
  } 
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  if (req.session.userid) {
    res.status(400).send("User already signed in");
    res.redirect("/urls");
  }
   let templateVars = { 
     user: req.session.userid
   };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Please Fill All Required Fields");
  } else if (isAlreadyRegistered(email)) {
    res.status(400).send("User already registered");
  } else {
    userid = generateRandomString();
    users[userid] = {
      id: userid,
      email: email,
      password: bcrypt.hashSync(password, 10)
    }
    req.session.userid = userid;
    res.redirect('/urls');
  }
});

app.get("/login", (req, res) => {
  if (req.session.userid) {
    res.status(400).send("User already signed in");
    res.redirect("/urls");
  }let templateVars = {
    user: req.session.userid,
  };
  
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
    for (userid in users) {
      if (userid === username) {
        if (bcrypt.compareSync(password, users[userid].password)) {
          req.session.userid = userid
          res.redirect('/urls');
       }
      } 
    }
    res.status(403).send("Not a valid login");
    res.redirect('/login');
});

//pass url data from views/urls_index to express_server.js
app.get("/urls", (req, res) => { //new route handle for /urls
 if (!req.session.userid) {
   res.status(401).send("Not logged in");
   res.redirect('/login');
  } else {
   let templateVars = {
     urls: urlDatabase,
     longurl: urlDatabase,
     user: req.session.userid,
     email: users[req.session.userid].email
   };
    templateVars.urls = getUrlsForUser(templateVars.user)
    res.render("urls_index", templateVars); 
  };
  //pass url data to template
});

app.post("/urls/:id", (req, res) => {
  if (!req.params.id) {
    res.status(400).send("Short URL Code does not exist")
  }
  const shortURL = req.params.id
  let templateVars = {
    user: req.session.userid,
    longURL: urlDatabase[req.params.id].longurl,
    email: users[req.session.userid].email
  }
  if (templateVars.user === urlDatabase[shortURL].userid) {
  urlDatabase[shortURL].longurl = req.body.longURL
    res.redirect(`/urls`);
    } else {
      res.status(401).send("Not your URL");
    }
});

app.post("/urls", (req, res) => {
  if (!req.session.userid) {
    res.status(401).send("Not logged in")
    res.redirect('/login');
  } else {
  const longURL = req.body.longURL;
  let templateVars = {
    userid: req.session.userid,
    email: users[req.session.userid].email
  };
  shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    shorturl: shortURL,
    longurl: longURL,
    userid: req.session.userid
  } 
  res.redirect(`http://localhost:8080/urls/${shortURL}`); 
  }       // Respond with 'Ok' (we will replace this)
});


app.post("/urls/:id/delete", (req, res) => {
  shortURL = req.params.id; let templateVars = {
    user: req.session.userid,
    longURL: urlDatabase[req.params.id].longurl,
    email: users[req.session.userid].email
  }
  if (templateVars.user === urlDatabase[shortURL].userid) {
    delete urlDatabase[shortURL];
    res.redirect(`/urls`);
  } else {
    res.status(401).send("Not your URL");
  }
  res.redirect("/urls/");
});

app.get("/u/:shortURL", (req, res) => {
   let longURL = urlDatabase[req.params.shortURL].longurl;
     let templateVars = { 
       user: req.session.userid,
       email: users[req.session.userid].email
      };
  res.redirect(longURL);

});

app.post("/logout", (req, res) => {
    req.session = null;
  res.redirect('/login');
});

app.get("/hello", (req, res) => {
    let templateVars = { 
      user: req.session.userid,
      email: users[req.session.userid].email
     };
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
