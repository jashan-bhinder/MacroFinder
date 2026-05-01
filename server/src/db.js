import { MongoClient, ServerApiVersion } from "mongodb";
import { loadConfig } from "./config.js";

let clientPromise = null;

function createClient(uri) {
  return new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
}

export async function getDatabase() {
  const { mongodbUri, dbName } = loadConfig();
  if (!mongodbUri) return null;

  if (!clientPromise) {
    clientPromise = createClient(mongodbUri).connect();
  }

  const client = await clientPromise;
  return client.db(dbName);
}

export async function pingDatabase() {
  const db = await getDatabase();
  if (!db) return false;
  await db.command({ ping: 1 });
  return true;
}
