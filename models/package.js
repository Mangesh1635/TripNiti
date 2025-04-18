const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: String,
  highlights: [String], // E.g. "Beaches", "Temples", etc.
  images: [String],     // Array of attraction images
  averageCost: Number,  // Approx cost per person

  // 🚍 Transportation options
  transportOptions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus"
    }
  ],

  // 🏨 Recommended hotels
  hotelRecommendations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel"
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Package", packageSchema);
