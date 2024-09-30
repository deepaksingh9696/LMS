import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  bookName: {
    type: String,
    required: true,
  },
  category: {
    type: String,

    required: true,
  },
  rentPerDay: {
    type: Number,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  publishedDate: {
    type: Date,
    required: true,
  },
  isbn: {
    type: String,
    required: true,
  },
  availableCopies: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  addedDate: {
    type: Date,
    default: Date.now,
  },
});

const Book = mongoose.model("Book", bookSchema);
export default Book;
