import express from "express";
import { createUser, getAllUsers } from "../controllers/userController.js";

const router = express.Router();

// Route for creating a new user
router.post("/", createUser);

// Route for getting all users
router.get("/", getAllUsers);

export default router;
