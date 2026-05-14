const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  addTransaction,
  getTransactions,
  getSummary,
  deleteTransaction,
} = require("../controllers/ledgerController");

// Summary must come before /:id to avoid route conflict
router.get("/summary", protect, adminOnly, getSummary);

// Get all transactions (admin only)
router.get("/", protect, adminOnly, getTransactions);

// Add manual transaction (admin only)
router.post("/", protect, adminOnly, addTransaction);

// Delete a transaction (admin only)
router.delete("/:id", protect, adminOnly, deleteTransaction);

module.exports = router;
