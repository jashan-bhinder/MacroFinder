import "dotenv/config";
import cors from "cors";
import express from "express";
import { buildBootstrapData } from "./bootstrapData.js";
import { hasDatabaseConfig, loadConfig } from "./config.js";
import { getDatabase, pingDatabase } from "./db.js";

const app = express();
const config = loadConfig();

app.use(
  cors({
    origin: config.corsOrigin,
  }),
);
app.use(express.json());

app.get("/api/health", async (_request, response) => {
  if (!hasDatabaseConfig()) {
    response.status(200).json({
      ok: false,
      databaseConfigured: false,
      message: "Set MONGODB_URI and MONGODB_DB_NAME to enable MongoDB.",
    });
    return;
  }

  try {
    await pingDatabase();
    response.status(200).json({
      ok: true,
      databaseConfigured: true,
      message: "MongoDB connection is healthy.",
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      databaseConfigured: true,
      message: "MongoDB is configured but the connection failed.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/bootstrap", async (_request, response) => {
  try {
    const db = await getDatabase();
    if (!db) {
      response.status(503).json({
        error: "Database not configured.",
        hint: "Add MONGODB_URI to server/.env and run the seed script.",
      });
      return;
    }

    const [databaseItems, databaseRestaurants] = await Promise.all([
      db.collection("items").find({}).toArray(),
      db.collection("restaurants").find({}).toArray(),
    ]);

    response.status(200).json(
      buildBootstrapData(databaseItems, databaseRestaurants),
    );
  } catch (error) {
    response.status(500).json({
      error: "Failed to load bootstrap data from MongoDB.",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(config.port, () => {
  console.log(
    `MacroFinder API listening on http://localhost:${config.port}`,
  );
});
