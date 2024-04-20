import express from "express";
import Invoice from "../models/Invoice.js";
import Tax from "../models/Tax.js";
import PDFDocument from "pdfkit";
import fs from "fs";

const router = express.Router();

// Middleware to get invoice by ID
async function getInvoice(req, res, next) {
  let invoice;
  try {
    invoice = await Invoice.findById(req.params.id).populate(
      "services.tax",
      "taxName taxRate"
    );
    if (invoice == null) {
      return res.status(404).json({ message: "Invoice not found" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.invoice = invoice;
  next();
}

router.get("/download/:id", getInvoice, async (req, res) => {
  try {
    const invoice = res.invoice; // Get the invoice from the response object
    const doc = new PDFDocument();
    const filename = `invoice_${invoice.invoiceNumber}.pdf`;

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.fontSize(12).text(`Customer Name: ${invoice.customerName}`);
    doc.fontSize(12).text(`Invoice Date: ${invoice.invoiceDate}`);
    doc.fontSize(12).text(`Due Date: ${invoice.dueDate}`);

    // Services table
    doc.moveDown();
    doc.fontSize(14).text("Services:", { underline: true });

    // Table headers
    doc.fontSize(12).text("Service Type", 100, doc.y, { width: 200 });
    doc.text("Final Price", 300, doc.y);

    // Table rows
    let yPos = doc.y;
    invoice.services.forEach((service) => {
      yPos = yPos + 20;
      doc.fontSize(12).text(service.serviceType, 100, yPos, { width: 200 });
      doc.text(`$${service.finalPrice.toFixed(2)}`, 300, yPos);
    });

    // Total amounts
    yPos += 40;
    doc.moveDown();
    doc
      .fontSize(16)
      .text(
        `Total Discount Amount: $${invoice.totalDiscountAmount.toFixed(2)}`,
        { align: "right" }
      );
    doc.moveDown();
    doc
      .fontSize(16)
      .text(`Total Tax Amount: $${invoice.totalTaxAmount.toFixed(2)}`, {
        align: "right",
      });
    doc.moveDown();
    doc
      .fontSize(16)
      .text(`Total Amount: $${invoice.totalAmount.toFixed(2)}`, {
        align: "right",
        underline: true,
      });

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

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
          totalDiscountAmount: discountAmount, // Add discount amount to totalDiscountAmount
          totalTaxAmount: taxAmount, // Add tax amount to totalTaxAmount
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

    // Deduct the taxAmount and discountAmount from totalTaxAmount and totalDiscountAmount respectively
    invoice.totalTaxAmount -= service.taxAmount;
    invoice.totalDiscountAmount -= service.discountAmount;

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
