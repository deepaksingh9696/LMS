import Rental from "../models/Rental.js"; // Assuming you have a Rental model
import Book from "../models/bookModel.js"; // Assuming you have a Book model
import moment from "moment";

// Centralized error handler
const handleErrorResponse = (res, error, statusCode = 500) => {
  console.error(error);
  res.status(statusCode).json({ error: error.message });
};

// Create a new book
export const createBook = async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    handleErrorResponse(res, error, 400);
  }
};

// Get all books
export const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

// Search books by name, category, or rent range
export const searchBooks = async (req, res) => {
  const { category, name, minRent, maxRent } = req.query;
  const filters = {};

  // Add category filter if provided
  if (category) {
    filters.category = category;
  }

  // Add name filter if provided (case-insensitive search)
  if (name) {
    filters.bookName = { $regex: name, $options: "i" };
  }

  // Add rent range filter if both minRent and maxRent are provided
  if (minRent && maxRent) {
    filters.rentPerDay = {
      $gte: parseFloat(minRent),
      $lte: parseFloat(maxRent),
    };
  }

  try {
    const books = await Book.find(filters);
    res.status(200).json(books);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

// Get a book by ID
export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(book);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

// Update a book by ID
export const updateBookById = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(book);
  } catch (error) {
    handleErrorResponse(res, error, 400);
  }
};

// Delete a book by ID
export const deleteBookById = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(book);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

// Rent a book
export const rentBook = async (req, res) => {
  try {
    const { bookId, userId } = req.body;

    if (!bookId || !userId) {
      return res.status(400).json({ error: "bookId and userId are required" });
    }

    const rental = new Rental({ bookId, userId, rentDate: moment() }); // Store the current date as rentDate
    await rental.save();

    return res
      .status(201)
      .json({ message: "Book rented successfully", rental });
  } catch (error) {
    handleErrorResponse(res, error, 500);
  }
};

// Return a rented book and calculate rent
export const returnBook = async (req, res) => {
  try {
    const { bookId, userId, returnDate } = req.body;

    if (!bookId || !userId || !returnDate) {
      return res.status(400).json({
        error: "bookId, userId, and returnDate are required",
      });
    }

    const rental = await Rental.findOne({ bookId, userId });

    if (!rental) {
      return res.status(404).json({ error: "Rental record not found" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const issueDate = moment(rental.rentDate);
    const returnDateParsed = moment(returnDate);

    const rentalDays = returnDateParsed.diff(issueDate, "days");
    if (rentalDays < 0) {
      return res
        .status(400)
        .json({ error: "Return date cannot be before the issue date" });
    }

    const totalRent = rentalDays * book.rentPerDay;

    rental.returnDate = returnDate;
    rental.totalRent = totalRent;
    await rental.save();

    return res.status(200).json({
      message: "Book returned successfully",
      rental: {
        bookId: rental.bookId,
        userId: rental.userId,
        rentDate: rental.rentDate,
        returnDate: rental.returnDate,
        totalRent: rental.totalRent,
      },
    });
  } catch (error) {
    handleErrorResponse(res, error, 500);
  }
};

// Get rentals by userId
export const getRentals = async (req, res) => {
  try {
    const { userId } = req.params;

    const rentals = await Rental.find({ userId }).populate("bookId");

    if (rentals.length === 0) {
      return res
        .status(404)
        .json({ message: "No rentals found for this user" });
    }

    return res.status(200).json(rentals);
  } catch (error) {
    handleErrorResponse(res, error, 500);
  }
};

// Get books by rent range
export const getBooksByRentRange = async (req, res) => {
  try {
    const { minRent, maxRent } = req.query;

    if (!minRent || !maxRent) {
      return res
        .status(400)
        .json({ error: "Please provide both minRent and maxRent values" });
    }

    const books = await Book.find({
      rentPerDay: { $gte: parseFloat(minRent), $lte: parseFloat(maxRent) },
    });

    res.status(200).json(books);
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

// get alll user by book name

export const getBookIssuers = async (req, res) => {
  const { bookName } = req.query;
  console.log("Received bookName:", bookName);

  if (!bookName) {
    return res.status(400).json({ error: "Book name is required" });
  }

  try {
    const book = await Book.findOne({
      bookName: { $regex: new RegExp(bookName, "i") },
    });

    if (!book) {
      console.log(`Book not found: ${bookName}`);
      return res.status(404).json({ message: "Book not found" });
    }

    console.log("Book found:", book); // Log found book

    const rentals = await Rental.find({ bookId: book._id }).populate(
      "userId",
      "username email"
    );

    console.log("Rentals found:", rentals); // Log rentals found

    if (!rentals.length) {
      return res
        .status(404)
        .json({ message: "No rental records found for this book" });
    }

    const totalCount = rentals.length;
    const currentRental = rentals.find((rental) => !rental.returnDate);
    const currentIssuer = currentRental ? currentRental.userId : null;

    const pastIssuers = rentals.map((rental) => ({
      username: rental.userId ? rental.userId.username : "Unknown User",
      email: rental.userId ? rental.userId.email : "No email available",
      rentDate: rental.rentDate,
      returnDate: rental.returnDate || "Currently issued",
    }));

    res.status(200).json({
      totalIssuedCount: totalCount,
      currentIssuer: currentIssuer
        ? { name: currentIssuer.username, email: currentIssuer.email }
        : "Not issued at the moment",
      pastIssuers,
    });
  } catch (error) {
    console.error("Error fetching book issuers:", error);
    res.status(500).json({ error: error.message });
  }
};
