const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const {isLoggedIn,isOwner,validateListing}=require("../middleware.js");
const { authorize } = require("passport");

// const {storage} = require("../CloudConfig.js")
const multer = require('multer');
// const upload = multer({storage});
// const fetch = require('node-fetch');

// Index route
router.get("/", async (req, res) => {
    const allListings = await Listing.find({})
    res.render("listings/index.ejs", { allListings });
});

// New route
router.get("/new", isLoggedIn, (req, res) => {
   
    res.render("listings/new.ejs");
});


router.post("/",
            isLoggedIn, 
            validateListing,
            // upload.single("listing[image]") , 
            wrapAsync(async (req, res, next) => {
    try {
        
        let url=req.file.path;
        let filename=req.file.filename;
        console.log(url , " " , filename);
        // const newListing = new Listing(req.body.listing);
        // newListing.owner=req.user._id;
        // newListing.image={url,filename};
        // await newListing.save();
        req.flash("success","New Listing Created");
        res.redirect("/listings");
    } catch (err) {
        next(err); // Pass the error to Express's error handling middleware
    }
}));

// Show Route
router.get("/:id",isLoggedIn, async (req, res) => {
    
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({
        path:"reviews",
        populate:{
            path:"author",   //here we are doing nested populate
            },
        }).populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings"); // Add return statement here
    }
    
    res.render("listings/show.ejs", { listing });
});

// Edit route
router.get("/:id/edit",isOwner, async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
});

// Update route
router.put("/:id",
        isLoggedIn,
        isOwner,
        validateListing,
        wrapAsync( async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    req.flash("success","Listing Updated");
    res.redirect(`/listings/${id}`);
}));

// Delete route
router.delete("/:id/delete",isLoggedIn,isOwner, async (req, res) => {
    let { id } = req.params;
    req.flash("success"," Listing Deleted");
    await Listing.findByIdAndDelete(id);

    res.redirect("/listings");
});

module.exports = router;
