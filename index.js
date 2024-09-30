import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import bodyParser from "body-parser";
import bookRoutes from "./routes/bookRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import rentalRoutes from "./routes/rentalRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import { getBookIssuers } from "./controllers/bookController.js";

dotenv.config();

// Create an express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/rentals", rentalRoutes); // Prefix your routes with /api/rentals

// Define the API route
app.get("/api/book-issuers", getBookIssuers);

// Error Handler Middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
