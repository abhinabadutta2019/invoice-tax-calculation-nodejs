import mongoose from "mongoose";

export const serviceSchema = new mongoose.Schema({
  serviceType: {
    type: String,
    required: true,
    trim: true,
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  tax: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tax",
    required: true,
  },
  finalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
});
