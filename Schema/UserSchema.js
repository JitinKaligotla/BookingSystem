const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ["driver", "user"],
    required: true
  }
}, { timestamps: true });

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
