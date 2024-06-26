const dotenv = require('dotenv');
dotenv.config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path=require("path");
const methodOverride = require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const cookieParser=require("cookie-parser"); 
//directly req se cookie ko parse ni kraskte so use COOKIE-PARSER middleware 
//we use this in autherization and authentication
//signed mai encode hok jata h  attach a code with that jisse signed hojta h 
//cookie help in storing some information in browser

const session=require("express-session");
const MongoStore = require("connect-mongo");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");
const multer=require("multer");
const upload=multer({dest:'uploads/'});
// const { uploadProcessedData } = require("./firebase.js");



const listingsRouter= require("./routes/listing.js");
const reviewsRouter= require("./routes/review.js");
const userRouter= require("./routes/user.js");
const Listing = require("./models/listing.js");



// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL
 


async function main() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to MongoDB");
        // getDatafromdatabase();

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // Exit the process if unable to connect to MongoDB
    }
}

main(); 


app.set("view engine","ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"public")));
app.use('/uploads', express.static('uploads'));

const {saveRedirectUrl,isLoggedIn}=require("./middleware.js")

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto :{
        secret: process.env.SECRET,
    } ,// Specify the session signing secret directly here
    touchAfter: 24 * 3600 // Optional: Adjust the session touch interval if needed
});


store.on("error" , (err)=>{
    console.log("error in mongo session store",err);
})
const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // Sets the expiration time for the cookie to one week from now.
        maxAge: 7 * 24 * 60 * 60 * 1000, // Sets the maximum age of the cookie to one week.
        httpOnly:true
    }
};


app.use(session(sessionOptions));
app.use(flash()); //success failure session related

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));  //use static authenticate method of model in localStrategy and authenticate()--> generates a function that is used in passport's LocalStrategy

passport.serializeUser(User.serializeUser()); //generates function that is used by passport to serialize(store) users into session(login)
passport.deserializeUser(User.deserializeUser()); //generates function that is used by passport to deserialize(unstore/remove) users into session(logout)



app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
})



// Mount the routers with their respective paths
app.use('/listings', listingsRouter);
app.use('/listings/:id/reviews', reviewsRouter);
app.use('/user', userRouter);

//reviews
//post-route

app.get("/",async(req,res)=>{
    try {
        // console.log(req.user);
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
})



app.use((err, req, res, next) => {
    let { statusCode =500,message ="something went wrong" } = err;
    res.status(statusCode).send(message);
});

app.all("*", (req, res,next) => {
    // res.status(404).send("Page Not Found");
    res.render("listings/error.ejs")
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
