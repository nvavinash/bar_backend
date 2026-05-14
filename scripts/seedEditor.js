/**
 * Run with: node scripts/seedEditor.js
 * Adds the editor email user to the database if they don't exist.
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const editorEmail = (process.env.EDITOR_EMAIL || "editor.drtbar@gmail.com").toLowerCase();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ Connected to MongoDB");

    const existing = await User.findOne({ email: editorEmail });
    if (existing) {
      console.log(`ℹ️  Editor user already exists: ${editorEmail} (role: ${existing.role})`);
    } else {
      await User.create({ email: editorEmail, role: "editor" });
      console.log(`✅ Editor user created: ${editorEmail}`);
    }

    // Also verify admin exists
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@legalassoc.com").toLowerCase();
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({ email: adminEmail, role: "admin" });
      console.log(`✅ Admin user created: ${adminEmail}`);
    } else {
      console.log(`ℹ️  Admin user exists: ${adminEmail} (role: ${adminExists.role})`);
    }

    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
