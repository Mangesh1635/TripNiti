const Joi = require("joi");

// User Schema Validation
module.exports.userSchema = Joi.object({
  user: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    phone: Joi.string().required(),
    role: Joi.string().valid("Traveler", "HotelManager", "BusOperator").required(),
  }).required(),
});

// Hotel Schema Validation
module.exports.hotelSchema = Joi.object({
  hotel: Joi.object({
    name: Joi.string().required(),
    location: Joi.string().required(),
    roomsAvailable: Joi.number().integer().min(1).required(),
    pricePerNight: Joi.number().min(0).required(),
    amenities: Joi.string().optional(),
    image : Joi.string().allow("",null),
    manager: Joi.string().optional(), // MongoDB ObjectId (Hotel Manager ID)
  }).required(),
});

// Bus Schema Validation
module.exports.busSchema = Joi.object({
  bus: Joi.object({
    name: Joi.string().required(),
    operator: Joi.string().optional(), // Optional to avoid errors
    source: Joi.string().required(),
    destination: Joi.string().required(),
    departureDate: Joi.string().optional(),
    departureTime: Joi.string().optional(), // ✅ Made optional
    arrivalTime: Joi.string().optional(),  // ✅ Made optional
    totalSeats: Joi.number().integer().min(1).optional(), // ✅ Made optional
    pricePerSeat: Joi.number().min(0).required(),
    availableSeats: Joi.number().integer().min(0).optional(), // ✅ Made optional
    image : Joi.string().allow("",null),
  }).required(),
});