const mongoose = require("mongoose");
const env = require("./env");

/**
 * Connect to MongoDB with sensible timeouts and retry configuration.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: env.isDevelopment // auto-build indexes in development, handled manually or on startup in prod
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Event listeners
    mongoose.connection.on("error", (err) => {
      console.error(`[Database Error] MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[Database Warning] MongoDB disconnected. Attempting reconnection...");
    });

    return conn;
  } catch (error) {
    console.error(`[Database Error] Initial MongoDB connection failed: ${error.message}`);
    // In production we exit if the database is unreachable at launch
    if (env.isProduction) {
      process.exit(1);
    }
    return null;
  }
};

/**
 * Gracefully close the database connection.
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("[Database] MongoDB connection closed peacefully.");
  } catch (error) {
    console.error(`[Database Error] Error during MongoDB disconnection: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
