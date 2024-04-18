import express from "express";
import Tax from "../models/Tax.js";

const router = express.Router();

// Create Tax
router.post("/", async (req, res) => {
  try {
    const tax = new Tax(req.body);
    await tax.save();
    res.status(201).json(tax);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Read All Taxes
router.get("/", async (req, res) => {
  try {
    const taxes = await Tax.find();
    res.json(taxes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Read Single Tax
router.get("/:id", async (req, res) => {
  try {
    const tax = await Tax.findById(req.params.id);
    if (tax == null) {
      return res.status(404).json({ message: "Tax not found" });
    }
    res.json(tax);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Tax
router.put("/:id", async (req, res) => {
  try {
    const updatedTax = await Tax.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (updatedTax == null) {
      return res.status(404).json({ message: "Tax not found" });
    }
    res.json(updatedTax);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Tax
router.delete("/:id", async (req, res) => {
  try {
    const tax = await Tax.findOneAndDelete({ _id: req.params.id });
    if (tax == null) {
      return res.status(404).json({ message: "Tax not found" });
    }
    res.json({ message: "Tax deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
