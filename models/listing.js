const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const User = require("./user.js");
const Review = require("./review");


const listingSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: [{
        type:String
    }],
    price: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review"
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    geometry: {
        type: {
          type: String, // Don't do `{ location: { type: String } }`
          enum: ['Point'], // 'location.type' must be 'Point'
          required: true
        },
    coordinates: {
          type: [Number],
          required: true
        }
      },
      category:{
        type:String,
        enum :[
            "1 BHK",
            "2 BHK",
            "3 BHK"
        ]
      },
      contact: {
        type: String,
        unique: [true, "Phone number is already in use."]
      },
  
});

// Mongoose middleware: If a listing is deleted, delete associated reviews
listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
