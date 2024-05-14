const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn,isOwner,validateListing}=require("../middleware.js");
const { authorize } = require("passport");
const upload = require('../multer.js')

const mbxgeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxgeocoding({ accessToken: mapToken });

const User= require("../models/user.js");


// Index route
router.get("/", async (req, res) => {
    try {
        console.log(req.user);
      const allListings = await Listing.find({AcceptStatus: 0});
      const count1 = await Listing.countDocuments({ category: 'Sell',AcceptStatus:1 });
      const count2 = await Listing.countDocuments({ category: 'Rental',AcceptStatus:1  });
      res.render("listings/index.ejs", {
        allListings,
        count1,
        count2,
        user: req.user || { username: 'Guest' } // Provide a default user object if req.user is undefined
    });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
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
        let uploadedFiles = req.files;
        let filenames = uploadedFiles.map(file => file.filename);
        // console.log(req.file);
        // console.log(url, filename);

        const newListing = new Listing(req.body.listing);
        console.log(newListing.category);
        newListing.owner=req.user._id;
        newListing.image=filenames;
        newListing.geometry=response.body.features[0].geometry;
        let savedListing = await newListing.save();
        // console.log(savedListing);
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
        path: "RequestedBy.userId", // Populate the requestedBy field
        model: "User" // Reference the User model
    })
    
    .populate("reviews")
    .populate("owner");
    console.log(listing);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings"); // Add return statement here
    }
    
    res.render("listings/show.ejs", { listing });
});

router.get("/:id/requested",isLoggedIn, async (req, res) => {
    
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({
        path: "RequestedBy.userId", // Populate the requestedBy field
        model: "User" // Reference the User model
    })
    
    .populate("reviews")
    .populate("owner");
    console.log(listing);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings"); // Add return statement here
    }
    
    res.render("listings/RequestedListing.ejs", { listing });
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
        const count1 = await Listing.countDocuments({ category: 'Sell',AcceptStatus:1 });
      const count2 = await Listing.countDocuments({ category: 'Rental',AcceptStatus:1  });
        const { key } = req.params;

        // Use regular expressions with the 'i' flag for case sensitivity
        const data = await Listing.find({AcceptStatus: 0,
            "$or": [
                { location: { $regex: key, $options: 'i' } }, // Case-sensitive search
                { address: { $regex: key, $options: 'i' } },
                { type: { $regex: key, $options: 'i' } },
                { category: { $regex: key, $options: 'i' } }
            ]
        });

        console.log(data);
        if(data.length){
            res.render("listings/index.ejs", { allListings: data,count1,count2,user: req.user || { username: 'Guest' } });
        }
        else{
            req.flash("error"," No Property found for your search");
           res.redirect("/listings")


        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get("/sort/:sortBy", async (req, res) => {
    try {
        const count1 = await Listing.countDocuments({ category: 'Sell',AcceptStatus:1 });
      const count2 = await Listing.countDocuments({ category: 'Rental',AcceptStatus:1  });
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

        const data = await Listing.find({AcceptStatus: 0}).sort(sortCriteria);
        console.log(data);
        res.render("listings/index.ejs", { allListings: data,count1,count2 ,user: req.user || { username: 'Guest' }});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/filter/Rental', async (req, res) => {
    const count1 = await Listing.countDocuments({ category: 'Sell',AcceptStatus:1 });
      const count2 = await Listing.countDocuments({ category: 'Rental',AcceptStatus:1  });
    let data = await Listing.find({category : "Rental",AcceptStatus: 0 });
    if(data.length){
        res.render("listings/index.ejs", { allListings: data,count1,count2,user: req.user || { username: 'Guest' } });
    }
    else{
        req.flash("error"," No Property found for your search");
       res.redirect("/listings")
    }

})
router.get('/filter/Sell', async (req, res) => {
        const count1 = await Listing.countDocuments({ category: 'Sell',AcceptStatus:1 });
        const count2 = await Listing.countDocuments({ category: 'Rental',AcceptStatus:1  });
    let data = await Listing.find({category : "Sell",AcceptStatus: 0 });
    console.log(data);
    if(data.length){
        res.render("listings/index.ejs", { allListings: data,count1,count2,user: req.user || { username: 'Guest' } });
    }
    else{
        req.flash("error"," No Property found for your search");
       res.redirect("/listings")
    }

})


router.post('/house', async (req, res) => {
    const count1 = await Listing.countDocuments({ category: 'Sell',AcceptStatus:1 });
      const count2 = await Listing.countDocuments({ category: 'Rental',AcceptStatus:1  });
    let data = await Listing.find({type : "House",AcceptStatus: 0 });
    if(data.length){
        res.render("listings/index.ejs", { allListings: data ,count1,count2,user: req.user || { username: 'Guest' } });
    }
    else{
        req.flash("error"," No Property found for your search");
       res.redirect("/listings")
    }
});

router.post('/villa', async(req, res) => {
    const count1 = await Listing.countDocuments({ category: 'Sell',AcceptStatus:1 });
      const count2 = await Listing.countDocuments({ category: 'Rental',AcceptStatus:1  });
    let data = await Listing.find({type : "Villa" ,AcceptStatus: 0});
    if(data.length){
        res.render("listings/index.ejs", { allListings: data,count1,count2,user: req.user || { username: 'Guest' } });
    }
    else{
        req.flash("error"," No Property found for your search");
       res.redirect("/listings")
    }
  });

router.post('/flat', async(req, res) => {
    const count1 = await Listing.countDocuments({ category: 'Sell',AcceptStatus:1 });
      const count2 = await Listing.countDocuments({ category: 'Rental',AcceptStatus:1  });
    let data = await Listing.find({type : "Flat",AcceptStatus: 0 });
    if(data.length){
        res.render("listings/index.ejs", { allListings: data,count1,count2,user: req.user || { username: 'Guest' } });
    }
    else{
        req.flash("error"," No Property found for your search");
       res.redirect("/listings")
    }
});

router.post('/shop', async(req, res) => {
    let data = await Listing.find({type : "Shop",AcceptStatus: 0 });
    const count1 = await Listing.countDocuments({ category: 'Sell',AcceptStatus:1 });
      const count2 = await Listing.countDocuments({ category: 'Rental',AcceptStatus:1  });
    if(data.length){
        res.render("listings/index.ejs", { allListings: data,count1,count2,user: req.user || { username: 'Guest' } });
    }
    else{
        req.flash("error"," No Property found for your search");
       res.redirect("/listings")
    }   
});
router.post('/:id/purchaseReq', isLoggedIn,async (req, res) => {
    const { id } = req.params; // Listing ID
    const {  phoneNumber } = req.body; 
    const currUser = req.user; 

    // console.log(currUser);
    try {
        const listing = await Listing.findById({id}).populate('RequestedBy.userId')

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        if ( !listing.owner._id.equals(currUser._id)) {

                listing.status = 1 ;

            listing.RequestedBy.push({
                userId: currUser._id,
                phoneNumber: phoneNumber,
                status: 1
            });

            await listing.save();
            console.log(listing);
        res.redirect("/listings");
    } }catch (error) {
        console.error('Error purchasing listing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// router.post('/:id/purchaseReq', async (req, res) => {
//     const { id } = req.params;

//     try {
//         const listingId = id ;
//         const currUser = req.user; 

//         const listing = await Listing.findById(listingId);

//         if (listing.category === 'Sell' && !listing.owner._id.equals(currUser._id)) {
//             if(listing.status > 0 ){
//                 listing.status = listing.status + 1 ;
//             listing.RequestedBy = currUser;
            
//             }
//             else{
//                 listing.status = 1 ;
//                 listing.RequestedBy = currUser;
//             }

//             await listing.save(); 

//             res.status(200).json({ message: 'Purchase successful', listing: listing });
//         } else {
//             res.status(403).json({ error: 'Unable to purchase this listing' });
//         }
//     } catch (error) {
//         console.error('Error processing purchase request:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });


router.post("/:id/:Currid/accepted",isLoggedIn,async(req,res)=>{
    const { id, Currid } = req.params;

    try {
        const listingId = id;
        const currUser = req.user;
    
        // Retrieve the listing by ID
        const listing = await Listing.findById(listingId);
    
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }
    
        // Update AcceptStatus to indicate the request is accepted
        listing.AcceptStatus = 1;
    
        // Find the corresponding RequestedBy entry for the current user
        const requestedByEntry = listing.RequestedBy.find(entry => entry.userId.equals(currUser._id));
    
        if (requestedByEntry) {
            // Update the status for the current user's request
            requestedByEntry.status = 1;
        } else {
            // If the user's request entry doesn't exist, create a new one
            listing.RequestedBy.push({ userId: currUser._id, status: 1 });
        }
        currUser.status = currUser.status + 1;
        await currUser.save();
    

        // Save the updated listing
        await listing.save();
    
        // Redirect or respond with success message
        res.redirect("/my_properties");
    } catch (error) {
        console.error('Error processing purchase request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

})
router.post("/:id/:Currid/rejected", isLoggedIn, async (req, res) => {
    const { id, Currid } = req.params;

    try {
        const listingId = id;
        const currUser = req.user;

        // Find the listing by ID
        const listing = await Listing.findById(listingId);

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Set listing status to 0 (or update as needed)
        listing.status = 0;

        // Filter out the requestedBy entry associated with the current user
        listing.RequestedBy = listing.RequestedBy.filter(entry => !entry.userId.equals(currUser._id));

        // Save the updated listing
        await listing.save();

        // Redirect or respond with success message
        res.redirect("/my_properties");
    } catch (error) {
        console.error('Error processing purchase request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
