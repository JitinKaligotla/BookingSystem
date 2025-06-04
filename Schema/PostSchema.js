const mongoose = require("mongoose");
const User = require("./UserSchema"); // Assuming UserSchema is in the same directory

const PostSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverName: {
    type: String,
    required: true
  },
  driverPhone: {
    type: String,
    required: true,
    match: [/^\d{10}$/, "Phone number should be 10 digits"]
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    required: true
  },
  departureTime: {
    type: Date,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  availableSeats: {
    type: Number,
    required: true,
    min: 0
  },
  fare: {
    type: Number,
    required: true,
    min: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Post", PostSchema);
