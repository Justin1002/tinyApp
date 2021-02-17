const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const request = require('request-promise-native');
const bcrypt = require('bcrypt');
const { generateRandomString,checkEmail, checkPassword, findUser } = require("./helpers");
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys:['key1','key2']
}));

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  "userRandomID": {
    id:"userRandomID",
    email:"user@example.com",
    password: "purple-monkey-dinosaur"
  },
};

const visitorData = {}

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    urls: urlDatabase,
    user: findUser(users,userID)
  };
  if (Object.keys(templateVars['user']).length === 0) {
  res.render("urls_register", templateVars);
  }
  else {
    res.redirect('/urls/')
  }
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    urls: urlDatabase,
    user: findUser(users,userID)
  };
  if (Object.keys(templateVars['user']).length === 0) {
  res.render("urls_login", templateVars);
  }
  else {
    res.redirect('/urls/')
  }
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    urls: urlDatabase,
    user: findUser(users,userID),
    visitors: visitorData
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    urls: urlDatabase,
    user: findUser(users,userID)
  };
  //check if there's a user_id cookie and the user is logged in 
  if (req.session.user_id && Object.keys(templateVars['user']).length > 0) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect(`/login`);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  if (urlDatabase[req.params.shortURL]) {
    const templateVars = {
      urls: urlDatabase,
      user: findUser(users,userID),
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]['longURL']
    };
    res.render("urls_show", templateVars);
  }
  else {
    res.status(403)
    const templateVars = {
      urls: urlDatabase,
      user: findUser(users,userID),
      error: "URL does not exist",
      statusCode: res.statusCode
    }
    res.render('urls_error.ejs', templateVars)
  } 
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let shortURL = req.params.shortURL
    let longURL = urlDatabase[shortURL]['longURL'];
    //log unique visitor data
    if (!req.session.visitor_id) {
      req.session.visitor_id = generateRandomString();
  
      if (!visitorData[shortURL]) {
        visitorData[shortURL] = []
        visitorData[shortURL].push({visitorID: req.session.visitor_id})
      }
      else {
        visitorData[shortURL].push({visitorID: req.session.visitor_id}) 
      }
    }

  //count hits 
    if (longURL.indexOf("http://") !== -1 || longURL.indexOf("https://") !== -1) {
      urlDatabase[shortURL]['count'] = (urlDatabase[shortURL]['count'] + 1) || 1;
      res.redirect(longURL);
    } else {
      longURL = 'http://' + longURL;
      urlDatabase[shortURL]['count'] = (urlDatabase[shortURL]['count'] + 1) || 1;
      res.redirect(longURL);
    }
    } else {
    const userID = req.session.user_id;
    res.status(403)
    const templateVars = {
      urls: urlDatabase,
      user: findUser(users,userID),
      error: "URL does not exist",
      statusCode: res.statusCode
    }
    res.render('urls_error.ejs', templateVars)
  }
});

app.get("/error/", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    urls: urlDatabase,
    user: findUser(users,userID),
  };
  res.render('urls_error.ejs', templateVars)
})

app.post("/urls", (req, res) => {
  let longURL = req.body["longURL"];
  let shortURL = generateRandomString();
  let date = new Date().toISOString().slice(0, 10)
  urlDatabase[shortURL] = {longURL: longURL, userID: req.session.user_id, date: date};
  res.redirect(`/urls/${shortURL}`);
});


app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.session.user_id === urlDatabase[shortURL]['userID']) {
    delete urlDatabase[shortURL];
    res.redirect(`/urls/`);
  } else {
    res.status(403).send('Error code 403: Restricted Action');
  }
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  console.log(urlDatabase);
  if (req.session.user_id === urlDatabase[id]['userID']) {
    urlDatabase[id]['longURL'] = req.body['newURL'];
    res.redirect(`/urls/`);
  } else {
    res.status(403).send('Error code 403: Restricted Action');
  }
});

app.post("/register", (req, res) => {
  let email = req.body['email'];
  if (req.body['email'] === "" || req.body['password'] === "") {
    const userID = req.session.user_id;
    res.status(400)
    const templateVars = {
      urls: urlDatabase,
      user: findUser(users,userID),
      error: "email and/or password empty",
      statusCode: res.statusCode
    };
    res.render('urls_error.ejs', templateVars)
  } else if (checkEmail(users,email)) {
    const userID = req.session.user_id;
    res.status(400)
    const templateVars = {
      urls: urlDatabase,
      user: findUser(users,userID),
      error: "email already exists",
      statusCode: res.statusCode
    };
    res.render('urls_error.ejs', templateVars)
  } else {
    let uniqueID = generateRandomString();
    let hashedPW = bcrypt.hashSync(req.body['password'], 10);
    users[uniqueID] = {id: uniqueID, email: req.body['email'], password: hashedPW};
    req.session.user_id = uniqueID;
    res.redirect(`/urls`);
  }

});

app.post("/login/", (req, res) => {
  let email = req.body['email'];
  let pw = req.body['password'];

  if (!checkEmail(users,email)) {
    const userID = req.session.user_id;
    res.status(404)
    const templateVars = {
      urls: urlDatabase,
      user: findUser(users,userID),
      error: "email not found",
      statusCode: res.statusCode
    };
    res.render('urls_error.ejs', templateVars)
  } else {
    if (checkPassword(users,pw)[0]) {
      req.session.user_id = checkPassword(users,pw)[1];
      res.redirect(`/urls`);
    } else {
      const userID = req.session.user_id;
      res.status(403)
      const templateVars = {
        urls: urlDatabase,
        user: findUser(users,userID),
        error: "password is incorrect",
        statusCode: res.statusCode
      }
      res.render('urls_error.ejs', templateVars)
    }
  }
});

app.post("/logout/", (req, res) => {
  res.clearCookie('session');
  res.clearCookie('session.sig');
  res.redirect(`/urls/`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


