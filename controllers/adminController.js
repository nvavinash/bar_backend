const path = require("path");
const fs = require("fs");
const { getIsConnected } = require("../config/db");

// Fallback JSON file path for meeting links
const LINKS_FILE = path.join(__dirname, "../data/virtual_links.json");

const ensureDataDir = () => {
  const dir = path.join(__dirname, "../data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const readLinksFile = () => {
  ensureDataDir();
  if (!fs.existsSync(LINKS_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(LINKS_FILE, "utf-8")); }
  catch { return {}; }
};

const writeLinksFile = (data) => {
  ensureDataDir();
  fs.writeFileSync(LINKS_FILE, JSON.stringify(data, null, 2));
};

// --- Get All Users ---
// GET /api/admin/users
const getUsers = async (req, res) => {
  const dbUp = getIsConnected();
  if (!dbUp) {
    return res.status(200).json([{
      _id: "fallback-admin",
      email: process.env.ADMIN_EMAIL || "admin@legalassoc.com",
      role: "admin",
      createdAt: new Date().toISOString(),
    }]);
  }
  try {
    const User = require("../models/User");
    const users = await User.find({}).select("-otp -otpExpires");
    res.status(200).json(users);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ message: "Failed to fetch users from database." });
  }
};

// --- Get Virtual Settings ---
// GET /api/admin/virtual
const getVirtual = async (req, res) => {
  const dbUp = getIsConnected();

  if (!dbUp) {
    // Fallback: read from JSON file
    const config = readLinksFile();
    return res.status(200).json(config);
  }

  try {
    const Virtual = require("../models/Virtual");
    const settings = await Virtual.find({});
    const config = {};
    settings.forEach(s => config[s.key] = s.value);
    res.status(200).json(config);
  } catch (error) {
    console.error("Fetch virtual error:", error);
    // Fallback to file on DB error
    const config = readLinksFile();
    res.status(200).json(config);
  }
};

// --- Update Virtual Settings ---
// POST /api/admin/virtual
const updateVirtual = async (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== "object") {
    return res.status(400).json({ message: "Invalid settings format." });
  }

  const dbUp = getIsConnected();

  if (!dbUp) {
    // Fallback: write to JSON file
    try {
      const current = readLinksFile();
      const updated = { ...current, ...settings };
      writeLinksFile(updated);
      return res.status(200).json({ message: "Settings updated successfully." });
    } catch (err) {
      return res.status(500).json({ message: "Failed to save settings to file." });
    }
  }

  try {
    const Virtual = require("../models/Virtual");
    const promises = Object.entries(settings).map(([key, value]) =>
      Virtual.findOneAndUpdate({ key }, { value }, { upsert: true, new: true })
    );
    await Promise.all(promises);
    // Also sync to file as backup
    const current = readLinksFile();
    writeLinksFile({ ...current, ...settings });
    res.status(200).json({ message: "Settings updated successfully." });
  } catch (error) {
    console.error("Update virtual error:", error);
    res.status(500).json({ message: "Failed to update settings." });
  }
};

module.exports = { getUsers, getVirtual, updateVirtual };
