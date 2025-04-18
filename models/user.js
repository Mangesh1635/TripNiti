const { required } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username:{
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Traveler", "HotelManager", "BusOperator"],
      required: true,
    },
    hotels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel",
      },
    ], // Only for Hotel Managers
    buses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bus",
      },
    ], // Only for Bus Operators
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });
userSchema.plugin(passportLocalMongoose);


module.exports = mongoose.model("User", userSchema);