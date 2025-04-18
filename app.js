require("dotenv").config();
const express = require("express");
const app = express();
const port = 8000;
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const { isLoggedin } = require("./middleware.js");
const { title } = require("process");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const MongoStore = require('connect-mongo');

require('dotenv').config();
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET);

const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");

const Bus = require("./models/bus.js");
const Hotel = require("./models/hotel.js");
const Package = require("./models/package.js");
const Booking = require("./models/booking.js");

const MONGO_URL=process.env.ATLASDB_URL;

const sessionStore = MongoStore.create({
  mongoUrl: MONGO_URL,
  crypto: {
      secret: 'mySuperSecreateKey'
  },
  touchAfter: 24 * 3600 // update session only once in 24 hrs if unchanged
});

async function main() {
  try {
      await mongoose.connect(process.env.ATLASDB_URL, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000, // Timeout in 5 seconds
      });
      console.log("✅ MongoDB Atlas Connected Successfully!");
  
  } catch (err) {
      console.error("❌ MongoDB Connection Error:", err.message);
      process.exit(1); // Exit app if DB connection fails
  }
}
main();

const sessionOptions = {
  store: sessionStore,
  secret: "mySuperSecreateKey",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 24 * 60 * 60 * 1000,
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly : true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  },
};
app.set("trust proxy", 1);
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

const userRouter = require("./routes/user.js");
const busListingRouter = require("./routes/buslisting.js");
const hotelListingRouter = require("./routes/hotelisting.js");

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.json());

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// mongoose
//   .connect("mongodb://127.0.0.1:27017/tripniti")
//   .then(() => console.log("Connected successfully"))
//   .catch((err) => console.log(err));



app.use("/", userRouter);
app.use("/", busListingRouter);
app.use("/", hotelListingRouter);

app.get("/", async (req, res) => {
  let buses = await Bus.find({});
  res.redirect("/home");
});

app.get("/home", async (req, res) => {
  const packages = await Package.find({});
  let buses = await Bus.find({});
  let hotels = await Hotel.find({});
  res.render("home2.ejs", { buses, hotels, packages });
});

app.get("/tinput", async (req, res) => {
  res.render("services/train/tinput.ejs");
});

app.get("/binput", async (req, res) => {
  res.render("services/bus/input.ejs");
});

app.get("/hinput", async (req, res) => {
  res.render("services/hotel/input.ejs");
});

app.post("/search-trains", async (req, res) => {
  const { fromStation, toStation, dateOfJourney } = req.body;

  const apiUrl = `https://trainticketapi.railyatri.in/api/trains-between-station-with-sa.json?from=${fromStation}&to=${toStation}&dateOfJourney=${dateOfJourney}&journey_quota=GN`;

  try {
    const response = await axios.get(apiUrl);
    const trains = response.data.train_between_stations;
    console.log(response.data);

    res.render("services/train/trains.ejs", {
      trains,
      fromStation,
      toStation,
      dateOfJourney,
    });
  } catch (error) {
    console.error("Error fetching train data:", error);
    res.render("error", {
      message: "Failed to ftrainsetch train data. Please try again.",
    });
  }
});

app.get("/packages/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const package = await Package.findById(id)
      .populate("transportOptions")
      .populate("hotelRecommendations");
    console.log(package);

    if (!package) {
      req.flash("error", "Package you requested does not exist!");
      return res.redirect("/packages"); // Optional: redirect to a list page
    }

    // console.log(package);
    res.render("showpackage.ejs", { package });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong!");
    res.redirect("/packages");
  }
});

app.get("/my-bookings", wrapAsync(async (req, res) => {
  const userId = req.user._id; // or req.user._id depending on auth
// console.log(userId);
  const bookings = await Booking.find({ userId })
      .populate("busId"); // to get bus details like name, source, destination
// console.log(bookings[0].passengers[1].name);



  res.render("myBookings.ejs", { bookings });
}));


app.all("*", (req, res, next) => {
  next(new ExpressError(401, "Page Not Found !!!!"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "something went wrong" } = err;
  res.render("error.ejs", { statusCode, message });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
