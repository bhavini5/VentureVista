require("dotenv").config();
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



const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
async function main() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to MongoDB");
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
const sessionOptions= {
    secret: "B!@E#TSP*H",
    resave: false,
    saveUnintialized: true,
    cookie:{
        expires:Date.now()+7 * 24 * 60 * 60 * 1000,
        maxAge:7 * 24 * 60 * 60 * 1000,
        httpOnly:true //security purpose, cross Scripting attacks se bachne k lie
    }
}
app.use(session(sessionOptions));
app.use(flash()); //success failure session related

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));  //use static authenticate method of model in localStrategy and authenticate()--> generates a function that is used in passport's LocalStrategy

passport.serializeUser(User.serializeUser()); //generates function that is used by passport to serialize(store) users into session(login)
passport.deserializeUser(User.deserializeUser()); //generates function that is used by passport to deserialize(unstore/remove) users into session(logout)


// app.use(cookieParser("2#B!APS5t#W"));

// app.get("/getsignedcookies",(req,res)=>{
//     res.cookie("greet","namaste",{signed:true});
    
//     res.send("send you some signedcookies!")

// })//puri value change={} if value changes=false printed
// app.get("/verify",(req,res)=>{
//     console.log(req.signedCookies);
//     res.send("verified");
// })
// app.get("/getcookies",(req,res)=>{
//     res.cookie("greet","namaste");
//     res.cookie("madeIn","India");
//     res.send("send you some cookies!")

// })


// app.get("/", (req, res) => {
//     console.dir(req.cookies);
//     res.send("hi i am root");
// });


app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
})
app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews",reviewsRouter)
app.use("/",userRouter)

//reviews
//post-route



app.use((err, req, res, next) => {
    let { statusCode =500,message ="something went wrong" } = err;
    res.status(statusCode).send(message);
});

app.all("*", (req, res,next) => {
    // res.status(404).send("Page Not Found");
    res.render("listings/error.ejs")
});

const PORT = 8081;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});