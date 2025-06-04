const Joi = require("joi");

const bookingSchema = Joi.object({
  seatsBooked: Joi.number().integer().min(1).max(6).required().messages({
    "number.base": "Seats booked must be a number.",
    "number.min": "At least 1 seat must be booked.",
    "number.max": "You can book at most 6 seats.",
    "any.required": "Seats booked is required.",
  }),
});

module.exports = { bookingSchema };
