require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

// Initial Admin Configuration
// You can change this email before running the script
// const adminEmail = "admin@legalassoc.com";
const adminEmail = process.env.ADMIN_EMAIL;

const seedAdminUser = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Check if the user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Admin user with email ${adminEmail} already exists.`);
      process.exit(0);
    }

    // Create the first admin user
    await User.create({
      email: adminEmail,
      role: "admin",
    });

    console.log(`Admin user successfully seeded with email: ${adminEmail}`);
    process.exit(0);

  } catch (error) {
    console.error(`Error seeding admin: ${error.message}`);
    process.exit(1);
  }
};

seedAdminUser();
