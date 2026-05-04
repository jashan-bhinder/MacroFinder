export function loadConfig() {
  const rawCorsOrigin = process.env.CORS_ORIGIN?.trim() || "http://localhost:5173";
  const corsOrigin =
    rawCorsOrigin === "*"
      ? "*"
      : rawCorsOrigin
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);

  return {
    port: Number(process.env.PORT || 4000),
    corsOrigin,
    mongodbUri: process.env.MONGODB_URI?.trim() || "",
    dbName: process.env.MONGODB_DB_NAME?.trim() || "macrofinder",
    disablePublicSignup: process.env.DISABLE_PUBLIC_SIGNUP === "true",
    publicDemoMode: process.env.PUBLIC_DEMO_MODE === "true",
    serveStaticFrontend: process.env.SERVE_STATIC_FRONTEND !== "false",
  };
}

export function hasDatabaseConfig() {
  return Boolean(loadConfig().mongodbUri);
}
