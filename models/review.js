const mongoose=require("mongoose");
const Schema=mongoose.Schema;

const reviewSchema = new Schema({
    comment:String,
    rating:{
        type:Number,
        min:1,
        max:5
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    image: [{
        type:String
    }],
    author:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
});
const review=mongoose.model("Review",reviewSchema);
module.exports=review;