const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  roomsAvailable: {
    type: Number,
    required: true,
  },
  pricePerNight: {
    type: Number,
    required: true,
  },
  image:{
    url: String,
    filename: String,
},
  amenities: String, // Example: "WiFi,Pool,Gym"
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // References the Hotel Manager
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // ✅ GeoJSON format for storing coordinates (Mapbox & MongoDB compatible)
  geometry: {
    type: {
      type: String,
      enum: ['Point'], // 'geometry.type' must be "Point"
      required: true
    },
    coordinates: {
      type: [Number],  // [longitude, latitude]
      required: true
    }
  }
});

module.exports = mongoose.model("Hotel", hotelSchema);
