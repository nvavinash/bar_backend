const express = require("express");
const router = express.Router();
const { getUsers, getVirtual, updateVirtual } = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Protected Admin Routes
router.route("/users").get(protect, adminOnly, getUsers);

// Virtual Hearings / Meeting Links
router.route("/virtual")
  .get(getVirtual) // Public get
  .post(protect, adminOnly, updateVirtual); // Private update

module.exports = router;
