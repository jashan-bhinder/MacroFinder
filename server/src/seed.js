import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDatabase } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const datasetDefinitions = [
  { collection: "restaurants", relativePath: "mainfiles/data/restaurants.json" },
  { collection: "items", relativePath: "mainfiles/data/items.json" },
  { collection: "users", relativePath: "mainfiles/data/users.json" },
  { collection: "requests", relativePath: "mainfiles/data/requests.json" },
  { collection: "tasks", relativePath: "mainfiles/data/tasks.json" },
];

async function readJsonArray(filePath) {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`${filePath} does not contain a JSON array.`);
  }
  return parsed;
}

async function replaceCollection(db, collectionName, documents) {
  const collection = db.collection(collectionName);
  await collection.deleteMany({});

  if (documents.length > 0) {
    await collection.insertMany(documents, { ordered: false });
  }
}

async function createIndexes(db) {
  await db.collection("restaurants").createIndex({ slug: 1 }, { unique: true });
  await db
    .collection("items")
    .createIndex({ restaurant_slug: 1, name: 1, portion: 1 });
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("requests").createIndex({ type: 1, status: 1 });
  await db.collection("tasks").createIndex({ owner_id: 1, restaurant_name: 1 });
}

async function seed() {
  const db = await getDatabase();
  if (!db) {
    throw new Error(
      "MONGODB_URI is missing. Copy server/.env.example to server/.env and fill it in first.",
    );
  }

  for (const dataset of datasetDefinitions) {
    const filePath = path.join(repoRoot, dataset.relativePath);
    const documents = await readJsonArray(filePath);
    await replaceCollection(db, dataset.collection, documents);
    console.log(`Seeded ${dataset.collection}: ${documents.length} documents`);
  }

  await createIndexes(db);
  console.log("MongoDB seed complete.");
}

seed().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
