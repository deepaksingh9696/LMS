import Transaction from "../models/transactionModel.js";
import Book from "../models/bookModel.js";

// Controller to issue a book by name
export const issueBook = async (req, res) => {
  try {
    const { bookName, userId, issueDate } = req.body;

    if (!bookName || !userId || !issueDate) {
      return res
        .status(400)
        .json({ error: "bookName, userId, and issueDate are required" });
    }

    // Find the book by name
    const book = await Book.findOne({ bookName: bookName });
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Create a new transaction
    const transaction = new Transaction({
      bookId: book._id,
      userId,
      issueDate,
    });
    await transaction.save();

    return res.status(201).json({
      message: "Book issued successfully",
      transaction,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while issuing the book" });
  }
};

// Function to handle returning a book and calculating rent

export const returnBook = async (req, res) => {
  const { bookName, userId, returnDate } = req.body;

  try {
    // Log the bookName and userId
    console.log(`Searching for book: ${bookName} for user: ${userId}`);

    // Step 1: Find all books to ensure they exist
    const allBooks = await Book.find();
    console.log("All books in the database:", allBooks);

    // Step 2: Find the book by name (case-insensitive search)
    const book = await Book.findOne({
      bookName: { $regex: new RegExp(`^${bookName}$`, "i") },
    });

    // Check if book is found
    if (!book) {
      console.log(`Book "${bookName}" not found`);
      return res.status(404).json({ message: "Book not found" });
    }

    // Step 3: Find the active transaction for the user and book
    const transaction = await Transaction.findOne({
      userId,
      bookId: book._id,
      returnDate: null,
    });

    if (!transaction) {
      console.log(
        `Transaction for user "${userId}" and book "${book._id}" not found`
      );
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Step 4: Calculate the rent
    const issueDate = new Date(transaction.issueDate);
    const returnDateParsed = new Date(returnDate);
    const timeDiff = Math.abs(returnDateParsed - issueDate);
    const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const totalRent = diffDays * book.rentPerDay;

    // Update the transaction with the return date and total rent
    transaction.returnDate = returnDateParsed;
    transaction.totalRent = totalRent;
    await transaction.save();

    return res.json({
      message: "Book returned successfully",
      totalRent,
      transaction,
    });
  } catch (error) {
    console.log("Error occurred:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// API to get transaction details by book name
export const getTransactionDetailsByBookName = async (req, res) => {
  const { bookName } = req.query;

  if (!bookName) {
    return res.status(400).json({ message: "Book name is required" });
  }

  try {
    const book = await Book.findOne({
      bookName: { $regex: new RegExp(`^${bookName}$`, "i") },
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const transactions = await Transaction.find({ bookId: book._id })
      .populate("userId", "name") // Assuming user model has a 'name' field
      .sort({ issueDate: -1 });

    const issuedUsers = transactions.map(
      (transaction) => transaction.userId.name
    );
    const totalIssuedCount = issuedUsers.length;

    const currentlyIssued =
      transactions.length > 0 &&
      !transactions[transactions.length - 1].returnDate
        ? transactions[transactions.length - 1].userId.name
        : null;

    return res.status(200).json({
      totalIssuedCount,
      currentlyIssued: currentlyIssued || "Not issued at the moment",
      issuedUsers,
    });
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get list of issuers for a book
export const getBookIssuers = async (req, res) => {
  const { bookName } = req.params;

  try {
    const transactions = await Transaction.find({ bookName }).populate(
      "userId",
      "name"
    );

    const pastIssuers = transactions.map((transaction) => ({
      userId: transaction.userId._id,
      userName: transaction.userId.name,
      issueDate: transaction.issueDate,
    }));

    const currentlyIssued = transactions.length
      ? transactions[transactions.length - 1]
      : null;

    res.status(200).json({
      totalCount: pastIssuers.length,
      currentIssuer: currentlyIssued
        ? currentlyIssued.userId.name
        : "Not issued",
      pastIssuers,
    });
  } catch (error) {
    console.error("Error fetching issuers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get total rent generated by a book
export const getTotalRent = async (req, res) => {
  const { bookName } = req.params;

  try {
    const transactions = await Transaction.find({ bookName });
    const totalRent = transactions.reduce(
      (sum, transaction) => sum + transaction.rent,
      0
    );

    res.status(200).json({ totalRent });
  } catch (error) {
    console.error("Error fetching total rent:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get list of books issued to a person
export const getBooksIssuedToPerson = async (req, res) => {
  const { userId } = req.params;

  try {
    const transactions = await Transaction.find({ userId }).populate(
      "bookName"
    );

    const booksIssued = transactions.map((transaction) => ({
      bookName: transaction.bookName,
      issueDate: transaction.issueDate,
      returnDate: transaction.returnDate,
      rent: transaction.rent,
    }));

    res.status(200).json(booksIssued);
  } catch (error) {
    console.error("Error fetching books issued to person:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get list of books issued in a date range
export const getBooksIssuedInDateRange = async (req, res) => {
  const { startDate, endDate } = req.body;

  try {
    const transactions = await Transaction.find({
      issueDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).populate("userId", "name");

    const issuedBooks = transactions.map((transaction) => ({
      bookName: transaction.bookName,
      userName: transaction.userId.name,
      issueDate: transaction.issueDate,
    }));

    res.status(200).json(issuedBooks);
  } catch (error) {
    console.error("Error fetching issued books in date range:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
