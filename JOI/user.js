// JOI/user.js
const Joi = require("joi");

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email.",
    "any.required": "Email is required.",
  }),
  username: Joi.string().min(3).max(20).required().messages({
    "string.min": "Username should be at least 3 characters.",
    "any.required": "Username is required.",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password should be at least 6 characters.",
    "any.required": "Password is required.",
  }),
  role: Joi.string().valid("user", "driver").required().messages({
    "any.only": "Role must be either 'user' or 'driver'.",
    "any.required": "Role is required.",
  }),
});

module.exports = { registerSchema };
