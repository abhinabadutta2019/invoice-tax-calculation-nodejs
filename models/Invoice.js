import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { serviceSchema } from "./Service.js";

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4,
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  referenceNumber: {
    type: String,
    trim: true,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Other"],
  },
  services: [serviceSchema],
  totalAmount: {
    type: Number,
    default: 0,
  },
  totalDiscountAmount: {
    type: Number,
    default: 0,
  },
  totalTaxAmount: {
    type: Number,
    default: 0,
  },
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
