const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose=require("mongoose")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));
main().catch(err => console.log(err));
 
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/userDB');
}

const userSchema= new mongoose.Schema({
    email:String,
    password:String
})


const User=mongoose.model("user",userSchema)


app.get("/",(req,res)=>{
    res.render("home")
})


app.get("/login",(req,res)=>{
    res.render("login")
})


app.get("/register",(req,res)=>{
    res.render("register")
})


app.post("/register",(req,res)=>{
    const newUser=new User({
        email:req.body.username,
        password:req.body.password
    })
  
    newUser.save().then(()=>{
        res.render("secrets")
    }).catch(err=>{
        console.log(err);
    })

});

app.post("/login",(req,res)=>{
    const username=req.body.username
    const password=req.body.password

    User.findOne({email:username}).then(fuser=>{
        if(fuser){
            if(fuser.password===password){
                res.render("secrets")
            }
         }else{
            res.send("nouser")
         }
    }).catch(err=>{
        console.log(err);
    })
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
