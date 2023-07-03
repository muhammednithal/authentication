require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose=require("mongoose")
const session = require('express-session')
const passport=require("passport")
const passportLocalMongoose=require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')


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
    password:String,
    googleId:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User=mongoose.model("user",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});
 
passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},
function(accessToken, refreshToken, profile, cb) {
 
  User.findOrCreate({ googleId: profile.id ,username:profile.displayName}, function (err, user) {
    return cb(err, user)
  })
}
));

app.get("/",(req,res)=>{
    res.render("home")
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login",(req,res)=>{
    res.render("login")
});


app.get("/register",(req,res)=>{
    res.render("register")
});

app.get('/secrets', (req, res) => {
 User.find({"secret":{$ne:null}}).then((foundUsers)=>{
  res.render("secrets",{ userwithsecret : foundUsers } )
 }).catch(err=>{
  console.log(err)
 })
});

app.get("/submit",(req,res)=>{
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect('/login');
  }
});

app.post("/submit",(req,res)=>{
  const submittedsecret=req.body.secret
 
  User.findById(req.user.id).then((foundUser)=>{
    if(foundUser){
      foundUser.secret=submittedsecret
      foundUser.save().then(()=>{
        res.redirect("/secrets")
      })
    }
  }).catch(()=>console.log(err))

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
