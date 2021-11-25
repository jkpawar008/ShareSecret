require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const encrypt = require("mongoose-encryption"); 

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

console.log(process.env.API_KEY);

userSchema.plugin(encrypt,{secret : process.env.SECRETKEY , encryptedFields : ["password"]});

const User = new mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  res.render("home");
});
app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/login", function(req,res) {
    const userName = req.body.username;
    const passWord = req.body.password;
    
    User.findOne({email : userName} , function(err , result) {
        if(err) {
            console.log(err); 
            res.redirect("login");
        } else {
            if( result.password === passWord) {
                res.render("secrets");
            } else {
                res.redirect("login");
               
            }
        }

    })

});

app.post("/register", function (req, res) {
  const userName = req.body.username;
  const passWord = req.body.password;
  const newUser = new User({
    email: userName,
    password: passWord,
  });
  newUser.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.render("secrets");
    }
  });
});

//setting up server to listen on port 3000

app.listen(3000, function () {
  console.log("server is successfully started on port 3000");
});
