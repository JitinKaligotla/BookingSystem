const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true
  },
  seatsBooked: {
    type: Number,
    default: 1,
  },
  otp: { type: String }, // OTP for booking confirmation
  bookedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });



module.exports = mongoose.model("Booking", bookingSchema);
