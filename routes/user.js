const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { userSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const User= require("../models/user.js");
const passport = require("passport");
const {saveRedirectUrl}=require("../middleware.js")
const Listing = require("../models/listing.js");

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


    router.get("/my_properties", async (req, res) => {
        try {
            const currUser = req.user; // Assuming user object is available in request (e.g., from authentication middleware)
            // console.log(currUser);
            if (!currUser) {
                return res.status(403).send('User not authenticated');
            }
    
            const data = await Listing.find({ owner: currUser._id });
            if(data.length){
                res.render("listings/index.ejs", { allListings: data });
            }
            else{
                req.flash("error","You have no Property listed");
               res.redirect("/listings")
    
    
            }
        } catch (error) {
            console.error("Error fetching user properties:", error);
            res.status(500).send("Internal Server Error");
        }
    });

router.get("/requested/properties",async(req,res)=>{
    try {
        const currUser = req.user; // Assuming user object is available in request (e.g., from authentication middleware)
        // console.log(currUser);
        if (!currUser) {
            return res.status(403).send('User not authenticated');
        }

        const data = await Listing.find({ owner: currUser._id,AcceptStatus:0 });
        if(data.length){
            res.render("listings/Requestedindex.ejs", { allListings: data });
        }
        else{
            req.flash("error","You have no Requested listing");
           res.redirect("/listings")


        }
    } catch (error) {
        console.error("Error fetching user properties:", error);
        res.status(500).send("Internal Server Error");
    }
})
router.get("/approved-listings",async(req,res)=>{
    const currUser = req.user;
    const data = await Listing.find({ owner: currUser._id,AcceptStatus:1 });
        if(data.length){
            res.render("listings/Requestedindex.ejs", { allListings: data });
        }
        else{
            req.flash("error","No approved Properties");
           res.redirect("/listings")


        }
})

module.exports=router;