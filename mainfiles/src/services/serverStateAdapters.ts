import type {
  DatabaseItem,
  DatabaseRequest,
  DatabaseRestaurant,
  DatabaseUser,
  DbTask,
  ReportedIssue,
} from "../types/models";
import { extractItemNameFromKey, resolveItemUniqueKey, resolveRestaurantId } from "./demoSchemaUtils";
import { createOwnerUploadedFile, type OwnerRestaurantChangeRequest, type OwnerRestaurantRequestDraft, type OwnerTask } from "./ownerWorkflowStore";
import type { DemoAccessRequestRecord } from "./accessRequestStore";
import type { DemoLoginProfile } from "./profileStore";
import { dbUserToAdminProfile, dbUserToOwnerProfile, dbUserToUserProfile } from "./schemaAdapters";

function normalizeRequestStatus(
  value: unknown,
): DemoAccessRequestRecord["status"] {
  if (value === "approved" || value === "denied" || value === "needs_changes") {
    return value;
  }
  return "pending_review";
}

function normalizeUploadedFileRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function toOwnerUploadedFile(
  value: unknown,
  fileType: "nutrition_pdf" | "restaurant_image" | "menu_export" | "item_image" | "supporting_document",
  fallbackFileName?: string | null,
  fallbackMimeType: string | null = null,
) {
  const record = normalizeUploadedFileRecord(value);

  if (!record?.file_id || !record?.file_name) {
    return createOwnerUploadedFile(fallbackFileName ?? null, fileType, fallbackMimeType);
  }

  return {
    file_id: String(record.file_id),
    file_name: String(record.file_name),
    file_type: fileType,
    mime_type: record.mime_type ? String(record.mime_type) : fallbackMimeType,
    storage_path: record.download_url ? String(record.download_url) : null,
    local_preview_url: record.file_url ? String(record.file_url) : null,
    uploaded_at: record.uploaded_at ? String(record.uploaded_at) : new Date().toISOString(),
  };
}

function toDemoAccessRequestRecord(
  request: DatabaseRequest,
): DemoAccessRequestRecord | null {
  const data =
    request.type === "role_upgrade" && request.data && typeof request.data === "object"
      ? (request.data as Record<string, unknown>)
      : null;

  if (request.type !== "role_upgrade" || !data) {
    return null;
  }

  return {
    requestId: request._id,
    requesterUserId: request.submitted_by?.user_id ?? "",
    restaurantName: String(data.restaurant_name ?? ""),
    role: String(data.role_claimed ?? ""),
    businessEmail: request.submitted_by?.email ?? "",
    websiteUrl: "",
    note: String(data.note ?? ""),
    submittedAt: request.submitted_at,
    status: normalizeRequestStatus(request.status),
    adminNotes: null,
    reviewedAt: request.reviewed_at ?? null,
    reviewedByAdminId: request.reviewed_by ?? null,
  };
}

function toReportedIssue(request: DatabaseRequest): ReportedIssue | null {
  const data =
    request.type === "reported_issue" && request.data && typeof request.data === "object"
      ? (request.data as Record<string, unknown>)
      : null;

  if (
    request.type !== "reported_issue" ||
    !data ||
    !data.restaurant_name ||
    !data.issue_type
  ) {
    return null;
  }

  const itemKey = resolveItemUniqueKey(
    String(data.item_key ?? ""),
    String(data.restaurant_name),
  );

  return {
    issue_id: request._id,
    reporter_user_id: request.submitted_by?.user_id ?? "",
    reporter_type: "user",
    restaurant_id: resolveRestaurantId(String(data.restaurant_name)),
    restaurant_name: String(data.restaurant_name),
    item_key: itemKey,
    item_name: extractItemNameFromKey(String(data.item_key ?? itemKey)),
    issue_type: String(data.issue_type),
    note: data.note ? String(data.note) : null,
    attachment: {
      file_name: null,
      file_url: null,
      file_type: null,
    },
    listing_snapshot: {
      shown_price_cad: null,
      shown_category: null,
      last_updated_at: null,
      source_url: null,
    },
    status:
      request.status === "resolved"
        ? "resolved"
        : request.reviewed_at
          ? "in_progress"
          : "open",
    resolution_note: null,
    resolved_by_admin_id: request.status === "resolved" ? request.reviewed_by ?? null : null,
    submitted_at: request.submitted_at,
    resolved_at: request.status === "resolved" ? request.reviewed_at ?? null : null,
    created_at: request.submitted_at,
    updated_at: request.reviewed_at ?? request.submitted_at,
  };
}

function deriveOwnerProfileId(ownerId: string, restaurantName: string): string {
  const restaurantSlug = resolveRestaurantId(restaurantName) || ownerId;
  return `owner-profile-${restaurantSlug}-demo`;
}

function mapDbTaskTypeToOwnerTaskType(taskType: string): OwnerTask["task_type"] {
  if (taskType === "request_pdf") return "pdf_review";
  if (taskType === "request_image") return "photo_review";
  return "item_details";
}

function mapDbTaskPriority(taskType: string): OwnerTask["priority"] {
  if (taskType === "request_pdf") return "high";
  if (taskType === "request_image") return "low";
  return "medium";
}

function mapDbTaskMissingFields(taskType: string): string[] {
  if (taskType === "request_pdf") return ["pdf"];
  if (taskType === "request_image") return ["image"];
  if (taskType === "request_url") return ["url"];
  return ["description"];
}

function buildOwnerTaskTitle(task: OwnerTaskSource): string {
  if (task.scope === "item" && task.item_name) {
    if (task.task_type === "request_image") return `Upload a photo for ${task.item_name}`;
    if (task.task_type === "request_pdf") return `Verify nutrition support for ${task.item_name}`;
    if (task.task_type === "request_url") return `Share the official link for ${task.item_name}`;
    return `Add item details for ${task.item_name}`;
  }

  if (task.task_type === "request_pdf") {
    return `Upload the latest nutrition PDF for ${task.restaurant_name}`;
  }
  if (task.task_type === "request_image") {
    return `Upload a restaurant image for ${task.restaurant_name}`;
  }
  if (task.task_type === "request_url") {
    return `Share the official menu URL for ${task.restaurant_name}`;
  }
  return `Update restaurant details for ${task.restaurant_name}`;
}

type OwnerTaskSource = {
  _id: string;
  owner_id: string;
  restaurant_name: string;
  scope: "restaurant" | "item";
  item_name: string | null;
  item_category: string | null;
  task_type: string;
};

function mapDbTaskToOwnerTask(value: unknown): OwnerTask | null {
  const candidate =
    value && typeof value === "object" ? (value as Record<string, unknown>) : null;

  if (!candidate?._id || !candidate.owner_id || !candidate.restaurant_name) {
    return null;
  }

  const restaurantName = String(candidate.restaurant_name);
  const itemName = candidate.item_name ? String(candidate.item_name) : null;
  const taskType = String(candidate.task_type ?? "request_description");
  const itemKey =
    candidate.scope === "item" && itemName
      ? resolveItemUniqueKey(null, restaurantName, itemName)
      : null;

  return {
    task_id: String(candidate._id),
    owner_profile_id: deriveOwnerProfileId(String(candidate.owner_id), restaurantName),
    restaurant_id: resolveRestaurantId(restaurantName),
    restaurant_name: restaurantName,
    task_type: mapDbTaskTypeToOwnerTaskType(taskType),
    title: buildOwnerTaskTitle({
      _id: String(candidate._id),
      owner_id: String(candidate.owner_id),
      restaurant_name: restaurantName,
      scope: candidate.scope === "item" ? "item" : "restaurant",
      item_name: itemName,
      item_category: candidate.item_category ? String(candidate.item_category) : null,
      task_type: taskType,
    }),
    summary: String(candidate.description ?? ""),
    status:
      candidate.status === "completed"
        ? "completed"
        : candidate.status === "submitted"
          ? "submitted_for_admin_review"
          : "needs_owner_input",
    priority: mapDbTaskPriority(taskType),
    source_label: itemName ?? restaurantName,
    item_keys: itemKey ? [itemKey] : [],
    missing_fields: mapDbTaskMissingFields(taskType),
    admin_note: String(candidate.admin_note ?? ""),
    created_at: String(candidate.created_at ?? new Date().toISOString()),
    updated_at: String(
      candidate.updated_at ?? candidate.created_at ?? new Date().toISOString(),
    ),
  };
}

function mapRequestStatusToOwnerReviewStatus(
  status: DatabaseRequest["status"] | undefined,
): OwnerRestaurantRequestDraft["review"]["status"] {
  if (status === "approved") return "approved";
  if (status === "denied") return "rejected";
  return "pending_admin_review";
}

function mapRequestStatusToChangeReviewStatus(
  status: DatabaseRequest["status"] | undefined,
): OwnerRestaurantChangeRequest["review"]["status"] {
  if (status === "approved") return "approved";
  if (status === "denied") return "denied";
  return "pending_admin_review";
}

function mapDbRequestToOwnerRestaurantRequest(
  request: DatabaseRequest,
): OwnerRestaurantRequestDraft | null {
  const data =
    request.type === "restaurant_creation" && request.data && typeof request.data === "object"
      ? (request.data as Record<string, unknown>)
      : null;

  if (request.type !== "restaurant_creation" || !data?.restaurant_name) {
    return null;
  }

  const ownerId = request.submitted_by?.user_id ?? "";
  const restaurantName = String(data.restaurant_name);
  const uploadedFiles =
    data.uploaded_files && typeof data.uploaded_files === "object"
      ? (data.uploaded_files as Record<string, unknown>)
      : {};

  return {
    _id: request._id,
    request_id: request._id,
    owner_profile_id: deriveOwnerProfileId(ownerId, restaurantName),
    requester_user_id: ownerId,
    restaurant: {
      restaurant_id: null,
      restaurant_name: restaurantName,
      franchise_key: resolveRestaurantId(restaurantName),
      website_url: String(data.website_url ?? ""),
      menu_url: String(data.menu_url ?? ""),
      owner_note: String(data.menu_note ?? ""),
    },
    contact: {
      owner_full_name: request.submitted_by?.name ?? "",
      owner_role: String(data.owner_role ?? ""),
      restaurant_email: String(data.restaurant_email ?? request.submitted_by?.email ?? ""),
      owner_phone: String(data.phone ?? ""),
    },
    files: {
      nutrition_pdf: toOwnerUploadedFile(
        uploadedFiles.nutrition_pdf,
        "nutrition_pdf",
        data.nutrition_pdf ? String(data.nutrition_pdf) : null,
        "application/pdf",
      ),
      restaurant_image: toOwnerUploadedFile(
        uploadedFiles.restaurant_image,
        "restaurant_image",
        data.restaurant_image_file_name
          ? String(data.restaurant_image_file_name)
          : null,
        "image/jpeg",
      ),
      menu_export: toOwnerUploadedFile(
        uploadedFiles.menu_export,
        "menu_export",
        data.menu_export_file_name ? String(data.menu_export_file_name) : null,
        null,
      ),
    },
    sample_items: Array.isArray(data.sample_items)
      ? data.sample_items.map((sample) => ({
          item_name: String(sample?.name ?? ""),
          category: String(sample?.category ?? "Other"),
          price_cad:
            sample?.price !== null && sample?.price !== undefined && sample?.price !== ""
              ? Number(sample.price)
              : null,
          protein_g:
            sample?.protein_g !== null && sample?.protein_g !== undefined
              ? Number(sample.protein_g)
              : null,
          calories:
            sample?.calories !== null && sample?.calories !== undefined
              ? Number(sample.calories)
              : null,
          sodium_mg: null,
          files: {
            item_image: toOwnerUploadedFile(
              sample?.image_file_upload,
              "item_image",
              sample?.image_file_name ? String(sample.image_file_name) : null,
              "image/jpeg",
            ),
          },
        }))
      : [],
    checklist: {
      official_source_confirmed: true,
      review_before_launch_acknowledged: true,
    },
    review: {
      status: mapRequestStatusToOwnerReviewStatus(request.status),
      admin_notes: null,
      reviewed_by_admin_id: request.reviewed_by ?? null,
      reviewed_at: request.reviewed_at ?? null,
    },
    submitted_at: request.submitted_at,
    created_at: request.submitted_at,
    updated_at: request.reviewed_at ?? request.submitted_at,
  };
}

function mapDbRequestToOwnerRestaurantChangeRequest(
  request: DatabaseRequest,
): OwnerRestaurantChangeRequest | null {
  const data =
    request.type === "change_request" && request.data && typeof request.data === "object"
      ? (request.data as Record<string, unknown>)
      : null;

  if (request.type !== "change_request" || !data?.restaurant_name) {
    return null;
  }

  const ownerId = request.submitted_by?.user_id ?? "";
  const restaurantName = String(data.restaurant_name);
  const uploadedFiles =
    data.uploaded_files && typeof data.uploaded_files === "object"
      ? (data.uploaded_files as Record<string, unknown>)
      : {};
  const description =
    data.change_field === "rest_description" ? String(data.description ?? "") : null;

  return {
    _id: request._id,
    request_id: request._id,
    owner_profile_id: deriveOwnerProfileId(ownerId, restaurantName),
    requester_user_id: ownerId,
    restaurant_id: resolveRestaurantId(restaurantName),
    restaurant_name: restaurantName,
    request_type: "restaurant_profile_update",
    requested_changes: {
      description,
      image_url: null,
    },
    owner_note: String(data.description ?? ""),
    files: {
      restaurant_image: toOwnerUploadedFile(
        uploadedFiles.supporting_file,
        "restaurant_image",
        data.pdf_file ? String(data.pdf_file) : null,
        "application/pdf",
      ),
    },
    review: {
      status: mapRequestStatusToChangeReviewStatus(request.status),
      admin_notes: null,
      reviewed_by_admin_id: request.reviewed_by ?? null,
      reviewed_at: request.reviewed_at ?? null,
    },
    submitted_at: request.submitted_at,
    created_at: request.submitted_at,
    updated_at: request.reviewed_at ?? request.submitted_at,
  };
}

export interface RemoteAppStateSlices {
  loginProfiles: DemoLoginProfile[];
  ownerProfiles: NonNullable<ReturnType<typeof dbUserToOwnerProfile>>[];
  adminProfiles: NonNullable<ReturnType<typeof dbUserToAdminProfile>>[];
  accessRequests: DemoAccessRequestRecord[];
  restaurantRequests: OwnerRestaurantRequestDraft[];
  changeRequests: OwnerRestaurantChangeRequest[];
  reportedIssues: ReportedIssue[];
  ownerTasks: OwnerTask[];
}

export function adaptRemoteAppState(payload: {
  users: DatabaseUser[];
  requests: DatabaseRequest[];
  tasks: DbTask[];
  items: DatabaseItem[];
  restaurants: DatabaseRestaurant[];
}): RemoteAppStateSlices {
  const loginProfiles = payload.users.map((user) => ({
    email: user.email,
    password: user.password_hash ?? "",
    profile: dbUserToUserProfile(user, payload.items, payload.restaurants),
  }));

  return {
    loginProfiles,
    ownerProfiles: payload.users
      .map((user) => dbUserToOwnerProfile(user))
      .filter((profile): profile is NonNullable<ReturnType<typeof dbUserToOwnerProfile>> => Boolean(profile)),
    adminProfiles: payload.users
      .map((user) => dbUserToAdminProfile(user))
      .filter((profile): profile is NonNullable<ReturnType<typeof dbUserToAdminProfile>> => Boolean(profile)),
    accessRequests: payload.requests
      .map((request) => toDemoAccessRequestRecord(request))
      .filter((request): request is DemoAccessRequestRecord => Boolean(request)),
    restaurantRequests: payload.requests
      .map((request) => mapDbRequestToOwnerRestaurantRequest(request))
      .filter((request): request is OwnerRestaurantRequestDraft => Boolean(request)),
    changeRequests: payload.requests
      .map((request) => mapDbRequestToOwnerRestaurantChangeRequest(request))
      .filter((request): request is OwnerRestaurantChangeRequest => Boolean(request)),
    reportedIssues: payload.requests
      .map((request) => toReportedIssue(request))
      .filter((issue): issue is ReportedIssue => Boolean(issue)),
    ownerTasks: payload.tasks
      .map((task) => mapDbTaskToOwnerTask(task))
      .filter((task): task is OwnerTask => Boolean(task)),
  };
}
