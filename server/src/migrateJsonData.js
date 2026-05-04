import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closeDatabaseConnection, getDatabase } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const migrationDefinitions = [
  {
    collection: "legacy_demo_users",
    relativePath: "mainfiles/data/demo_users.json",
    mode: "array",
    key: "_id",
  },
  {
    collection: "legacy_demo_requests",
    relativePath: "mainfiles/data/demo_requests.json",
    mode: "array",
    key: "_id",
  },
  {
    collection: "legacy_demo_tasks",
    relativePath: "mainfiles/data/demo_tasks.json",
    mode: "array",
    key: "_id",
  },
  {
    collection: "owner_item_drafts",
    relativePath: "mainfiles/data/demo_owner_item_update_submissions.json",
    mode: "array",
    key: "draft_id",
  },
  {
    collection: "menu_items_raw",
    relativePath: "mainfiles/data/menu_items.json",
    mode: "array",
    key: "unique_key",
  },
  {
    collection: "menu_items_imputed",
    relativePath: "mainfiles/data/menu_items_imputed.json",
    mode: "array",
    key: "unique_key",
  },
  {
    collection: "pipeline_parse_summaries",
    relativePath: "mainfiles/data/parse_summar.json",
    mode: "object",
    key: "source_file",
  },
  {
    collection: "pipeline_imputation_summaries",
    relativePath: "mainfiles/data/imputation_summar.json",
    mode: "object",
    key: "output_file",
  },
];

async function readJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function normalizeArrayDocument(document, dataset, index) {
  const candidate =
    document && typeof document === "object" ? { ...document } : { value: document };
  const keyField = dataset.key;
  const baseKey =
    typeof candidate[keyField] === "string" && candidate[keyField]
      ? candidate[keyField]
      : `${dataset.collection}-${index + 1}`;

  return {
    ...candidate,
    _migration_source_file: dataset.relativePath,
    _migration_key: baseKey,
    _migrated_at: new Date().toISOString(),
  };
}

function normalizeObjectDocument(document, dataset) {
  const candidate =
    document && typeof document === "object" ? { ...document } : { value: document };
  const keyField = dataset.key;
  const baseKey =
    typeof candidate[keyField] === "string" && candidate[keyField]
      ? candidate[keyField]
      : dataset.relativePath;

  return {
    _id: `${dataset.collection}:${baseKey}`,
    ...candidate,
    _migration_source_file: dataset.relativePath,
    _migration_key: baseKey,
    _migrated_at: new Date().toISOString(),
  };
}

async function migrateArrayDataset(db, dataset, parsed) {
  if (!Array.isArray(parsed)) {
    throw new Error(`${dataset.relativePath} is not a JSON array.`);
  }

  const collection = db.collection(dataset.collection);
  let inserted = 0;
  let updated = 0;

  for (let index = 0; index < parsed.length; index += 1) {
    const normalized = normalizeArrayDocument(parsed[index], dataset, index);
    const migrationKey = normalized._migration_key;
    const existing = await collection.findOne({ _migration_key: migrationKey });

    if (existing) {
      await collection.updateOne(
        { _id: existing._id },
        {
          $set: {
            ...normalized,
            _id: existing._id,
          },
        },
      );
      updated += 1;
      continue;
    }

    const insertDocument =
      typeof normalized._id === "string" && normalized._id
        ? normalized
        : { ...normalized, _id: `${dataset.collection}:${migrationKey}` };
    await collection.insertOne(insertDocument);
    inserted += 1;
  }

  return {
    collection: dataset.collection,
    source: dataset.relativePath,
    total: parsed.length,
    inserted,
    updated,
  };
}

async function migrateObjectDataset(db, dataset, parsed) {
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error(`${dataset.relativePath} is not a JSON object.`);
  }

  const normalized = normalizeObjectDocument(parsed, dataset);
  await db.collection(dataset.collection).updateOne(
    { _id: normalized._id },
    { $set: normalized },
    { upsert: true },
  );

  return {
    collection: dataset.collection,
    source: dataset.relativePath,
    total: 1,
    inserted: 1,
    updated: 0,
  };
}

async function migrateDataset(db, dataset) {
  const filePath = path.join(repoRoot, dataset.relativePath);
  const parsed = await readJson(filePath);

  if (dataset.mode === "array") {
    return migrateArrayDataset(db, dataset, parsed);
  }

  return migrateObjectDataset(db, dataset, parsed);
}

async function migrate() {
  try {
    const db = await getDatabase();
    if (!db) {
      throw new Error(
        "MONGODB_URI is missing. Copy server/.env.example to server/.env and fill it in first.",
      );
    }

    for (const dataset of migrationDefinitions) {
      const summary = await migrateDataset(db, dataset);
      console.log(
        `Migrated ${summary.collection} from ${summary.source}: ${summary.total} records (${summary.inserted} inserted, ${summary.updated} updated)`,
      );
    }

    console.log("JSON migration complete.");
  } finally {
    await closeDatabaseConnection();
  }
}

migrate().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
