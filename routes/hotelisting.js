const express = require('express');
const router = express.Router();
const Hotel = require("../models/hotel.js");
const HotelBooking = require("../models/hotelbooking.js");

require('dotenv').config();
const multer = require("multer");
const { storage } = require("../cloudconfig");
const upload = multer({ storage: storage });

const axios = require("axios");

const wrapAsync = require('../utils/wrapAsync.js');
const ExpressError = require('../utils/ExpressError.js');
const { hotelSchema } = require("../schema.js");
const { isLoggedin } = require("../middleware.js");

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN; // your token from .env
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });


const validateListing = (req, res, next) => {
    let { error } = hotelSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(e => e.message).join(", ");
        throw new ExpressError(400, msg);
    }
    next();
};

// New Bus Form
router.get("/hotel/new", isLoggedin, wrapAsync((req, res) => {
    console.log("request came");
    res.render("listings/hotel/newhotel.ejs");
}));


// Create New hotel Listing
router.post("/newhotel", isLoggedin, upload.single("hotel[image]"),validateListing, wrapAsync(async (req, res) => {
    if (!req.body.hotel) {
        throw new ExpressError(400, "Invalid Hotel Data: Missing Hotel in request body");
    }

    const location = req.body.hotel.location;

    // Fetch coordinates and full address using Mapbox
    const geoResponse = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json`, {
        params: {
            access_token: process.env.MAPBOX_TOKEN,
            limit: 1
        }
    });

    const feature = geoResponse.data.features[0];

    if (!feature || !feature.geometry) {
        req.flash("error", "Invalid location. Please enter a valid location.");
        return res.redirect("/newhotel");
    }

    // Extracting full address (place_name)
    const fullAddress = feature.place_name;

    // Optionally extract individual components (city, state, etc.) from context
    const context = feature.context || [];
    const city = context.find(c => c.id.includes("place"))?.text;
    const state = context.find(c => c.id.includes("region"))?.text;
    const country = context.find(c => c.id.includes("country"))?.text;

    // Create hotel entry
    const newHotel = new Hotel({
        ...req.body.hotel,
        geometry: {
            type: "Point",
            coordinates: feature.geometry.coordinates
        },
        fullAddress,  // Add this to your Hotel schema!
        city,
        state,
        country
    });
    let url = req.file.path;
    let filename = req.file.filename;
    newHotel.image = {url,filename};

    await newHotel.save();
    req.flash("success", "New Hotel Listing Created");
    res.redirect("/home");
}));



//show particular hotel 

router.get("/showhotel/:id",wrapAsync(async(req,res)=>{
    const {id} = req.params;
    const hotel = await Hotel.findById(id);
     if(!hotel){
        req.flash("error","Listing you requesed for does not exist !" );
        // res.redirect("/hotel");
     }
    //  console.log(hotel);
    res.render("listings/hotel/showhotel.ejs",{hotel});
    }));


    // Index Route: Display all Hotels 

    router.get("/hotel", wrapAsync(async (req, res) => {
        let hotels = await Hotel.find({});
        res.render("listings/hotel/hotelindex.ejs", { hotels });
    }));

    //get edit request and render edit form

    router.get("/hotel/:id/edit",isLoggedin,wrapAsync(async(req,res)=>{
        const {id}= req.params;
        const hotel = await Hotel.findById(id);
        if(!hotel){
            req.flash("error","Bus you requesed for does not exist !" );
            res.redirect("/bus");
         }
        res.render("listings/hotel/edithotel.ejs",{hotel});
    }));

    router.put("/hotel/:id", isLoggedin, upload.single("hotel[image]"),wrapAsync(async (req, res) => {
        const { id } = req.params;
        if (!req.body.hotel) {
            throw new ExpressError(400, "Send Valid Data for Listing");
        }
    
        const geoData = await geocoder
            .forwardGeocode({
                query: req.body.hotel.location,
                limit: 1
            })
            .send();
    
        const updatedHotelData = req.body.hotel;
        updatedHotelData.geometry = geoData.body.features[0].geometry;
    
        const hotel = await Hotel.findByIdAndUpdate(id, updatedHotelData);

        if (req.file) {
            const url = req.file.path;
            const filename = req.file.filename;
            hotel.image = { url, filename };
            await hotel.save();
        }
    
    
        req.flash("success", "Hotel updated successfully!");
        res.redirect(`/showhotel/${hotel._id}`);
    }));
    

//delete hotel listing

router.delete("/hotel/:id",isLoggedin,wrapAsync(async(req,res)=>{
        const {id} = req.params;
        await HotelBooking.deleteMany({ hotelId: id });
        const del = await Hotel.findByIdAndDelete(id);
        req.flash("success","Hotel Deleted");
        res.redirect("/hotel");
    }));

//search hotels based on search

    router.post("/search-hotels",wrapAsync(async(req,res)=>{
        console.log("Received request body:", req.body);
        let hotels = await Hotel.find({
            location: req.body.location,
          });
        //   console.log(hotels);
    
          res.render("listings/hotel/hotelindex.ejs", { hotels });
    }));

    router.get("/hotel/:id/book", async (req, res) => {
        const hotel = await Hotel.findById(req.params.id);
        console.log(hotel);
        res.render("listings/hotel/bookForm", { hotel });
    });

    router.post("/hotel/:id/book", async (req, res) => {
        const hotel = await Hotel.findById(req.params.id);
        const { guestName,mobile, email, checkIn, checkOut } = req.body;
      
        const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
        const totalPrice = nights * hotel.pricePerNight;
      
        const bookingData = {
          hotel,
          guestName,
          email,
          mobile,
          checkIn,
          checkOut,
          totalPrice
        };
      
        res.render("listings/hotel/confirmBooking", { booking: bookingData });
      });
      
      

      router.post("/hotel/:id/confirm", async (req, res) => {
        const { guestName, email, mobile, checkIn, checkOut, totalPrice } = req.body;
        const userId = req.session.userId;
      
        // 1. Find the hotel
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
          req.flash("error", "Hotel not found");
          return res.redirect("/home");
        }
      
        // 2. Check if rooms are available
        if (hotel.roomsAvailable < 1) {
          req.flash("error", "Sorry, no rooms available for this hotel.");
          return res.redirect(`/hotel/${req.params.id}`);
        }
      
        // 3. Create the booking
        await HotelBooking.create({
          hotelId: req.params.id,
          userId,
          guestName,
          email,
          mobile,
          checkIn,
          checkOut,
          totalPrice
        });
      console.log(hotel.roomsAvailable);
        // 4. Deduct 1 room from available rooms
        hotel.roomsAvailable -= 1;
        await hotel.save();
      
        console.log(hotel.roomsAvailable);
        // 5. Redirect
        req.flash("success", "Hotel Booked Successfully!");
        res.redirect("/home");
      });
      

      router.get("/my-hotel-bookings", async (req, res) => {
        const userId = req.session.userId;
      
        const bookings = await HotelBooking.find({ userId })
          .populate("hotelId") // to get hotel details like name, location
          .sort({ createdAt: -1 }); // latest first
          console.log(bookings);
      
        res.render("listings/hotel/userHotelBookings.ejs", { bookings });
      });
      
      

module.exports = router;