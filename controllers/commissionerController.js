const Member = require("../models/Member");
const CommissionerAssignment = require("../models/CommissionerAssignment");
const QueuePointer = require("../models/QueuePointer");

const APPOINTED_BY_OPTIONS = ["DRT-1 RO1", "DRT-1 RO2", "DRT-2 RO1", "DRT-2 RO2"];

/** Calculate experience in full years from enrollmentDate string */
const calcExp = (enrollmentDate) => {
  if (!enrollmentDate) return 0;
  let d = new Date(enrollmentDate);
  if (isNaN(d.getTime())) {
    const parts = enrollmentDate.split(/[\/\-]/);
    if (parts.length === 3) d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  }
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  return Math.max(0, Math.floor((now - d) / (1000 * 60 * 60 * 24 * 365.25)));
};

/** Get sorted list of eligible COP members (copStatus=true, status=Approved) */
const getEligibleMembers = async () => {
  const members = await Member.find({
    copStatus: true,
    status: "Approved",
  }).lean();

  return members
    .map((m) => ({ ...m, experience: calcExp(m.enrollmentDate) }))
    .sort((a, b) => b.experience - a.experience);
};

/** Get or create the pointer document */
const getPointer = async () => {
  let ptr = await QueuePointer.findOne({ key: "commissioner_pointer" });
  if (!ptr) {
    ptr = await QueuePointer.create({ key: "commissioner_pointer", pointer: 0, cycleCount: 0 });
  }
  return ptr;
};

// ---------------------------------------------------------------------------
// GET /api/commissioner/next  — Editor/Admin
// Returns the next member to be assigned WITHOUT saving assignment
// ---------------------------------------------------------------------------
const getNext = async (req, res) => {
  try {
    const eligible = await getEligibleMembers();
    if (eligible.length === 0) {
      return res.status(404).json({ message: "No COP-approved members found." });
    }

    const ptr = await getPointer();
    const idx = ptr.pointer % eligible.length;
    const member = eligible[idx];

    // Preview next 5 after current
    const preview = Array.from({ length: Math.min(5, eligible.length) }, (_, i) => {
      const m = eligible[(idx + 1 + i) % eligible.length];
      return { _id: m._id, name: m.name, experience: m.experience, enrollmentNumber: m.enrollmentNumber };
    });

    res.status(200).json({
      current: {
        _id: member._id,
        name: member.name,
        experience: member.experience,
        enrollmentNumber: member.enrollmentNumber,
        enrollmentDate: member.enrollmentDate,
      },
      nextPreview: preview,
      pointer: idx,
      total: eligible.length,
      cycleCount: ptr.cycleCount,
    });
  } catch (err) {
    console.error("getNext error:", err);
    res.status(500).json({ message: "Failed to get next commissioner", error: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/commissioner/assign  — Editor/Admin
// Save the assignment and advance pointer
// ---------------------------------------------------------------------------
const assign = async (req, res) => {
  try {
    const { appointedBy, rcNumber } = req.body;

    if (!appointedBy || !APPOINTED_BY_OPTIONS.includes(appointedBy)) {
      return res.status(400).json({ message: `appointedBy is required. Must be one of: ${APPOINTED_BY_OPTIONS.join(", ")}` });
    }
    if (!rcNumber || !rcNumber.trim()) {
      return res.status(400).json({ message: "rcNumber is required." });
    }

    const eligible = await getEligibleMembers();
    if (eligible.length === 0) {
      return res.status(404).json({ message: "No COP-approved members found." });
    }

    const ptr = await getPointer();
    const idx = ptr.pointer % eligible.length;
    const member = eligible[idx];

    // Save assignment
    const assignment = await CommissionerAssignment.create({
      memberId: member._id,
      name: member.name,
      experience: member.experience,
      appointedBy,
      rcNumber: rcNumber.trim(),
      assignedDate: new Date(),
      assignedBy: req.user?._id,
      assignedByEmail: req.user?.email,
    });

    // Advance pointer — auto-reset when cycle completes
    const nextPointer = ptr.pointer + 1;
    const newCycleCount = nextPointer % eligible.length === 0
      ? ptr.cycleCount + 1
      : ptr.cycleCount;

    ptr.pointer = nextPointer;
    ptr.cycleCount = newCycleCount;
    await ptr.save();

    const cycleReset = newCycleCount > (ptr.cycleCount - (nextPointer % eligible.length === 0 ? 1 : 0));

    res.status(201).json({
      message: `${member.name} assigned successfully.`,
      assignment,
      cycleReset: nextPointer % eligible.length === 0,
      newCycleCount,
    });
  } catch (err) {
    console.error("assign error:", err);
    res.status(500).json({ message: "Failed to save assignment", error: err.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/commissioner/list  — Public
// All assignments (public view)
// ---------------------------------------------------------------------------
const getList = async (req, res) => {
  try {
    const assignments = await CommissionerAssignment.find()
      .sort({ assignedDate: -1 })
      .lean();

    res.status(200).json(assignments);
  } catch (err) {
    console.error("getList error:", err);
    res.status(500).json({ message: "Failed to fetch assignments", error: err.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/commissioner/history  — Editor/Admin
// Last 20 assignments
// ---------------------------------------------------------------------------
const getHistory = async (req, res) => {
  try {
    const assignments = await CommissionerAssignment.find()
      .sort({ assignedDate: -1 })
      .limit(20)
      .lean();

    res.status(200).json(assignments);
  } catch (err) {
    console.error("getHistory error:", err);
    res.status(500).json({ message: "Failed to fetch history", error: err.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/commissioner/eligible  — Editor/Admin
// Get full list of COP members for queue preview
// ---------------------------------------------------------------------------
const getEligibleList = async (req, res) => {
  try {
    const eligible = await getEligibleMembers();
    const ptr = await getPointer();
    const idx = ptr.pointer % (eligible.length || 1);

    const result = eligible.map((m, i) => ({
      _id: m._id,
      name: m.name,
      experience: m.experience,
      enrollmentNumber: m.enrollmentNumber,
      isCurrent: i === idx,
    }));

    res.status(200).json({ members: result, pointer: idx, total: eligible.length, cycleCount: ptr.cycleCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch eligible list", error: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/commissioner/reset  — Admin only
// Reset pointer to 0
// ---------------------------------------------------------------------------
const resetPointer = async (req, res) => {
  try {
    await QueuePointer.findOneAndUpdate(
      { key: "commissioner_pointer" },
      { pointer: 0, cycleCount: 0 },
      { upsert: true }
    );
    res.status(200).json({ message: "Queue pointer reset to beginning." });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset pointer", error: err.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/commissioner/member-assignments  — Public
// Returns a map of memberId -> latest assignment (for member badges)
// ---------------------------------------------------------------------------
const getMemberAssignments = async (req, res) => {
  try {
    const assignments = await CommissionerAssignment.find({ isCompleted: false })
      .sort({ assignedDate: -1 })
      .lean();

    // Build unique memberId set (latest per member)
    const seen = new Set();
    const result = {};
    for (const a of assignments) {
      const id = a.memberId.toString();
      if (!seen.has(id)) {
        seen.add(id);
        result[id] = { appointedBy: a.appointedBy, rcNumber: a.rcNumber, assignedDate: a.assignedDate };
      }
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch member assignments", error: err.message });
  }
};

module.exports = { getNext, assign, getList, getHistory, getEligibleList, resetPointer, getMemberAssignments, getCopMembersPublic };

// ---------------------------------------------------------------------------
// GET /api/commissioner/cop-members  — PUBLIC
// All COP-approved members sorted by experience, with latest assignment merged
// ---------------------------------------------------------------------------
async function getCopMembersPublic(req, res) {
  try {
    const eligible = await getEligibleMembers(); // copStatus=true, status=Approved, sorted by exp

    // Get latest assignment per member
    const allAssignments = await CommissionerAssignment.find()
      .sort({ assignedDate: -1 })
      .lean();

    const latestByMember = {};
    for (const a of allAssignments) {
      const id = a.memberId.toString();
      if (!latestByMember[id]) {
        latestByMember[id] = {
          appointedBy: a.appointedBy,
          rcNumber: a.rcNumber,
          assignedDate: a.assignedDate,
          isCompleted: a.isCompleted,
        };
      }
    }

    const result = eligible.map((m) => ({
      _id: m._id,
      name: m.name,
      enrollmentNumber: m.enrollmentNumber,
      experience: m.experience,
      enrollmentDate: m.enrollmentDate,
      assignment: latestByMember[m._id.toString()] || null,
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("getCopMembersPublic error:", err);
    res.status(500).json({ message: "Failed to fetch COP members", error: err.message });
  }
}
