const mongoose = require("mongoose");

const passengerSchema = new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,
});

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming user login exists
    required: true,
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true,
  },
  passengers: [passengerSchema],
  totalPrice: {
    type: Number,
    required: true,
  },
  bookingDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["Confirmed", "Pending", "Cancelled"],
    default: "Confirmed"
  }
});

module.exports = mongoose.model("Booking", bookingSchema);
