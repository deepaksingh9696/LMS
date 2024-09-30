import express from "express";
import {
  issueBook,
  returnBook,
  getTransactionDetailsByBookName,
} from "../controllers/transactionController.js";

const router = express.Router();

// Issue a book
router.post("/issue", issueBook);

// API endpoint to return the book and calculate rent
router.post("/return-book", returnBook);
// Get transaction details by book name
router.get("/", getTransactionDetailsByBookName);

export default router;
