import mongoose from "mongoose";

const rentalSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  issueDate: {
    type: Date,
    required: true,
  },
  returnDate: {
    type: Date,
    default: null,
  },
  totalRent: {
    type: Number, // Ensure this is a number type
    default: 0,
  },
});

const Rental = mongoose.model("Rental", rentalSchema);
export default Rental;
