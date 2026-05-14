const express = require("express");
const router = express.Router();

const {
  getNext,
  assign,
  getList,
  getHistory,
  getEligibleList,
  resetPointer,
  getMemberAssignments,
  getCopMembersPublic,
} = require("../controllers/commissionerController");

const { protect, adminOnly, editorOnly, editorOrAdmin } = require("../middleware/authMiddleware");

// ── PUBLIC ──────────────────────────────────────────────────────────────────
// GET  /api/commissioner/list            — All assignments history (public)
router.get("/list", getList);

// GET  /api/commissioner/cop-members     — All COP members + their assignment status (public)
router.get("/cop-members", getCopMembersPublic);

// GET  /api/commissioner/member-assignments — Map of memberId -> active assignment
router.get("/member-assignments", getMemberAssignments);

// ── EDITOR / ADMIN ───────────────────────────────────────────────────────────
// GET  /api/commissioner/next            — Preview next member (editor/admin)
router.get("/next", protect, editorOrAdmin, getNext);

// GET  /api/commissioner/history         — Last 20 assignments (editor/admin)
router.get("/history", protect, editorOrAdmin, getHistory);

// GET  /api/commissioner/eligible        — Full eligible COP member list
router.get("/eligible", protect, editorOrAdmin, getEligibleList);

// POST /api/commissioner/assign          — Create new assignment (editor/admin)
router.post("/assign", protect, editorOrAdmin, assign);

// ── ADMIN ONLY ───────────────────────────────────────────────────────────────
// POST /api/commissioner/reset           — Reset queue pointer to 0
router.post("/reset", protect, adminOnly, resetPointer);

module.exports = router;
