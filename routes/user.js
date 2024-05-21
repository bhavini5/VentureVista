const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { userSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const User= require("../models/user.js");
const passport = require("passport");
const {saveRedirectUrl,isLoggedIn}=require("../middleware.js")
const Listing = require("../models/listing.js");

router.get("/signup",(req,res)=>{
    res.render("user/signup.ejs");
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


    router.get("/my_properties",isLoggedIn, async (req, res) => {
        try {
            const count1 = await Listing.countDocuments({ category: 'Sell',AcceptStatus:1 });
      const count2 = await Listing.countDocuments({ category: 'Rental',AcceptStatus:1  });
            const currUser = req.user; // Assuming user object is available in request (e.g., from authentication middleware)
            // console.log(currUser);
            if (!currUser) {
                return res.status(403).send('User not authenticated');
            }
    
            const data = await Listing.find({ owner: currUser._id });
            if(data.length){
                res.render("listings/index.ejs", {
                     allListings: data
                     ,count1,
                     count2,
                     user: req.user || { username: 'Guest' }
                     });
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

router.get("/requested/properties",isLoggedIn,async(req,res)=>{
    try {
        const count1 = await Listing.countDocuments({ category: 'Sell',AcceptStatus:1 });
      const count2 = await Listing.countDocuments({ category: 'Rental',AcceptStatus:1  });
        const currUser = req.user; // Assuming user object is available in request (e.g., from authentication middleware)
        // console.log(currUser);
        if (!currUser) {
            return res.status(403).send('User not authenticated');
        }

        const data = await Listing.find({ owner: currUser._id, status:1,AcceptStatus:0 });
        if(data.length){
            res.render("listings/Requestedindex.ejs", { allListings: data ,count1,count2});
        }
        else{
            req.flash("error","You have no Requested Property");
           res.redirect("/listings")


        }
    } catch (error) {
        console.error("Error fetching user properties:", error);
        res.status(500).send("Internal Server Error");
    }
})
// router.get("/history", async (req, res) => {
//     const data = await Listing.findAll({});

//     const currUserId = req.user._id; // Get current user's ID from req.user

//     try {
//         // Find listings where requestedBy.userId matches the current user's ID
//         const data = await Listing.find({ "RequestedBy.userId": currUserId });
//         // console.log(dat)
//         if (data.length > 0) {
//             res.render("listings/Requestedindex.ejs", { allListings: data });
//         } else {
//             req.flash("error", "No Listings Found In Your Account");
//             return res.redirect("/listings");
//         }
//     } catch (error) {
//         console.error('Error fetching user history:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });


module.exports=router;