import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import cors from "cors";
import express from "express";
import { loadServerAppState } from "./appState.js";
import { hasDatabaseConfig, loadConfig } from "./config.js";
import {
  getDatabase,
  getUploadBucket,
  parseObjectId,
  pingDatabase,
} from "./db.js";

const app = express();
const config = loadConfig();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistDir = path.resolve(__dirname, "../../mainfiles/dist");

app.use(
  cors({
    origin: config.corsOrigin,
  }),
);
app.use(express.json({ limit: "20mb" }));

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

function nowIso() {
  return new Date().toISOString();
}

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function average(values) {
  const numbers = values.filter(
    (value) => typeof value === "number" && Number.isFinite(value),
  );

  if (numbers.length === 0) return null;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function parseNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeFilename(value, fallback = "upload.bin") {
  const normalized = String(value ?? "")
    .trim()
    .replace(/[\r\n]+/g, " ")
    .replace(/"/g, "");

  return normalized || fallback;
}

function buildFileUrls(fileId) {
  const encodedId = encodeURIComponent(String(fileId));
  return {
    file_url: `/api/files/${encodedId}`,
    download_url: `/api/files/${encodedId}?download=1`,
  };
}

function normalizeUploadedFileRecord(value) {
  if (!value || typeof value !== "object") return null;

  const candidate = value;
  const fileId = String(candidate.fileId ?? candidate.file_id ?? "").trim();
  const fileName = safeFilename(candidate.fileName ?? candidate.file_name, "");
  if (!fileId || !fileName) return null;

  const sizeBytes = Number(candidate.sizeBytes ?? candidate.size_bytes);
  const mimeType = String(candidate.mimeType ?? candidate.mime_type ?? "").trim() || null;
  const uploadedAt =
    String(candidate.uploadedAt ?? candidate.uploaded_at ?? "").trim() || nowIso();

  return {
    file_id: fileId,
    file_name: fileName,
    ...buildFileUrls(fileId),
    mime_type: mimeType,
    size_bytes: Number.isFinite(sizeBytes) ? sizeBytes : null,
    uploaded_at: uploadedAt,
  };
}

function normalizeUploadedFileMap(value) {
  if (!value || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, fileValue]) => [key, normalizeUploadedFileRecord(fileValue)])
      .filter(([, fileValue]) => Boolean(fileValue)),
  );
}

function normalizeUploadedFileArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => normalizeUploadedFileRecord(entry))
    .filter(Boolean);
}

function createRequestDocument({ type, submittedBy, data, status = "pending" }) {
  const timestamp = nowIso();
  return {
    _id: `${type}-${randomUUID()}`,
    type,
    status,
    submitted_at: timestamp,
    reviewed_at: null,
    reviewed_by: null,
    submitted_by: submittedBy,
    data,
  };
}

function jsonError(response, statusCode, message, detail) {
  response.status(statusCode).json({
    error: message,
    ...(detail ? { detail } : {}),
  });
}

async function requireDatabase(response) {
  try {
    const db = await getDatabase();
    if (!db) {
      jsonError(
        response,
        503,
        "Database not configured.",
        "Add MONGODB_URI to server/.env and run the seed script.",
      );
      return null;
    }

    return db;
  } catch (error) {
    jsonError(
      response,
      500,
      "Failed to connect to MongoDB.",
      error instanceof Error ? error.message : "Unknown error",
    );
    return null;
  }
}

async function findUserById(db, userId) {
  if (!userId) return null;
  return db.collection("users").findOne({ _id: userId });
}

async function findUserByEmail(db, email) {
  if (!email) return null;
  return db.collection("users").findOne({ email: email.trim().toLowerCase() });
}

async function requireExistingUser(response, db, userId, label = "User") {
  const user = await findUserById(db, userId);
  if (!user) {
    jsonError(response, 404, `${label} not found.`);
    return null;
  }

  return user;
}

function userHasRole(user, ...roles) {
  return Boolean(user && roles.includes(user.role));
}

async function requireUserWithRole(
  response,
  db,
  userId,
  roles,
  failureMessage,
) {
  const user = await requireExistingUser(response, db, userId);
  if (!user) return null;

  if (!userHasRole(user, ...roles)) {
    jsonError(response, 403, failureMessage);
    return null;
  }

  return user;
}

function buildManagedRestaurantRecord(restaurantName, overrides = {}) {
  const restaurantSlug = slugify(restaurantName);

  return {
    restaurant_slug: restaurantSlug,
    restaurant_name: restaurantName,
    verified: overrides.verified === true,
    status: overrides.status === "pending" ? "pending" : "active",
    franchise_type: overrides.franchise_type ?? "",
    cuisine_tags: Array.isArray(overrides.cuisine_tags) ? overrides.cuisine_tags : [],
    pdf_file: overrides.pdf_file ?? null,
    pdf_status:
      overrides.pdf_status === "approved" || overrides.pdf_status === "pending"
        ? overrides.pdf_status
        : "not_submitted",
  };
}

async function upsertManagedRestaurantForUser(
  db,
  userId,
  restaurantName,
  overrides = {},
) {
  const user = await findUserById(db, userId);
  if (!user) return;

  const nextManagedRestaurants = Array.isArray(user.managed_restaurants)
    ? [...user.managed_restaurants]
    : [];
  const restaurantSlug = slugify(restaurantName);
  const existingIndex = nextManagedRestaurants.findIndex(
    (record) => record.restaurant_slug === restaurantSlug,
  );
  const nextRecord = buildManagedRestaurantRecord(restaurantName, overrides);

  if (existingIndex >= 0) {
    nextManagedRestaurants[existingIndex] = {
      ...nextManagedRestaurants[existingIndex],
      ...nextRecord,
    };
  } else {
    nextManagedRestaurants.push(nextRecord);
  }

  await db.collection("users").updateOne(
    { _id: userId },
    {
      $set: {
        role: user.role === "admin" ? user.role : "restaurant_owner",
        managed_restaurants: nextManagedRestaurants,
        updated_at: nowIso(),
      },
    },
  );
}

async function ensureRestaurantFromCreationRequest(db, requestDocument) {
  const data = requestDocument?.data ?? {};
  const restaurantName = data.restaurant_name;
  if (!restaurantName) return;

  const restaurantSlug = slugify(restaurantName);
  const restaurantCollection = db.collection("restaurants");
  const itemCollection = db.collection("items");
  const existingRestaurant = await restaurantCollection.findOne({
    slug: restaurantSlug,
  });
  const uploadedFiles = normalizeUploadedFileMap(data.uploaded_files);
  const nutritionPdfFile = uploadedFiles.nutrition_pdf ?? null;
  const restaurantImageFile = uploadedFiles.restaurant_image ?? null;
  const menuExportFile = uploadedFiles.menu_export ?? null;

  const sampleItems = Array.isArray(data.sample_items) ? data.sample_items : [];
  const createdAt = requestDocument.submitted_at ?? nowIso();
  const categories = [
    ...new Set(
      sampleItems
        .map((sample) => String(sample?.category ?? "").trim())
        .filter(Boolean),
    ),
  ];
  const avgProtein = average(
    sampleItems.map((sample) => parseNullableNumber(sample?.protein_g)),
  );
  const avgCalories = average(
    sampleItems.map((sample) => parseNullableNumber(sample?.calories)),
  );

  const restaurantDocument = {
    name: restaurantName,
    slug: restaurantSlug,
    description:
      data.menu_note ??
      existingRestaurant?.description ??
      `Franchise-level record for ${restaurantName}.`,
    website_url: data.website_url ?? existingRestaurant?.website_url ?? null,
    menu_url: data.menu_url ?? existingRestaurant?.menu_url ?? null,
    tags: Array.isArray(existingRestaurant?.tags) ? existingRestaurant.tags : [],
    categories:
      categories.length > 0
        ? categories
        : Array.isArray(existingRestaurant?.categories)
          ? existingRestaurant.categories
          : [],
    nutrition_pdf:
      nutritionPdfFile?.file_name ??
      data.nutrition_pdf ??
      existingRestaurant?.nutrition_pdf ??
      null,
    image_url:
      restaurantImageFile?.file_url ??
      existingRestaurant?.image_url ??
      null,
    files: {
      nutrition_pdf:
        nutritionPdfFile ?? existingRestaurant?.files?.nutrition_pdf ?? null,
      restaurant_image:
        restaurantImageFile ?? existingRestaurant?.files?.restaurant_image ?? null,
      menu_export: menuExportFile ?? existingRestaurant?.files?.menu_export ?? null,
    },
    stats: {
      item_count: sampleItems.length || existingRestaurant?.stats?.item_count || 0,
      avg_protein_g: avgProtein ?? existingRestaurant?.stats?.avg_protein_g ?? null,
      avg_calories: avgCalories ?? existingRestaurant?.stats?.avg_calories ?? null,
    },
    status: "active",
    created_at: existingRestaurant?.created_at ?? createdAt,
    updated_at: nowIso(),
  };

  await restaurantCollection.updateOne(
    { slug: restaurantSlug },
    {
      $set: restaurantDocument,
      $setOnInsert: {
        _id: existingRestaurant?._id ?? `restaurant-${restaurantSlug}`,
        created_at: existingRestaurant?.created_at ?? createdAt,
      },
    },
    { upsert: true },
  );

  if (sampleItems.length === 0) return;

  const existingItems = await itemCollection
    .find({ restaurant_slug: restaurantSlug })
    .project({ name: 1 })
    .toArray();
  const existingNames = new Set(existingItems.map((item) => item.name));

  const documentsToInsert = sampleItems
    .filter((sample) => sample?.name && !existingNames.has(sample.name))
    .map((sample, index) => {
      const protein = parseNullableNumber(sample?.protein_g);
      const calories = parseNullableNumber(sample?.calories);
      const sampleImageFile = normalizeUploadedFileRecord(sample?.image_file_upload);
      const missingFields = [];
      if (protein === null) missingFields.push("protein_g");
      if (calories === null) missingFields.push("calories");
      missingFields.push("fat_g", "carbs_g", "sodium_mg", "sugar_g");

      return {
        _id: `item-${restaurantSlug}-${slugify(sample.name)}-${index + 1}`,
        restaurant_name: restaurantName,
        restaurant_slug: restaurantSlug,
        name: sample.name,
        category: sample.category ?? "Other",
        macros: {
          calories,
          protein_g: protein,
          fat_g: null,
          carbs_g: null,
          sodium_mg: null,
          sugar_g: null,
        },
        price_cad: parseNullableNumber(sample?.price),
        portion: null,
        image_url: sampleImageFile?.file_url ?? null,
        description:
          "Owner-submitted sample item pending full nutrition expansion.",
        data_quality: {
          missing_fields: [...new Set(missingFields)],
          source_pdf:
            nutritionPdfFile?.file_name ?? data.nutrition_pdf ?? null,
        },
        status: "active",
        created_at: createdAt,
        updated_at: nowIso(),
      };
    });

  if (documentsToInsert.length > 0) {
    await itemCollection.insertMany(documentsToInsert);
  }
}

async function applyApprovedChangeRequest(db, requestDocument) {
  const data = requestDocument?.data ?? {};
  const restaurantName = data.restaurant_name;
  if (!restaurantName) return;

  const restaurantSlug = slugify(restaurantName);
  const restaurantCollection = db.collection("restaurants");
  const itemCollection = db.collection("items");
  const existingRestaurant = await restaurantCollection.findOne({
    slug: restaurantSlug,
  });
  const uploadedFiles = normalizeUploadedFileMap(data.uploaded_files);
  const supportingFile =
    uploadedFiles.supporting_file ??
    uploadedFiles.restaurant_image ??
    uploadedFiles.nutrition_pdf ??
    null;
  const timestamp = nowIso();
  const description = String(data.description ?? "").trim();

  if (data.change_field === "rest_description" && description) {
    await restaurantCollection.updateOne(
      { slug: restaurantSlug },
      {
        $set: {
          description,
          updated_at: timestamp,
        },
      },
    );
    return;
  }

  if (data.change_field === "rest_pdf" && data.pdf_file) {
    await restaurantCollection.updateOne(
      { slug: restaurantSlug },
      {
        $set: {
          nutrition_pdf: supportingFile?.file_name ?? data.pdf_file,
          files: {
            ...(existingRestaurant?.files ?? {}),
            nutrition_pdf:
              supportingFile ??
              existingRestaurant?.files?.nutrition_pdf ??
              null,
          },
          updated_at: timestamp,
        },
      },
    );
    return;
  }

  if (data.change_field === "rest_image" && supportingFile?.file_url) {
    await restaurantCollection.updateOne(
      { slug: restaurantSlug },
      {
        $set: {
          image_url: supportingFile.file_url,
          files: {
            ...(existingRestaurant?.files ?? {}),
            restaurant_image: supportingFile,
          },
          updated_at: timestamp,
        },
      },
    );
    return;
  }

  if (data.change_field === "rest_url" && /^https?:\/\//i.test(description)) {
    await restaurantCollection.updateOne(
      { slug: restaurantSlug },
      {
        $set: {
          menu_url: description,
          updated_at: timestamp,
        },
      },
    );
    return;
  }

  if (
    (data.change_field === "item_nutrition" || data.change_field === "item_image") &&
    data.item_name
  ) {
    const nextFields = {
      updated_at: timestamp,
      ...(data.change_field === "item_image" && supportingFile?.file_url
        ? { image_url: supportingFile.file_url }
        : {}),
      ...(data.change_field === "item_nutrition" && supportingFile?.file_name
        ? {
            "data_quality.source_pdf": supportingFile.file_name,
          }
        : {}),
    };
    await itemCollection.updateMany(
      {
        restaurant_slug: restaurantSlug,
        name: data.item_name,
      },
      {
        $set: nextFields,
      },
    );
  }
}

function mapRequestTypeToTaskType(requestType) {
  if (String(requestType).toLowerCase().includes("image")) return "request_image";
  if (String(requestType).toLowerCase().includes("pdf")) return "request_pdf";
  if (String(requestType).toLowerCase().includes("website")) return "request_url";
  return "request_description";
}

async function buildSubmittedBy(db, userId, emailOverride) {
  const user = userId ? await findUserById(db, userId) : null;

  if (!user) {
    return {
      user: null,
      submittedBy: {
        user_id: "",
        name: "Guest",
        email: emailOverride ?? "guest@macrofinder.local",
      },
    };
  }

  return {
    user,
    submittedBy: {
      user_id: user._id,
      name: user.name,
      email: emailOverride ?? user.email,
    },
  };
}

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
  const db = await requireDatabase(response);
  if (!db) return;

  try {
    const state = await loadServerAppState(db);
    response.status(200).json(state.bootstrap);
  } catch (error) {
    jsonError(
      response,
      500,
      "Failed to load bootstrap data from MongoDB.",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});

app.get("/api/app-state", async (_request, response) => {
  const db = await requireDatabase(response);
  if (!db) return;

  try {
    const state = await loadServerAppState(db);
    response.status(200).json(state);
  } catch (error) {
    jsonError(
      response,
      500,
      "Failed to load app state from MongoDB.",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});

app.post("/api/files", async (request, response) => {
  const db = await requireDatabase(response);
  if (!db) return;

  const fileName = safeFilename(request.body?.fileName, "");
  const mimeType =
    String(request.body?.mimeType ?? "").trim() || "application/octet-stream";
  const dataBase64 = String(request.body?.dataBase64 ?? "").trim();
  const purpose = String(request.body?.purpose ?? "").trim() || null;
  const uploaderUserId =
    String(request.body?.uploaderUserId ?? "").trim() || null;

  if (!fileName || !dataBase64) {
    jsonError(response, 400, "A file name and file data are required.");
    return;
  }

  const uploaderUser = await requireExistingUser(
    response,
    db,
    uploaderUserId,
    "Uploading user",
  );
  if (!uploaderUser) return;

  let fileBuffer = null;
  try {
    fileBuffer = Buffer.from(dataBase64, "base64");
  } catch {
    jsonError(response, 400, "The uploaded file data was not valid base64.");
    return;
  }

  if (!fileBuffer?.length) {
    jsonError(response, 400, "The uploaded file was empty.");
    return;
  }

  if (fileBuffer.length > MAX_UPLOAD_BYTES) {
    jsonError(
      response,
      413,
      `Files larger than ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB are not supported in this demo.`,
    );
    return;
  }

  const bucket = await getUploadBucket();
  if (!bucket) {
    jsonError(response, 503, "Upload storage is not available.");
    return;
  }

  const uploadedAt = nowIso();

  try {
    const uploadStream = bucket.openUploadStream(fileName, {
      contentType: mimeType,
      metadata: {
        purpose,
        uploader_user_id: uploaderUserId,
        uploaded_at: uploadedAt,
      },
    });

    await new Promise((resolve, reject) => {
      uploadStream.on("finish", resolve);
      uploadStream.on("error", reject);
      uploadStream.end(fileBuffer);
    });

    const fileId = String(uploadStream.id);
    response.status(201).json({
      ok: true,
      file: {
        fileId,
        fileName,
        mimeType,
        sizeBytes: fileBuffer.length,
        uploadedAt,
        purpose,
        ...buildFileUrls(fileId),
      },
    });
  } catch (error) {
    jsonError(
      response,
      500,
      "Failed to store that file in MongoDB.",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});

app.get("/api/files/:fileId", async (request, response) => {
  const db = await requireDatabase(response);
  if (!db) return;

  const bucket = await getUploadBucket();
  if (!bucket) {
    jsonError(response, 503, "Upload storage is not available.");
    return;
  }

  const fileId = parseObjectId(request.params.fileId);
  if (!fileId) {
    jsonError(response, 400, "That file id is invalid.");
    return;
  }

  try {
    const fileDocument = await bucket.find({ _id: fileId }).next();
    if (!fileDocument) {
      jsonError(response, 404, "File not found.");
      return;
    }

    response.setHeader(
      "Content-Type",
      fileDocument.contentType || "application/octet-stream",
    );
    response.setHeader(
      "Content-Disposition",
      `${request.query.download ? "attachment" : "inline"}; filename="${safeFilename(fileDocument.filename)}"`,
    );

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on("error", (error) => {
      if (!response.headersSent) {
        jsonError(
          response,
          500,
          "Failed to read that file from MongoDB.",
          error instanceof Error ? error.message : "Unknown error",
        );
      } else {
        response.destroy(error);
      }
    });
    downloadStream.pipe(response);
  } catch (error) {
    jsonError(
      response,
      500,
      "Failed to read that file from MongoDB.",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});

app.post("/api/users", async (request, response) => {
  const db = await requireDatabase(response);
  if (!db) return;

  if (config.disablePublicSignup) {
    jsonError(
      response,
      403,
      "Public signup is disabled for this deployed demo. Use one of the demo accounts to explore the app.",
    );
    return;
  }

  const name = String(request.body?.name ?? "").trim();
  const email = String(request.body?.email ?? "").trim().toLowerCase();
  const password = String(request.body?.password ?? "");

  if (!name || !email || !password) {
    jsonError(response, 400, "Name, email, and password are required.");
    return;
  }

  const existingUser = await findUserByEmail(db, email);
  if (existingUser) {
    jsonError(response, 409, "An account with that email already exists.");
    return;
  }

  const timestamp = nowIso();
  const userDocument = {
    _id: `user-${randomUUID()}`,
    name,
    email,
    password_hash: password,
    role: "user",
    phone: null,
    saved_items: [],
    saved_restaurants: [],
    diet_preferences: [],
    managed_restaurants: [],
    permissions: [],
    created_at: timestamp,
    updated_at: timestamp,
  };

  try {
    await db.collection("users").insertOne(userDocument);
    response.status(201).json({ ok: true, user: userDocument });
  } catch (error) {
    jsonError(
      response,
      500,
      "Failed to create user.",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});

app.patch("/api/users/:userId/preferences", async (request, response) => {
  const db = await requireDatabase(response);
  if (!db) return;

  const userId = String(request.params.userId ?? "");
  const actorUserId = String(request.body?.actorUserId ?? "").trim();
  const savedItems = Array.isArray(request.body?.savedItems)
    ? request.body.savedItems.filter((value) => typeof value === "string")
    : [];
  const savedRestaurants = Array.isArray(request.body?.savedRestaurants)
    ? request.body.savedRestaurants.filter((value) => typeof value === "string")
    : [];

  if (!userId) {
    jsonError(response, 400, "A user id is required.");
    return;
  }

  if (!actorUserId) {
    jsonError(response, 400, "An authenticated user is required.");
    return;
  }

  const actorUser = await requireExistingUser(
    response,
    db,
    actorUserId,
    "Acting user",
  );
  if (!actorUser) return;

  if (actorUser._id !== userId && actorUser.role !== "admin") {
    jsonError(
      response,
      403,
      "You can only update your own saved items and restaurants.",
    );
    return;
  }

  try {
    const result = await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: {
          saved_items: savedItems,
          saved_restaurants: savedRestaurants,
          updated_at: nowIso(),
        },
      },
    );

    if (!result.matchedCount) {
      jsonError(response, 404, "User not found.");
      return;
    }

    response.status(200).json({ ok: true });
  } catch (error) {
    jsonError(
      response,
      500,
      "Failed to update saved items and restaurants.",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});

app.post("/api/requests/role-upgrade", async (request, response) => {
  const db = await requireDatabase(response);
  if (!db) return;

  const requesterUserId = String(request.body?.requesterUserId ?? "");
  const restaurantName = String(request.body?.restaurantName ?? "").trim();
  const role = String(request.body?.role ?? "Owner").trim() || "Owner";
  const businessEmail = String(request.body?.businessEmail ?? "").trim().toLowerCase();
  const note = String(request.body?.note ?? "").trim();

  if (!requesterUserId || !restaurantName || !businessEmail) {
    jsonError(
      response,
      400,
      "Requester, restaurant name, and business email are required.",
    );
    return;
  }

  const { user, submittedBy } = await buildSubmittedBy(
    db,
    requesterUserId,
    businessEmail,
  );
  if (!user) {
    jsonError(response, 404, "Requesting user not found.");
    return;
  }

  try {
    const document = createRequestDocument({
      type: "role_upgrade",
      submittedBy,
      data: {
        restaurant_name: restaurantName,
        role_claimed: role,
        note: note || null,
      },
    });

    await db.collection("requests").insertOne(document);
    response.status(201).json({ ok: true, request: document });
  } catch (error) {
    jsonError(
      response,
      500,
      "Failed to create role upgrade request.",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});

app.post("/api/requests/restaurant-creation", async (request, response) => {
  const db = await requireDatabase(response);
  if (!db) return;

  const requesterUserId = String(request.body?.requesterUserId ?? "");
  const restaurantName = String(request.body?.restaurantName ?? "").trim();
  const ownerRole = String(request.body?.ownerRole ?? "Owner").trim() || "Owner";
  const restaurantEmail = String(request.body?.restaurantEmail ?? "")
    .trim()
    .toLowerCase();
  const phone = String(request.body?.phone ?? "").trim() || null;
  const websiteUrl = String(request.body?.websiteUrl ?? "").trim() || null;
  const menuUrl = String(request.body?.menuUrl ?? "").trim() || null;
  const ownerNote = String(request.body?.ownerNote ?? "").trim() || null;
  const pdfFileName = String(request.body?.pdfFileName ?? "").trim() || null;
  const restaurantImageFileName =
    String(request.body?.restaurantImageFileName ?? "").trim() || null;
  const menuExportFileName =
    String(request.body?.menuExportFileName ?? "").trim() || null;
  const uploadedFiles = normalizeUploadedFileMap(request.body?.uploadedFiles);
  const sampleItems = Array.isArray(request.body?.sampleItems)
    ? request.body.sampleItems.map((sample) => ({
        name: String(sample?.name ?? "").trim(),
        category: String(sample?.cat ?? sample?.category ?? "Other").trim() || "Other",
        price: String(sample?.price ?? "").trim() || null,
        protein_g: parseNullableNumber(sample?.protein),
        calories: parseNullableNumber(sample?.cal),
        image_file_name:
          normalizeUploadedFileRecord(sample?.imageUpload ?? sample?.image_file_upload)
            ?.file_name ?? null,
        image_file_upload:
          normalizeUploadedFileRecord(sample?.imageUpload ?? sample?.image_file_upload) ??
          null,
      }))
    : [];

  if (!requesterUserId || !restaurantName) {
    jsonError(response, 400, "Requester and restaurant name are required.");
    return;
  }

  const { user, submittedBy } = await buildSubmittedBy(
    db,
    requesterUserId,
    restaurantEmail || undefined,
  );
  if (!user) {
    jsonError(response, 404, "Requesting user not found.");
    return;
  }

  if (!userHasRole(user, "restaurant_owner", "admin")) {
    jsonError(
      response,
      403,
      "Only restaurant owner demo accounts can submit restaurant creation requests.",
    );
    return;
  }

  try {
    const document = createRequestDocument({
      type: "restaurant_creation",
      submittedBy,
      data: {
        restaurant_name: restaurantName,
        owner_role: ownerRole,
        phone,
        website_url: websiteUrl,
        menu_url: menuUrl,
        menu_note: ownerNote,
        nutrition_pdf: uploadedFiles.nutrition_pdf?.file_name ?? pdfFileName,
        has_image: Boolean(
          request.body?.hasImage ||
            restaurantImageFileName ||
            uploadedFiles.restaurant_image,
        ),
        sample_items: sampleItems.filter((sample) => sample.name),
        restaurant_email: restaurantEmail || submittedBy.email,
        restaurant_image_file_name:
          uploadedFiles.restaurant_image?.file_name ?? restaurantImageFileName,
        menu_export_file_name:
          uploadedFiles.menu_export?.file_name ?? menuExportFileName,
        uploaded_files: uploadedFiles,
      },
    });

    await db.collection("requests").insertOne(document);
    response.status(201).json({ ok: true, request: document });
  } catch (error) {
    jsonError(
      response,
      500,
      "Failed to create restaurant request.",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});

app.post("/api/requests/change", async (request, response) => {
  const db = await requireDatabase(response);
  if (!db) return;

  const requesterUserId = String(request.body?.requesterUserId ?? "");
  const restaurantName = String(request.body?.restaurantName ?? "").trim();
  const changeField = String(request.body?.type ?? "").trim();
  const itemName = String(request.body?.itemName ?? "").trim() || null;
  const description = String(request.body?.note ?? "").trim() || null;
  const pdfFileName = String(request.body?.pdfFileName ?? "").trim() || null;
  const uploadedFiles = normalizeUploadedFileMap(request.body?.uploadedFiles);
  const supportingFile = uploadedFiles.supporting_file ?? null;

  if (!requesterUserId || !restaurantName || !changeField) {
    jsonError(
      response,
      400,
      "Requester, restaurant name, and change type are required.",
    );
    return;
  }

  const { user, submittedBy } = await buildSubmittedBy(db, requesterUserId);
  if (!user) {
    jsonError(response, 404, "Requesting user not found.");
    return;
  }

  if (!userHasRole(user, "restaurant_owner", "admin")) {
    jsonError(
      response,
      403,
      "Only restaurant owner demo accounts can submit change requests.",
    );
    return;
  }

  try {
    const document = createRequestDocument({
      type: "change_request",
      submittedBy,
      data: {
        restaurant_name: restaurantName,
        change_scope: changeField.startsWith("item_") ? "item" : "restaurant",
        change_field: changeField,
        item_name: itemName,
        description,
        pdf_file: supportingFile?.file_name ?? pdfFileName,
        uploaded_files: uploadedFiles,
      },
    });

    await db.collection("requests").insertOne(document);
    response.status(201).json({ ok: true, request: document });
  } catch (error) {
    jsonError(
      response,
      500,
      "Failed to create change request.",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});

app.post("/api/issues", async (request, response) => {
  const db = await requireDatabase(response);
  if (!db) return;

  const reporterUserId = String(request.body?.reporterUserId ?? "");
  const itemKey = String(request.body?.itemKey ?? "").trim() || null;
  const itemName = String(request.body?.itemName ?? "").trim() || null;
  const restaurantName = String(request.body?.restaurantName ?? "").trim();
  const issueType = String(request.body?.issueType ?? "").trim();
  const note = String(request.body?.note ?? "").trim() || null;

  if (!restaurantName || !issueType) {
    jsonError(response, 400, "Restaurant name and issue type are required.");
    return;
  }

  if (!reporterUserId) {
    jsonError(
      response,
      403,
      "Sign in with a demo account to submit a reported issue.",
    );
    return;
  }

  const { user, submittedBy } = await buildSubmittedBy(db, reporterUserId);
  if (!user) {
    jsonError(response, 404, "Reporting user not found.");
    return;
  }

  try {
    const document = createRequestDocument({
      type: "reported_issue",
      submittedBy,
      status: "open",
      data: {
        item_key: itemKey ?? itemName,
        restaurant_name: restaurantName,
        issue_type: issueType,
        note,
      },
    });

    await db.collection("requests").insertOne(document);
    response.status(201).json({ ok: true, request: document });
  } catch (error) {
    jsonError(
      response,
      500,
      "Failed to create reported issue.",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});

app.patch("/api/requests/:requestId/status", async (request, response) => {
  const db = await requireDatabase(response);
  if (!db) return;

  const requestId = String(request.params.requestId ?? "");
  const status = String(request.body?.status ?? "").trim();
  const reviewedByUserId = String(request.body?.reviewedByUserId ?? "").trim() || null;

  if (!requestId || !status) {
    jsonError(response, 400, "A request id and status are required.");
    return;
  }

  const actingAdmin = await requireUserWithRole(
    response,
    db,
    reviewedByUserId,
    ["admin"],
    "Only admin demo accounts can review requests.",
  );
  if (!actingAdmin) return;

  const requestDocument = await db.collection("requests").findOne({ _id: requestId });
  if (!requestDocument) {
    jsonError(response, 404, "Request not found.");
    return;
  }

  const transitioningToApproved =
    requestDocument.status !== "approved" && status === "approved";
  const reviewTimestamp =
    status === "pending" || status === "open" ? null : nowIso();

  try {
    await db.collection("requests").updateOne(
      { _id: requestId },
      {
        $set: {
          status,
          reviewed_by: reviewTimestamp ? reviewedByUserId : null,
          reviewed_at: reviewTimestamp,
        },
      },
    );

    if (transitioningToApproved && requestDocument.type === "role_upgrade") {
      await upsertManagedRestaurantForUser(
        db,
        requestDocument.submitted_by?.user_id,
        requestDocument.data?.restaurant_name,
        {
          verified: true,
          status: "active",
          pdf_status: "not_submitted",
        },
      );
    }

    if (transitioningToApproved && requestDocument.type === "restaurant_creation") {
      await ensureRestaurantFromCreationRequest(db, requestDocument);
      await upsertManagedRestaurantForUser(
        db,
        requestDocument.submitted_by?.user_id,
        requestDocument.data?.restaurant_name,
        {
          verified: true,
          status: "active",
          pdf_file: requestDocument.data?.nutrition_pdf ?? null,
          pdf_status: requestDocument.data?.nutrition_pdf ? "approved" : "not_submitted",
        },
      );
    }

    if (transitioningToApproved && requestDocument.type === "change_request") {
      await applyApprovedChangeRequest(db, requestDocument);
    }

    response.status(200).json({ ok: true });
  } catch (error) {
    jsonError(
      response,
      500,
      "Failed to update request status.",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});

app.post("/api/tasks", async (request, response) => {
  const db = await requireDatabase(response);
  if (!db) return;

  const actorUserId = String(request.body?.actorUserId ?? "").trim();
  const ownerUserId = String(request.body?.ownerUserId ?? "");
  const restaurantName = String(request.body?.restaurantName ?? "").trim();
  const itemName = String(request.body?.itemName ?? "").trim() || null;
  const requestType = String(request.body?.requestType ?? "").trim();
  const note = String(request.body?.note ?? "").trim() || "";

  if (!ownerUserId || !restaurantName || !requestType) {
    jsonError(
      response,
      400,
      "Owner, restaurant name, and request type are required.",
    );
    return;
  }

  const actingAdmin = await requireUserWithRole(
    response,
    db,
    actorUserId,
    ["admin"],
    "Only admin demo accounts can create owner tasks.",
  );
  if (!actingAdmin) return;

  const ownerUser = await findUserById(db, ownerUserId);
  if (!ownerUser || ownerUser.role !== "restaurant_owner") {
    jsonError(response, 404, "Restaurant owner account not found.");
    return;
  }

  let itemCategory = null;
  if (itemName) {
    const matchingItem = await db.collection("items").findOne({
      restaurant_name: restaurantName,
      name: itemName,
    });
    itemCategory = matchingItem?.category ?? null;
  }

  const taskDocument = {
    _id: `task-${randomUUID()}`,
    owner_id: ownerUserId,
    restaurant_name: restaurantName,
    scope: itemName ? "item" : "restaurant",
    item_name: itemName,
    item_category: itemCategory,
    task_type: mapRequestTypeToTaskType(requestType),
    description: note || requestType,
    admin_note: note || null,
    status: "pending",
    created_at: nowIso(),
  };

  try {
    await db.collection("tasks").insertOne(taskDocument);
    response.status(201).json({ ok: true, task: taskDocument });
  } catch (error) {
    jsonError(
      response,
      500,
      "Failed to create owner task.",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});

app.patch("/api/tasks/:taskId/status", async (request, response) => {
  const db = await requireDatabase(response);
  if (!db) return;

  const taskId = String(request.params.taskId ?? "");
  const actorUserId = String(request.body?.actorUserId ?? "").trim();
  const status = String(request.body?.status ?? "").trim();
  const submittedFiles = normalizeUploadedFileArray(request.body?.submittedFiles);
  const ownerSubmissionNote =
    String(request.body?.note ?? "").trim() || null;

  if (!taskId || !status) {
    jsonError(response, 400, "A task id and status are required.");
    return;
  }

  const actingUser = await requireExistingUser(
    response,
    db,
    actorUserId,
    "Acting user",
  );
  if (!actingUser) return;

  const taskDocument = await db.collection("tasks").findOne({ _id: taskId });
  if (!taskDocument) {
    jsonError(response, 404, "Task not found.");
    return;
  }

  if (actingUser.role !== "admin" && actingUser._id !== taskDocument.owner_id) {
    jsonError(
      response,
      403,
      "You can only update tasks assigned to your demo account.",
    );
    return;
  }

  try {
    const result = await db.collection("tasks").updateOne(
      { _id: taskId },
      {
        $set: {
          status,
          ...(submittedFiles.length > 0 ? { submitted_files: submittedFiles } : {}),
          ...(ownerSubmissionNote ? { owner_submission_note: ownerSubmissionNote } : {}),
          updated_at: nowIso(),
        },
      },
    );

    if (!result.matchedCount) {
      jsonError(response, 404, "Task not found.");
      return;
    }

    response.status(200).json({ ok: true });
  } catch (error) {
    jsonError(
      response,
      500,
      "Failed to update task status.",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});

if (config.serveStaticFrontend && existsSync(frontendDistDir)) {
  app.use(express.static(frontendDistDir));

  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api/")) {
      next();
      return;
    }

    response.sendFile(path.join(frontendDistDir, "index.html"));
  });
}

app.listen(config.port, () => {
  console.log(`MacroFinder API listening on http://localhost:${config.port}`);
});
