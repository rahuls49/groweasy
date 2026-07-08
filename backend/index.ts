import { env } from "./src/config/env.js";
import app from "./src/app.js";

const server = app.listen(env.PORT, () => {
  console.log(`🚀 GrowEasy backend running on http://localhost:${env.PORT}`);
  console.log(`   Environment : ${env.NODE_ENV}`);
  console.log(`   AI batch size: ${env.AI_BATCH_SIZE} rows`);
  console.log(`   CORS origin : ${env.CORS_ORIGIN}`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));