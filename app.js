const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose=require("mongoose")
const session = require('express-session')
const passport=require("passport")
const passportLocalMongoose=require("passport-local-mongoose")
require('dotenv').config()

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

app.use(session({
  secret:process.env.SECRET,
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

main().catch(err => console.log(err));
 
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/userDB');
}

const userSchema= new mongoose.Schema({
    email:String,
    password:String
});

userSchema.plugin(passportLocalMongoose);

const User=mongoose.model("user",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",(req,res)=>{
    res.render("home")
});


app.get("/login",(req,res)=>{
    res.render("login")
});


app.get("/register",(req,res)=>{
    res.render("register")
});

app.get('/secrets', (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect('/login');
  }
});
app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.post("/register",async function(req,res){
  const username = req.body.username;
  const password = req.body.password;
  User.register({ username: username }, password).then(() => {
    const authenticate = passport.authenticate("local");
    authenticate(req, res, () => {
      res.redirect('/secrets');
    });
  }).catch(err => {
    console.log(err);
    res.redirect("/register");
  });
});

app.post("/login",(req,res) => {
  const newUser = new User ({
      username: req.body.username,
      password: req.body.password
  })
  try{
  req.login(newUser,(err)=> {
      if(err){
          console.log(err)
      }else {
          passport.authenticate("local")(req,res,function(){
              res.redirect("/secrets");
          })
      }
  })
}catch(err){
  console.log(err);
}
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
