import express from "express";
import Rental from "../models/Rental.js"; // Import the Rental model (transaction records)
import Book from "../models/bookModel.js"; // Import the Book model
import User from "../models/userModel.js"; // Import the User model
import moment from "moment"; // Import moment.js for date calculations

const router = express.Router(); // Define the router here

// Issue a book
export const issueBook = async (req, res) => {
  try {
    const { bookId, userId } = req.body;

    if (!bookId || !userId) {
      return res
        .status(400)
        .json({ message: "Book ID and User ID are required" });
    }

    const newTransaction = new Rental({
      bookId,
      userId,
      issueDate: new Date(), // Ensure this matches your Rental schema
    });

    const savedTransaction = await newTransaction.save();
    return res.status(200).json({
      message: "Book issued successfully",
      transaction: savedTransaction,
    });
  } catch (error) {
    console.error("Error issuing book:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Return a book
export const returnBook = async (req, res) => {
  try {
    const { bookId, userId, returnDate } = req.body; // Destructure inputs from the request body

    if (!bookId || !userId || !returnDate) {
      return res
        .status(400)
        .json({ message: "Book ID, User ID, and Return Date are required" });
    }

    // Find the rental record for the given bookId and userId
    const rental = await Rental.findOne({ bookId, userId, returnDate: null });

    if (!rental) {
      return res
        .status(404)
        .json({ message: "Rental record not found or already returned" });
    }

    // Find the book details to get rent_per_day
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Validate returnDate format
    const returnDateParsed = moment(returnDate);
    if (!returnDateParsed.isValid()) {
      return res.status(400).json({ message: "Invalid return date" });
    }

    // Calculate the total number of rental days
    const issueDate = moment(rental.issueDate); // Issue date from the rental record
    const rentalDays = returnDateParsed.diff(issueDate, "days");
    if (rentalDays < 0) {
      return res
        .status(400)
        .json({ message: "Return date cannot be before the issue date" });
    }

    // Calculate total rent
    const totalRent = rentalDays * book.rentPerDay;

    // Ensure totalRent is a valid number
    if (isNaN(totalRent) || totalRent < 0) {
      return res.status(400).json({ message: "Invalid rent calculation" });
    }

    // Update the rental record with returnDate and totalRent
    rental.returnDate = returnDateParsed.toDate();
    rental.totalRent = totalRent;
    await rental.save();

    return res.status(200).json({
      message: "Book returned successfully",
      rental: {
        bookId: rental.bookId,
        userId: rental.userId,
        issueDate: rental.issueDate,
        returnDate: rental.returnDate,
        totalRent: rental.totalRent,
      },
    });
  } catch (error) {
    console.error("Error processing book return:", error);
    return res.status(500).json({
      message: "Error processing book return",
      details: error.message,
    });
  }
};

// API endpoint to get book issuance details
export const getBookIssuanceDetails = async (req, res) => {
  try {
    const { bookName } = req.params; // Capture book name from request params

    // Find the book by name

    const book = await Book.findOne({ name: bookName });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const bookId = book._id; // Extract book ID

    // Fetch all transactions related to this book
    const allTransactions = await Transaction.find({ bookId }).populate(
      "userId",
      "name"
    );

    // If there are no transactions, return an appropriate message
    if (allTransactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for this book" });
    }

    // Get list of people who issued the book in the past
    const pastIssuedUsers = allTransactions
      .filter((transaction) => transaction.returnDate !== null)
      .map((transaction) => ({
        userId: transaction.userId._id,
        userName: transaction.userId.name,
        issueDate: transaction.issueDate,
        returnDate: transaction.returnDate,
      }));

    // Check if the book is currently issued (returnDate is null)
    const currentlyIssued = allTransactions.find(
      (transaction) => transaction.returnDate === null
    );

    // Construct the response
    const response = {
      totalIssuedCount: allTransactions.length,
      pastIssuedUsers: pastIssuedUsers,
      currentlyIssued: currentlyIssued
        ? {
            userId: currentlyIssued.userId._id,
            userName: currentlyIssued.userId.name,
            issueDate: currentlyIssued.issueDate,
          }
        : "Not currently issued",
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching book issuance details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Adding the endpoint to the router
router.get("/book-status/:bookName", getBookIssuanceDetails);

export default router;

// Get total rent generated by a book based on its name

export const getTotalRentByBook = async (req, res) => {
  try {
    const { bookName } = req.params;
    console.log("Searching for book:", bookName);

    const book = await Book.findOne({
      bookName: new RegExp(`^${bookName}$`, "i"),
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const bookId = book._id;
    console.log("Book ID found:", bookId); // Log book ID

    const allTransactions = await Rental.find({ bookId });
    console.log("All transactions for book:", allTransactions);

    if (allTransactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for this book" });
    }

    const dailyRate = 10;

    const totalRent = allTransactions.reduce((sum, rental) => {
      const currentDate = new Date();
      const issueDate = new Date(rental.issueDate);
      const daysRented = Math.ceil(
        (currentDate - issueDate) / (1000 * 60 * 60 * 24)
      );

      const rentalAmount = rental.returnDate
        ? rental.totalRent
        : daysRented * dailyRate;

      console.log("Current rental:", rental);
      return sum + rentalAmount;
    }, 0);

    return res.status(200).json({
      message: `Total rent generated by the book "${bookName}"`,
      totalRent: totalRent,
    });
  } catch (error) {
    console.error("Error calculating total rent:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get list of books issued to a specific user

export const getIssuedBooksByUser = async (req, res) => {
  try {
    const { userId } = req.params; // Capture userId from request params
    console.log("Fetching issued books for userId:", userId); // Log userId

    // Find the user by userId
    const user = await User.findById(userId);
    console.log("User found:", user); // Log the user object

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch all rental transactions for the user
    const rentals = await Rental.find({ userId }).populate("bookId"); // Populate book details
    console.log("Rentals found:", rentals); // Log retrieved rentals

    if (rentals.length === 0) {
      return res.status(404).json({ message: "No books issued to this user" });
    }

    // Construct the response with book details
    const issuedBooks = rentals.map((rental) => ({
      bookId: rental.bookId._id,
      bookName: rental.bookId.bookName,
      issueDate: rental.issueDate,
      returnDate: rental.returnDate,
      totalRent: rental.totalRent,
    }));

    return res.status(200).json({
      message: `Books issued to ${user.name}`,
      issuedBooks: issuedBooks,
    });
  } catch (error) {
    console.error("Error fetching issued books:", error); // Log the error
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get list of books issued within a date range

export const getIssuedBooksByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.body; // Capture date range from request body

    // Validate date inputs
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    // Convert to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch rental records within the date range
    const rentals = await Rental.find({
      issueDate: {
        $gte: start,
        $lte: end,
      },
    })
      .populate("userId", "name") // Populate user details
      .populate("bookId"); // Populate book details

    if (rentals.length === 0) {
      return res
        .status(404)
        .json({ message: "No books issued in this date range" });
    }

    // Construct the response with book and user details
    const issuedBooks = rentals.map((rental) => {
      // Check if bookId and userId exist before accessing their properties
      const bookId = rental.bookId ? rental.bookId._id : null;
      const bookName = rental.bookId ? rental.bookId.bookName : "Unknown Book";
      const userId = rental.userId ? rental.userId._id : null;
      const userName = rental.userId ? rental.userId.name : "Unknown User";

      return {
        bookId: bookId,
        bookName: bookName,
        userId: userId,
        userName: userName,
        issueDate: rental.issueDate,
        returnDate: rental.returnDate,
      };
    });

    return res.status(200).json({
      message: `Books issued between ${startDate} and ${endDate}`,
      issuedBooks: issuedBooks,
    });
  } catch (error) {
    console.error("Error fetching issued books by date range:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
