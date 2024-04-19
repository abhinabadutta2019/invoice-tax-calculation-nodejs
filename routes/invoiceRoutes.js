//routes/invoiceRoutes.js
import express from "express";
import Invoice from "../models/Invoice.js";
import Tax from "../models/Tax.js";

const router = express.Router();

// Middleware to get invoice by ID
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

// Create Invoice
router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      invoiceDate,
      dueDate,
      referenceNumber,
      paymentMethod,
      services,
      totalAmount,
    } = req.body;

    const invoice = new Invoice({
      customerName,
      invoiceDate,
      dueDate,
      referenceNumber,
      paymentMethod,
      services,
      totalAmount,
    });

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

// Add Service to Invoice
router.post("/:id/add-service", async (req, res) => {
  try {
    const { serviceType, sellingPrice, discountPercentage, tax } = req.body;

    // Calculate discounted price
    const discountedPrice =
      sellingPrice - (sellingPrice * discountPercentage) / 100;

    // Find the tax rate from the Tax model
    const taxRate = await Tax.findById(tax).select("taxRate");
    if (!taxRate) {
      return res.status(404).json({ message: "Tax not found" });
    }

    // Calculate tax amount
    const taxAmount = (discountedPrice * taxRate.taxRate) / 100;

    // Calculate discount amount
    const discountAmount = sellingPrice - discountedPrice;

    // Calculate final price
    const finalPrice = Math.round(discountedPrice + taxAmount);

    const service = {
      serviceType,
      sellingPrice,
      discountPercentage,
      tax,
      discountedPrice,
      taxAmount,
      discountAmount,
      finalPrice, // Add final price to the service object
    };

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        $push: { services: service },
        $inc: {
          totalAmount: finalPrice, // Add final price to the total amount
        },
      },
      { new: true }
    );

    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json(updatedInvoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Remove Service from Invoice

router.delete("/:id/remove-service/:serviceId", async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const serviceId = req.params.serviceId;

    // Find the invoice by ID
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Find the service by ID in the invoice
    const service = invoice.services.find(
      (service) => service._id.toString() === serviceId
    );

    if (!service) {
      return res
        .status(404)
        .json({ message: "Service not found in the invoice" });
    }

    // Calculate the totalAmount to be deducted
    const totalAmountToDeduct = service.finalPrice;

    // Remove the service from the services array and deduct the totalAmount
    invoice.services = invoice.services.filter(
      (service) => service._id.toString() !== serviceId
    );
    invoice.totalAmount -= totalAmountToDeduct;

    await invoice.save();

    res.json({
      message: "Service removed from invoice",
      updatedInvoice: invoice,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update Invoice
router.put("/:id", getInvoice, async (req, res) => {
  try {
    const {
      customerName,
      invoiceDate,
      dueDate,
      referenceNumber,
      paymentMethod,
    } = req.body;

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        customerName,
        invoiceDate,
        dueDate,
        referenceNumber,
        paymentMethod,
      },
      {
        new: true,
      }
    );
    res.json(updatedInvoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Invoice
router.delete("/:id", getInvoice, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id });
    if (invoice == null) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json({ message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
