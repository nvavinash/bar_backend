const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // timeout faster
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.error(`\n⚠️  [WARNING] MongoDB Connection Failed: ${error.message}`);
    console.error(`[TIP] Make sure MongoDB is running on port 27017, or update MONGO_URI in .env`);
    console.error(`[INFO] Server will still start - fallback admin auth is enabled.\n`);
    // Do NOT call process.exit() - let server continue
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
