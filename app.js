import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import taxRoutes from "./routes/taxRoutes.js";

const app = express();
app.use(express.json());
dotenv.config();

let uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.te788iv.mongodb.net/invoice-tax-apr-24?retryWrites=true&w=majority`;

async function connectToMongoDB() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

connectToMongoDB();

// Use invoice routes
app.use("/invoices", invoiceRoutes);
app.use("/tax", taxRoutes);

// Define a simple route
app.get("/", (req, res) => {
  res.send("Hello, this is MERN invoice-project backend!");
});

const PORT = process.env.PORT || 3008;

app.listen(PORT, () => console.log(`server running at ${PORT}`));
