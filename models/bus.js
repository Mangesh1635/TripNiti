const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  // operator: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "User", // References the Bus Operator
  //   // required: true,
  // },
  source: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  image: {
    url: String,
    filename: String,
},
  departureDate:{
    type:String,
    required: true,
  },
  departureTime:{
    type: String, // Example: "10:30 AM"
    required: true,
  },
  arrivalTime: {
    type: String, // Example: "5:30 PM"
    required: true,
  },
  totalSeats: {
    type: Number,
    required: true,
  },
  pricePerSeat: {
    type: Number,
    required: true,
  },
  availableSeats: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Bus", busSchema);
