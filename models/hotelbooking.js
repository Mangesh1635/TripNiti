const mongoose = require("mongoose");

const hotelBookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel"
  },
  guestName: String,
  email: String,
  mobile:Number,
  checkIn: Date,
  checkOut: Date,
  totalPrice: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("HotelBooking", hotelBookingSchema);
