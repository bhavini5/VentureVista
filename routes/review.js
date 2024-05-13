const express = require("express");
const router = express.Router({mergeParams:true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const {validateReview, isLoggedIn,isReviewAuthor}=require("../middleware.js")
const upload = require('../multer.js')


// Route to create a new review
router.post(
    "/",
    isLoggedIn,
    // validateReview, 
    upload.array("review[image]",5),
    wrapAsync(async (req, res) => {
        const filenames = []; 

        if (req.files) {
            req.files.forEach(file => {
                console.log('Uploaded File:', file.filename);
                filenames.push(file.filename); 
            });
        }
        
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.image=filenames;
    newReview.author=req.user._id;
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();
    req.flash("success","New Review Added");
    res.redirect(`/listings/${listing._id}`);
}));

// Route to delete a review
router.delete("/:reviewId",
            isLoggedIn,
            isReviewAuthor,
             wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    // if (!listing) {
    //     throw new ExpressError(404, "Listing not found");
    // }

    await Review.findByIdAndDelete(reviewId);
    req.flash("success","Review Deleted");
    // console.log("Review deleted");
    res.redirect(`/listings/${id}`);
}));

module.exports=router;

