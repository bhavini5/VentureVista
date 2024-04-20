const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { userSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const User= require("../models/user.js");
const passport = require("passport");
const {saveRedirectUrl}=require("../middleware.js")

router.get("/signup",(req,res)=>{
    res.render("users/signup.ejs");
})

router.post("/signup",async(req,res)=>{
    try{
        let {username,email,password}=req.body;
    const newUser=new User({email,username});
    const registeredUser=await User.register(newUser,password);
    // console.log(registeredUser);
    req.login(registeredUser,(err)=>{
        if(err){
            return next (err);
        }
        req.flash("success","welcome to VentureVista");
        res.redirect("/listings")
    })
   
    }
    catch(e){
        req.flash("error",e.message);
        res.redirect("/signup")
    }
})
router.get("/login",(req,res)=>{
    res.render("users/login.ejs");
})

router.post("/login",saveRedirectUrl,
    passport.authenticate("local",{
        failureRedirect:'/login' ,
        failureFlash:true ,
    }) ,
    async(req,res)=>{
        req.flash("success","Welcome back to VentureVista");
        let redirectUrl=res.locals.redirectUrl || "/listings";
        res.redirect(redirectUrl); // res.locals.redirectUrl function is defined in url 
    })

    router.get("/logout",(req, res)=>{
        req.logout((err)=>{ //take cb as parameter ki logout k bad kya hona chahiye
            if(err){
                return next (err);
            }
            req.flash("success","you are loged out")
            res.redirect("/listings");
        }  )   
    })

module.exports=router;