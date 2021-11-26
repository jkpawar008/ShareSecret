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

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SECRETKEY,
  resave : false,
  saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

/////////////////////////////////////applying securtiy ...////////////////////////////////////////

//level 1: by storing email with password in database;

//level 2 : applied encyption
// console.log(process.env.API_KEY);
// userSchema.plugin(encrypt,{secret : process.env.SECRETKEY , encryptedFields : ["password"]});

//level 3: by using hash..here md5 hash

//level 4 : add salting + bcrypt

//level 5 : by using passport package.. session..cookies ..etc.

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});
app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});
app.get("/logout" , function(req, res) {
  req.logout();
  res.redirect("/");
})
app.get("/secrets" , function(req, res) {
   if(req.isAuthenticated()) {
     res.render("secrets");
   } else {
     res.redirect("/login");
   }
});

app.post("/login", function (req, res) {

    const user = new User ({
      username : req.body.username,
      password : req.body.password
    })

    req.login(user , function(err) {
      if(err) {
        console.log(err);

      } else {
        passport.authenticate("local")(req,res, function() {  //local is name of strategy use here
          res.redirect("/secrets");
        })
      }
    }) 

});

app.post("/register", function (req, res) {
    User.register({username: req.body.username ,active : false } , req.body.password , function(err , results) {
      if(err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req,res, function() {
          res.redirect("/secrets");
        });
      }
    })
});

//setting up server to listen on port 3000

app.listen(3000, function () {
  console.log("server is successfully started on port 3000");
});
