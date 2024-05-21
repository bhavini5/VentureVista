const Listing = require("./models/listing");
const Review = require("./models/review.js");
const { listingSchema,reviewSchema } = require("./schema.js"); // Corrected import name
const ExpressError = require("./utils/ExpressError.js");

module.exports.isLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated()){
        //redirect url save here
        req.session.redirectUrl=req.originalUrl; //req k andr kafi kuchh store hota h properties 
        req.flash("error","you must be logged in to create listing!");
        return res.redirect("/users/login");
    }
    next();
}

module.exports.saveRedirectUrl=(req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
    }
    next();
}

module.exports.isOwner = async(req,res,next)=>{
    let {id}=req.params;
    let listing=await Listing.findById(id);
    if(!listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","you are not the owner of this listing");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

// Middleware to validate listing data
module.exports.validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const errMsg = error.details.map(el => el.message).join(", ");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}


// Middleware to validate review data
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const errMsg = error.details.map(el => el.message).join(", ");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

module.exports.isReviewAuthor = async(req,res,next)=>{
    let {id,reviewId}=req.params;
    let review=await Review.findById(reviewId);
    if(!review.author._id.equals(res.locals.currUser._id)){
        req.flash("error","you are not the author of this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
}
