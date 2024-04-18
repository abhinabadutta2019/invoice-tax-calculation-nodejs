//routes/invoiceRoutes.js
import express from "express";
import Invoice from "../models/Invoice.js";

const router = express.Router();

// Create Invoice
router.post("/", async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Read All Invoices
router.get("/", async (req, res) => {
  try {
    const invoices = await Invoice.find();
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Read Single Invoice
router.get("/:id", getInvoice, (req, res) => {
  res.json(res.invoice);
});

// Update Invoice
router.put("/:id", getInvoice, async (req, res) => {
  try {
    const updatedInvoice = await res.invoice.set(req.body);
    await updatedInvoice.save();
    res.json(updatedInvoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Invoice
router.delete("/:id", getInvoice, async (req, res) => {
  try {
    await res.invoice.remove();
    res.json({ message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getInvoice(req, res, next) {
  let invoice;
  try {
    invoice = await Invoice.findById(req.params.id);
    if (invoice == null) {
      return res.status(404).json({ message: "Invoice not found" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.invoice = invoice;
  next();
}

export default router;
