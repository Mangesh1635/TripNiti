const express = require('express');
const router = express.Router();
const Bus = require("../models/bus.js");
const Booking = require("../models/booking.js");

require('dotenv').config();
const multer = require("multer");
const { storage } = require("../cloudconfig");
const upload = multer({ storage: storage });

const wrapAsync = require('../utils/wrapAsync.js');
const ExpressError = require('../utils/ExpressError.js');
const { busSchema } = require("../schema.js");
const { isLoggedin } = require("../middleware.js");



const validateListing = (req, res, next) => {
    let { error } = busSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(e => e.message).join(", ");
        throw new ExpressError(400, msg);
    }
    next();
};









// Index Route: Display all buses to creater
router.get("/bus", wrapAsync(async (req, res) => {
    let buses = await Bus.find({});
    res.render("listings/bus/busindex.ejs", { buses });
}));


//Show buses based on search

router.post("/search-buses",wrapAsync(async(req,res)=>{
    console.log("Received request body:", req.body);
    let buses = await Bus.find({
        source: req.body.source,
        destination:req.body.destination,
        departureDate:req.body.date
      });
      console.log(buses);

      res.render("listings/bus/busindex.ejs", { buses });
}));










// New Bus Form
router.get("/bus/new", isLoggedin, wrapAsync((req, res) => {
    res.render("listings/bus/newbus.ejs");
}));


// Create New Bus Listing
router.post("/newbus", isLoggedin,upload.single("bus[image]"),validateListing, wrapAsync(async (req, res, next) => {
    console.log("Received request body:", req.body); // Log request body
    // res.send(req.body);
    if (!req.body.bus) {
        throw new ExpressError(400, "Invalid Bus Data: Missing `bus` in request body");
    }
    
    const newBus = new Bus(req.body.bus);
    console.log("New Bus Created:", newBus);
    let url = req.file.path;
    let filename = req.file.filename;
    newBus.image = {url,filename};
    await newBus.save();
    req.flash("success", "New Bus Listing Created");
    res.redirect("/bus");
}));














router.get("/showbus/:id",wrapAsync(async(req,res)=>{
    const {id} = req.params;
    const bus = await Bus.findById(id);
     if(!bus){
        req.flash("error","Listing you requesed for does not exist !" );
        res.redirect("/bus");
     }
     console.log(bus);
    res.render("listings/bus/showbus.ejs",{bus});
    }));

 router.get("/bus/:id/edit",isLoggedin,wrapAsync(async(req,res)=>{
        const {id}= req.params;
        const bus = await Bus.findById(id);
        if(!bus){
            req.flash("error","Bus you requesed for does not exist !" );
            res.redirect("/bus");
         }
        res.render("listings/bus/editbus.ejs",{bus});
    }));

router.put("/bus/:id",isLoggedin,upload.single("bus[image]"),wrapAsync(async(req,res)=>{
    if(!req.body.bus){
        throw new ExpressError(400,"Send Valid Data for Listing")
    }
    const {id} = req.params;
    const updatedbus = req.body.bus;
    let bus = await Bus.findByIdAndUpdate(id,updatedbus);
    
    if (req.file) {
        const url = req.file.path;
        const filename = req.file.filename;
        bus.image = { url, filename };
        await bus.save();
    }

    req.flash("success","Listing Updated");
    res.redirect(`/showbus/${id}`);
}));

router.delete("/bus/:id",isLoggedin,wrapAsync(async(req,res)=>{
        const {id} = req.params;
        await Booking.deleteMany({ busId: id });
        const del = await Bus.findByIdAndDelete(id);
        req.flash("success","Bus Deleted");
        res.redirect("/bus");
    }));


    router.get("/bus/:id/book", wrapAsync(async (req, res) => {
        const { id } = req.params;
        const bus = await Bus.findById(id);
    
        if (!bus) {
            return res.status(404).send("Bus not found");
        }
    
        if (bus.availableSeats <= 0) {
            return res.status(400).send("No seats available");
        }
    
        // Instead of directly booking, render passenger form
        res.render("bookPassengerForm", { bus }); // Create EJS or React page for passenger form
    }));
    
    router.post("/bus/:id/confirm", wrapAsync(async (req, res) => {
        const { id } = req.params;
        const passengers = req.body.passengers; // Array of passengers [{name, age, gender}, ...]
        const bus = await Bus.findById(id);
        if (!bus) return res.status(404).send("Bus not found");
      
        if (bus.availableSeats < passengers.length) {
          return res.status(400).send("Not enough seats available");
        }
      
      
        const totalPrice = passengers.length * bus.pricePerSeat;
        const booking = new Booking({
          busId: bus._id,
          passengers: passengers,
          totalPrice,
          userId: req.user?._id, // Replace with actual user or mock ID
        });
      
        await booking.save();

      console.log(booking.passengers.length)
      console.log(booking.passengers[0])
        res.render("confirmdetails.ejs",{booking});
      }));

      router.post("/bus/:id/pay", wrapAsync(async (req, res) => {
        const { id } = req.params;
        const booking = await Booking.findById(id);
        // console.log(booking);
    
        const passengers = booking.passengers
        const userId = booking.userId
    // console.log(passengers);
    // console.log(userId)
        const bus = await Bus.findById(booking.busId);
        // console.log(bus);
        if (!bus) return res.status(404).send("Bus not found");
    
        if (bus.availableSeats < passengers.length) {
            return res.status(400).send("Seats sold out while booking");
        }
    
        // Reduce seats
        console.log(passengers.length);
        bus.availableSeats -= passengers.length;
        await bus.save();
    
        res.render("successBooking.ejs", {
            bus,
            passengers,
            total: passengers.length * bus.pricePerSeat
        });
    }));
    
module.exports = router;
