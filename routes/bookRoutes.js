import express from "express";
import {
  createBook,
  searchBooks,
  getAllBooks,
  getBookById,
  updateBookById,
  deleteBookById,
  rentBook,
  returnBook,
  getRentals,
  getBookIssuers,
  getBooksByRentRange,
} from "../controllers/bookController.js"; // Import the controller methods

const router = express.Router();

// Book CRUD routes
router.post("/", createBook); // Create a new book
router.get("/", getAllBooks); // Get all books
router.get("/search", searchBooks); // Search for books based on query parameters
router.get("/rent-range", getBooksByRentRange); // Get books by rent range
router.get("/:id", getBookById); // Get a specific book by its ID
router.put("/:id", updateBookById); // Update a specific book by its ID
router.delete("/:id", deleteBookById); // Delete a specific book by its ID

// Rental routes
router.post("/rent", rentBook); // Rent a book
router.post("/return", returnBook); // Return a rented book and calculate the rent
router.get("/rentals/:userId", getRentals); // Get all rentals for a specific user by userId

// Define the route
router.get("/book-issuers", getBookIssuers);

export default router;
