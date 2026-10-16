const app = require("./app");
const env = require("./config/env");
const { connectDB, disconnectDB } = require("./config/db");

let server;

const startServer = async () => {
  // Connect to database first
  await connectDB();

  server = app.listen(env.PORT, () => {
    console.log(`=================================================`);
    console.log(` OceanShield Backend API Server`);
    console.log(` Environment: ${env.NODE_ENV}`);
    console.log(` Port:        ${env.PORT}`);
    console.log(` URL:         http://localhost:${env.PORT}`);
    console.log(` Health:      http://localhost:${env.PORT}/health`);
    console.log(` API Base:    http://localhost:${env.PORT}/api/v1`);
    console.log(`=================================================`);
  });
};

// Graceful Shutdown
const handleShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Commencing graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log("[Server] HTTP server closed.");
      await disconnectDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Fatal Error] Unhandled Promise Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Fatal Error] Uncaught Exception:", error);
  process.exit(1);
});

startServer();
