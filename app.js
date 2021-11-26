require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SECRETKEY,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
/////////////////////////////////////applying securtiy ...////////////////////////////////////////

//level 1: by storing email with password in database;

//level 2 : applied encyption
// console.log(process.env.API_KEY);
// userSchema.plugin(encrypt,{secret : process.env.SECRETKEY , encryptedFields : ["password"]});

//level 3: by using hash..here md5 hash

//level 4 : add salting + bcrypt

//level 5 : by using passport package.. session..cookies ..etc.

//level 6 : OAuth-openid...google SSO

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secret",
    },
    function (accessToken, refreshToken, profile, cb) {
      // console.log(profile);
      User.findOrCreate({ username : profile.id}, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/", function (req, res) {
  res.render("home");
});
app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});
app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});
app.get("/secrets", function (req, res) {

    User.find({"secret": {$ne : null}}, function(err ,result) {
      if(err) {
        console.log(err);
      } else {
        res.render("secrets" , {userSecret : result});
      }
    });

});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secret",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  }
);
app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        //local is name of strategy use here
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username, active: false },
    req.body.password,
    function (err, results) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});
app.post("/submit" , function(req, res) {
  let secrettext= req.body.secret;
  console.log(req.user._id);
  
  User.findById(req.user._id , function( err , result) {
    if(err) {
      console.log(err);
    } else {
      if(result) {
        result.secret= secrettext;
        result.save( function() {
            res.redirect("/secrets");
        });
      }
    }
  });
})

//setting up server to listen on port 3000

app.listen(3000, function () {
  console.log("server is successfully started on port 3000");
});
