import {
  GridFSBucket,
  MongoClient,
  ObjectId,
  ServerApiVersion,
} from "mongodb";
import { loadConfig } from "./config.js";

let clientPromise = null;
let clientInstance = null;
const DEFAULT_UPLOAD_BUCKET = "uploads";

function createClient(uri) {
  clientInstance = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  return clientInstance;
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

export async function getUploadBucket(bucketName = DEFAULT_UPLOAD_BUCKET) {
  const db = await getDatabase();
  if (!db) return null;
  return new GridFSBucket(db, { bucketName });
}

export function parseObjectId(value) {
  try {
    return new ObjectId(String(value ?? ""));
  } catch {
    return null;
  }
}

export async function closeDatabaseConnection() {
  if (!clientInstance) return;
  await clientInstance.close();
  clientPromise = null;
  clientInstance = null;
}
