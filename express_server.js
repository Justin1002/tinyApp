const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const { generateRandomString,checkEmail, checkPassword } = require("./helper")
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
}

const users = {
  "userRandomID": {
    id:"userRandomID", 
    email:"user@example.com", 
    password: "purple-monkey-dinosaur"
  },
}


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  function findUser(users) {
    for (person in users) {
      if(req.cookies['user_id'] === person) {
        return users[person]
      }
    }
  }
  const templateVars = {
    urls: urlDatabase,
    user: findUser(users)
  };  
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  function findUser(users) {
    for (person in users) {
      if(req.cookies['user_id'] === person) {
        return users[person]
      }
    }
  }
  const templateVars = {
    urls: urlDatabase,
    user: findUser(users)
  };  
  res.render("urls_login", templateVars);
});



app.get("/urls", (req, res) => {
  function findUser(users) {
    for (person in users) {
      if(req.cookies['user_id'] === person) {
        return users[person]
      }
    }
  }
  const templateVars = {
    urls: urlDatabase,
    user: findUser(users)
  };  
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  function findUser(users) {
    for (person in users) {
      if(req.cookies['user_id'] === person) {
        return users[person]
      }
    }
  }
  const templateVars = {
    urls: urlDatabase,
    user: findUser(users)
  };
  if(req.cookies['user_id']) {  
  res.render("urls_new", templateVars);
  }
  else {
    res.redirect(`/login`);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  function findUser(users) {
    for (person in users) {
      if(req.cookies['user_id'] === person) {
        return users[person]
      }
    }
  }
  const templateVars = {
    urls: urlDatabase,
    user: findUser(users)
  };  
  templateVars['shortURL'] = req.params.shortURL
  templateVars['longURL'] = urlDatabase[req.params.shortURL]['longURL']
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]['longURL']
  if (longURL.indexOf("http://") !== -1 || longURL.indexOf("https://") !== -1 ) {
  res.redirect(longURL);
  }
  else {
    longURL = 'http://' + longURL
    res.redirect(longURL)
  }
});


app.post("/urls", (req, res) => {
  let longURL = req.body["longURL"]
  let shortURL = generateRandomString()
  urlDatabase[shortURL] = {}
  urlDatabase[shortURL]['longURL'] = longURL
  urlDatabase[shortURL]['userID'] = req.cookies['user_id']
  console.log(urlDatabase)
  res.redirect(`/urls/${shortURL}`);
})


app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL
  if (req.cookies['user_id'] === urlDatabase[shortURL]['userID']) {
    delete urlDatabase[shortURL]
    res.redirect(`/urls/`);
  }
  else {
    res.status(403).send('Error code 403: Restricted Action')
  }
})

app.post("/urls/:id", (req, res) => {
  const id = req.params.id
  console.log(urlDatabase)
  if (req.cookies['user_id'] === urlDatabase[id]['userID']) {
    urlDatabase[id]['longURL'] = req.body['newURL']
    res.redirect(`/urls/`);
  }
  else {
    res.status(403).send('Error code 403: Restricted Action')
  }
})

app.post("/register", (req, res) => {
  let email = req.body['email']
  console.log(email)
  if (req.body['email'] === "" || req.body['password'] === "") {
    res.status(400).send('Error code 400: email and/or password empty')
  }
  else if (checkEmail(users,email)) {
    res.status(400).send('Error code 400: email already exists')
  }
  else {
  let uniqueID = generateRandomString()
  users[uniqueID] = {}
  users[uniqueID]['id'] = uniqueID
  users[uniqueID]['email'] = req.body['email']
  users[uniqueID]['password'] = req.body['password']
  res.cookie('user_id', uniqueID)
  res.redirect(`/urls`);
  }

})

app.post("/login/", (req, res) => {
  let email = req.body['email']
  let pw = req.body['password']
  if (!checkEmail(users,email)) {
    res.status(403).send('Error code 403: Email cannot be found')
  }
  else {
    if(checkPassword(users,pw)[0]) {
      res.cookie('user_id',checkPassword(users,pw)[1]);
      res.redirect(`/urls`);
    }
    else {
      res.status(403).send('Error code 403: Password does not match');
    }
  }
})

app.post("/logout/", (req, res) => {
  res.clearCookie('user_id')
  res.redirect(`/urls/`);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


