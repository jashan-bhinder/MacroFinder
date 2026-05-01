export function loadConfig() {
  return {
    port: Number(process.env.PORT || 4000),
    corsOrigin: process.env.CORS_ORIGIN?.trim() || "http://localhost:5173",
    mongodbUri: process.env.MONGODB_URI?.trim() || "",
    dbName: process.env.MONGODB_DB_NAME?.trim() || "macrofinder",
  };
}

export function hasDatabaseConfig() {
  return Boolean(loadConfig().mongodbUri);
}
