const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
  domain: { type: String, required: true },
  path: { type: String, required: true },
  expires: { type: Number, required: true },
  httpOnly: { type: Boolean, required: true },
  secure: { type: Boolean, required: true }
});

module.exports = mongoose.model("Session", sessionSchema);
