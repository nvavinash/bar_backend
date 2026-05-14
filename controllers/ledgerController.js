const Ledger = require("../models/Ledger");

// POST /api/ledger → Admin/Editor – add manual transaction
const addTransaction = async (req, res) => {
  try {
    const { name, type, amount, description, paymentMode, transactionId, date } = req.body;

    if (!name || !type || !amount || !description) {
      return res.status(400).json({ message: "name, type, amount, and description are required." });
    }

    const entry = new Ledger({
      name,
      type,
      amount: Number(amount),
      description,
      paymentMode: paymentMode || "",
      transactionId: transactionId || "",
      date: date ? new Date(date) : new Date(),
    });

    const saved = await entry.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error adding ledger transaction:", error);
    res.status(500).json({ message: "Failed to add transaction", error: error.message });
  }
};

// GET /api/ledger → Get all transactions (latest first)
const getTransactions = async (req, res) => {
  try {
    const transactions = await Ledger.find()
      .sort({ date: -1, createdAt: -1 })
      .populate("memberId", "name enrollmentNumber");
    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching ledger:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

// GET /api/ledger/summary → totals & balance
const getSummary = async (req, res) => {
  try {
    const all = await Ledger.find();

    let totalCredit = 0;
    let totalDebit = 0;

    all.forEach((entry) => {
      if (entry.type === "credit") totalCredit += entry.amount;
      else if (entry.type === "debit") totalDebit += entry.amount;
    });

    res.status(200).json({
      totalCredit,
      totalDebit,
      balance: totalCredit - totalDebit,
    });
  } catch (error) {
    console.error("Error fetching ledger summary:", error);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
};

// DELETE /api/ledger/:id → Admin only
const deleteTransaction = async (req, res) => {
  try {
    const deleted = await Ledger.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Transaction not found" });
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "Failed to delete transaction" });
  }
};

module.exports = { addTransaction, getTransactions, getSummary, deleteTransaction };
