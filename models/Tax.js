// models/Tax.js
import mongoose from "mongoose";

const taxSchema = new mongoose.Schema({
  taxName: {
    type: String,
    required: true,
    trim: true,
  },
  taxRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
});

// module.exports = mongoose.model("Tax", taxSchema);
const Tax = mongoose.model("Tax", taxSchema);
export default Tax;
