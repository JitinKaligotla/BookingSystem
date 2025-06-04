const Joi = require("joi");

const postSchema = Joi.object({
  driverPhone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base": "Enter a valid 10-digit phone number.",
    }),
  vehicleNumber: Joi.string().required(),
  vehicleType: Joi.string().required(),
  departureTime: Joi.date().greater("now").required(),
  destination: Joi.string().required(),
  availableSeats: Joi.number().integer().min(1).max(6).required(),
  fare: Joi.number().positive().required(),
});

module.exports = { postSchema };
