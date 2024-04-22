const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const {isLoggedIn,isOwner,validateListing}=require("../middleware.js");
const { authorize } = require("passport");
const upload = require('../multer.js')

const mbxgeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxgeocoding({ accessToken: mapToken });


// const {storage} = require("../CloudConfig.js")


// const upload = multer({storage});
// const fetch = require('node-fetch');

// Index route
router.get("/", async (req, res) => {
    const allListings = await Listing.find({})
    // console.log(allListings)
    res.render("listings/index.ejs", { allListings });
});

// New route
router.get("/new", isLoggedIn, (req, res) => {
   
    res.render("listings/new.ejs");
});


router.post("/upload",
    isLoggedIn,
    // validateListing,
    upload.array("listing[image]",5), // Handle multiple file uploads
    wrapAsync(async (req, res, next) => {
       
        // console.log(req.file);
        let response = await geocodingClient.forwardGeocode({
            query: req.body.listing.location,
            limit: 1,   //number if coordinates that will return 
          })
        .send();
    try {
        console.log(req.file);
        // After the files are uploaded, req.files contains the uploaded file details
        let uploadedFiles = req.files;
        let filenames = uploadedFiles.map(file => file.filename);
        // console.log(req.file);
        // console.log(url, filename);

        const newListing = new Listing(req.body.listing);
        newListing.owner=req.user._id;
        newListing.image=filenames;
        newListing.geometry=response.body.features[0].geometry;
        let savedListing = await newListing.save();
        console.log(savedListing);
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
        upload.single("listing[image]"),
        validateListing,
        wrapAsync( async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

   if( typeof  req.file !== "undefined"){
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image=filename;
    await listing.save();
   }
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

router.get("/search/:key", async (req, res) => {
    try {
        const { key } = req.params;

        // Use regular expressions with the 'i' flag for case sensitivity
        const data = await Listing.find({
            "$or": [
                { location: { $regex: key, $options: 'i' } }, // Case-sensitive search
                { address: { $regex: key, $options: 'i' } }
            ]
        });

        console.log(data);
        res.render("listings/index.ejs", { allListings: data });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
router.get("/sort/:sortBy", async (req, res) => {
    try {
        const { sortBy } = req.params;
        // console.log(sortBy); 
        let sortCriteria;
        if (sortBy === 'inc-price') {
            sortCriteria = { price: 1 }; // Sort by price in ascending order
        } else if (sortBy === 'dec-price') {
            sortCriteria = { price: -1 }; // Sort by price in descending order
        } else {
            // Handle invalid sortBy parameter
            return res.status(400).send('Invalid sort criteria');
        }

        const data = await Listing.find().sort(sortCriteria);
        console.log(data);
        res.render("listings/index.ejs", { allListings: data });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});



module.exports = router;
