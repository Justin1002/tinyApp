/** Initialize code dependencies **/
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const { generateRandomString,checkEmail, checkPassword, findUser, timeStamp } = require("./helpers");
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys:['key1','key2']
}));
app.use(methodOverride('_method'));

/** Database initialization for URLs, users and visitor data **/
let urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

let users = {
  "userRandomID": {
    id:"userRandomID",
    email:"user@example.com",
    password: "purple-monkey-dinosaur"
  },
};

let visitorData = {};

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

/** app.get routes **/

app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    urls: urlDatabase,
    user: findUser(users,userID)
  };
  // Redirect to main page if user is already logged in
  if (Object.keys(templateVars['user']).length === 0) {
    res.render("urls_register", templateVars);
  } else {
    res.redirect('/urls/');
  }
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    urls: urlDatabase,
    user: findUser(users,userID)
  };
  // Redirect to main page if user is already logged in
  if (Object.keys(templateVars['user']).length === 0) {
    res.render("urls_login", templateVars);
  } else {
    res.redirect('/urls/');
  }
});

app.get("/urls", (req, res) => {
  //reloads page instead of the cached version
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

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
  //check if there's a user_id cookie and the user is logged in, if not redirect to the login page
  if (req.session.user_id && Object.keys(templateVars['user']).length > 0) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect(`/login`);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  //automatically reloads page instead of loading the cached version
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  const userID = req.session.user_id;
  const { shortURL } = req.params

  // Checks if the URL exists, otherwise show an error page
  if (urlDatabase[shortURL]) {
    const templateVars = {
      urls: urlDatabase,
      user: findUser(users,userID),
      shortURL: shortURL,
      longURL: urlDatabase[shortURL]['longURL'],
      visitors: visitorData
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(403);
    const templateVars = {
      urls: urlDatabase,
      user: findUser(users,userID),
      error: "URL does not exist",
      statusCode: res.statusCode
    };
    res.render('urls_error.ejs', templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params
  // Checks if the short URL exists, otherwise show an error page
  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL]['longURL'];
    
    //Creates a unique cookie for a visitor
    if (!req.session.visitor_id) {
      req.session.visitor_id = generateRandomString();
    }
    
    const visitorID = req.session.visitor_id;
    const currentVisitorData = visitorData[shortURL]

    //Creates a timestamp for the unique visitor when they visit the site
    if (!currentVisitorData) {
      visitorData[shortURL] = { [visitorID]: [] }
    
    } else if (!currentVisitorData[visitorID]) {
      visitorData[shortURL][visitorID] = [];
    }

    visitorData[shortURL][visitorID].push(timeStamp());

    //Checks if URL submitted has http:// or https:// in front for correct routing, if not then it will add it to the string when rerouted. 
    if (longURL.indexOf("http://") !== -1 || longURL.indexOf("https://") !== -1) {
      //tracks number of visitors to a link in the shortURL object
      urlDatabase[shortURL]['count'] = (urlDatabase[shortURL]['count'] + 1) || 1;
      res.redirect(longURL);
    } else {
      longURL = 'http://' + longURL;
       //tracks number of visitors to a link in the shortURL object
      urlDatabase[shortURL]['count'] = (urlDatabase[shortURL]['count'] + 1) || 1;
      res.redirect(longURL);
    }
  } else {
    const userID = req.session.user_id;
    res.status(403);
    const templateVars = {
      urls: urlDatabase,
      user: findUser(users,userID),
      error: "URL does not exist",
      statusCode: res.statusCode
    };
    res.render('urls_error.ejs', templateVars);
  }
});

/** app.post routes **/

app.post("/urls", (req, res) => {
  //Adds new url to the URL database, and redirects to the shortURL page
  const longURL = req.body["longURL"];
  const shortURL = generateRandomString();
  const date = new Date().toISOString().slice(0, 10);
  urlDatabase[shortURL] = {longURL: longURL, userID: req.session.user_id, date: date};
  res.redirect(`/urls/${shortURL}`);
});


app.delete("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  //Checks if the user requesting the delete method is the authenticated user
  if (req.session.user_id === urlDatabase[shortURL]['userID']) {
    delete urlDatabase[shortURL];
    res.redirect(`/urls/`);
  } else {
    res.status(403).send('Error code 403: Restricted Action');
  }
});

app.put("/urls/:id", (req, res) => {
  const { id } = req.params;
  //Checks if the user requesting the edit URL method is the authenticated user
  if (req.session.user_id === urlDatabase[id]['userID']) {
    urlDatabase[id]['longURL'] = req.body['newURL'];
    res.redirect(`/urls/`);
  } else {
    res.status(403).send('Error code 403: Restricted Action');
  }
});

app.post("/register", (req, res) => {
  const email = req.body['email'];
  const password = req.body['password'];
  // check if email or password forms are empty
  if (email === "" || password === "") {
    const userID = req.session.user_id;
    res.status(400);
    const templateVars = {
      urls: urlDatabase,
      user: findUser(users,userID),
      error: "email and/or password empty",
      statusCode: res.statusCode
    };
    res.render('urls_error.ejs', templateVars);
    // check if email already exists
  } else if (checkEmail(users,email)) {
    const userID = req.session.user_id;
    res.status(400);
    const templateVars = {
      urls: urlDatabase,
      user: findUser(users,userID),
      error: "email already exists",
      statusCode: res.statusCode
    };
    res.render('urls_error.ejs', templateVars);
    //registration successful
  } else {
    const uniqueID = generateRandomString();
    const hashedPW = bcrypt.hashSync(password, 10);
    users[uniqueID] = {id: uniqueID, email: email, password: hashedPW};
    req.session.user_id = uniqueID;
    res.redirect(`/urls`);
  }
});

app.post("/login/", (req, res) => {
  const email = req.body['email'];
  const pw = req.body['password'];
  //checks if email exists
  if (!checkEmail(users,email)) {
    const userID = req.session.user_id;
    res.status(404);
    const templateVars = {
      urls: urlDatabase,
      user: findUser(users,userID),
      error: "email not found",
      statusCode: res.statusCode
    };
    res.render('urls_error.ejs', templateVars);
    //checks if the inputted password matches the stored hash password and establishes the cookie if login was successful
  } else {
    if (checkPassword(users,pw)[0]) {
      req.session.user_id = checkPassword(users,pw)[1];
      res.redirect(`/urls`);

    } else {
      const userID = req.session.user_id;
      res.status(403);
      const templateVars = {
        urls: urlDatabase,
        user: findUser(users,userID),
        error: "password is incorrect",
        statusCode: res.statusCode
      };
      res.render('urls_error.ejs', templateVars);
    }
  }
});

 //Clears the cookies from the session when logout button is clicked
app.post("/logout/", (req, res) => {
  res.clearCookie('session');
  res.clearCookie('session.sig');
  res.redirect(`/urls/`);
});

//** 404 route **//
app.get('*', function(req, res){
  const userID = req.session.user_id;
  res.status(404);
  const templateVars = {
    urls: urlDatabase,
    user: findUser(users,userID),
    error: "PAGE NOT FOUND",
    statusCode: res.statusCode
  };
  res.render('urls_error.ejs', templateVars);
});

//** server initialization message **//
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});


