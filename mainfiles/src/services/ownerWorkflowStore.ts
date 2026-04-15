import rawDemoRequests from "../../data/demo_requests.json";
import rawDemoTasks from "../../data/demo_tasks.json";
import rawOwnerItemDrafts from "../../data/demo_owner_item_update_submissions.json";
import type {
    ChangeRequestData,
    DbRequest,
    DbTask,
    RestaurantCreationRequestData,
} from "../types/models";
import {
    resolveItemUniqueKey,
    resolveRestaurantId,
    slugifyIdentifier,
} from "./demoSchemaUtils";

export type OwnerTaskType = "item_details" | "pdf_review" | "photo_review";
export type OwnerTaskStatus =
    | "queued"
    | "needs_owner_input"
    | "submitted_for_admin_review"
    | "completed";
export type OwnerTaskPriority = "low" | "medium" | "high";
export type OwnerUploadedFileType =
    | "nutrition_pdf"
    | "restaurant_image"
    | "menu_export"
    | "item_image"
    | "supporting_document";

export interface OwnerUploadedFile {
    file_id: string;
    file_name: string;
    file_type: OwnerUploadedFileType;
    mime_type: string | null;
    storage_path: string | null;
    local_preview_url: string | null;
    uploaded_at: string;
}

export interface OwnerTask {
    task_id: string;
    owner_profile_id: string;
    restaurant_id: string;
    restaurant_name: string;
    task_type: OwnerTaskType;
    title: string;
    summary: string;
    status: OwnerTaskStatus;
    priority: OwnerTaskPriority;
    source_label: string;
    item_keys: string[];
    missing_fields: string[];
    admin_note: string;
    created_at: string;
    updated_at: string;
}

export interface OwnerItemDraft {
    _id: string;
    draft_id: string;
    task_id: string;
    owner_profile_id: string | null;
    restaurant_id: string | null;
    item_key: string;
    item_name: string;
    summary: string;
    category: string;
    image_url: string;
    tags: string;
    diet_tags: string;
    files: {
        item_image: OwnerUploadedFile | null;
    };
    status: "draft" | "submitted_for_admin_review";
    review: {
        admin_notes: string | null;
        reviewed_by_admin_id: string | null;
        reviewed_at: string | null;
    };
    owner_note: string;
    created_at: string;
    updated_at: string;
}

export interface OwnerRestaurantRequestSampleItem {
    item_name: string;
    category: string;
    price_cad: number | null;
    protein_g: number | null;
    calories: number | null;
    sodium_mg: number | null;
    files: {
        item_image: OwnerUploadedFile | null;
    };
}

export interface OwnerRestaurantRequestDraft {
    _id: string;
    request_id: string;
    owner_profile_id: string;
    requester_user_id: string;
    restaurant: {
        restaurant_id: string | null;
        restaurant_name: string;
        franchise_key: string;
        website_url: string;
        menu_url: string;
        owner_note: string;
    };
    contact: {
        owner_full_name: string;
        owner_role: string;
        restaurant_email: string;
        owner_phone: string;
    };
    files: {
        nutrition_pdf: OwnerUploadedFile | null;
        restaurant_image: OwnerUploadedFile | null;
        menu_export: OwnerUploadedFile | null;
    };
    sample_items: OwnerRestaurantRequestSampleItem[];
    checklist: {
        official_source_confirmed: boolean;
        review_before_launch_acknowledged: boolean;
    };
    review: {
        status: "pending_admin_review" | "needs_changes" | "approved" | "rejected";
        admin_notes: string | null;
        reviewed_by_admin_id: string | null;
        reviewed_at: string | null;
    };
    submitted_at: string;
    created_at: string;
    updated_at: string;
}

export interface OwnerRestaurantChangeRequest {
    _id: string;
    request_id: string;
    owner_profile_id: string;
    requester_user_id: string;
    restaurant_id: string;
    restaurant_name: string;
    request_type: "restaurant_profile_update";
    requested_changes: {
        description: string | null;
        image_url: string | null;
    };
    owner_note: string;
    files: {
        restaurant_image: OwnerUploadedFile | null;
    };
    review: {
        status: "pending_admin_review" | "approved" | "denied" | "needs_changes";
        admin_notes: string | null;
        reviewed_by_admin_id: string | null;
        reviewed_at: string | null;
    };
    submitted_at: string;
    created_at: string;
    updated_at: string;
}

const OWNER_TASKS_STORAGE_KEY = "macrofinder.demo.owner.tasks";
const OWNER_ITEM_DRAFTS_STORAGE_KEY = "macrofinder.demo.owner.item_drafts";
const OWNER_RESTAURANT_CHANGE_REQUESTS_STORAGE_KEY =
    "macrofinder.demo.owner.restaurant_change_requests";
const OWNER_RESTAURANT_REQUESTS_STORAGE_KEY =
    "macrofinder.demo.owner.restaurant_requests";

function normalizeSlug(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function deriveOwnerProfileId(ownerId: string, restaurantName: string): string {
    const restaurantSlug = resolveRestaurantId(restaurantName) || slugifyIdentifier(ownerId);
    return `owner-profile-${restaurantSlug}-demo`;
}

function mapDbTaskTypeToOwnerTaskType(taskType: DbTask["task_type"]): OwnerTaskType {
    if (taskType === "request_pdf") return "pdf_review";
    if (taskType === "request_image") return "photo_review";
    return "item_details";
}

function mapDbTaskPriority(taskType: DbTask["task_type"]): OwnerTaskPriority {
    if (taskType === "request_pdf") return "high";
    if (taskType === "request_image") return "low";
    return "medium";
}

function mapDbTaskMissingFields(taskType: DbTask["task_type"]): string[] {
    if (taskType === "request_pdf") return ["pdf"];
    if (taskType === "request_image") return ["image"];
    if (taskType === "request_url") return ["url"];
    return ["description"];
}

function buildOwnerTaskTitle(task: DbTask): string {
    if (task.scope === "item" && task.item_name) {
        if (task.task_type === "request_image") {
            return `Upload a photo for ${task.item_name}`;
        }
        if (task.task_type === "request_pdf") {
            return `Verify nutrition support for ${task.item_name}`;
        }
        if (task.task_type === "request_url") {
            return `Share the official link for ${task.item_name}`;
        }
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

function mapDbTaskToOwnerTask(value: unknown): OwnerTask | null {
    const candidate =
        value && typeof value === "object" ? (value as Partial<DbTask>) : {};

    if (!candidate._id || !candidate.owner_id || !candidate.restaurant_name) {
        return null;
    }

    const itemKey =
        candidate.scope === "item" && candidate.item_name
            ? resolveItemUniqueKey(null, candidate.restaurant_name, candidate.item_name)
            : null;

    return {
        task_id: candidate._id,
        owner_profile_id: deriveOwnerProfileId(
            candidate.owner_id,
            candidate.restaurant_name,
        ),
        restaurant_id: resolveRestaurantId(candidate.restaurant_name),
        restaurant_name: candidate.restaurant_name,
        task_type: mapDbTaskTypeToOwnerTaskType(
            candidate.task_type ?? "request_description",
        ),
        title: buildOwnerTaskTitle({
            _id: candidate._id,
            owner_id: candidate.owner_id,
            restaurant_name: candidate.restaurant_name,
            scope: candidate.scope === "item" ? "item" : "restaurant",
            item_name: candidate.item_name ?? null,
            item_category: candidate.item_category ?? null,
            task_type: candidate.task_type ?? "request_description",
            description: candidate.description ?? "",
            admin_note: candidate.admin_note ?? null,
            status: candidate.status ?? "pending",
            created_at: candidate.created_at ?? new Date().toISOString(),
        }),
        summary: candidate.description ?? "",
        status: candidate.status === "completed" ? "completed" : "needs_owner_input",
        priority: mapDbTaskPriority(candidate.task_type ?? "request_description"),
        source_label: candidate.item_category ?? candidate.restaurant_name,
        item_keys: itemKey ? [itemKey] : [],
        missing_fields: mapDbTaskMissingFields(
            candidate.task_type ?? "request_description",
        ),
        admin_note: candidate.admin_note ?? "",
        created_at: candidate.created_at ?? new Date().toISOString(),
        updated_at: candidate.created_at ?? new Date().toISOString(),
    };
}

function mapRequestStatusToOwnerReviewStatus(
    status: DbRequest["status"] | undefined,
): OwnerRestaurantRequestDraft["review"]["status"] {
    if (status === "approved") return "approved";
    if (status === "denied") return "rejected";
    return "pending_admin_review";
}

function mapRequestStatusToChangeReviewStatus(
    status: DbRequest["status"] | undefined,
): OwnerRestaurantChangeRequest["review"]["status"] {
    if (status === "approved") return "approved";
    if (status === "denied") return "denied";
    return "pending_admin_review";
}

function mapDbRequestToOwnerRestaurantRequest(
    value: unknown,
): OwnerRestaurantRequestDraft | null {
    const candidate =
        value && typeof value === "object" ? (value as Partial<DbRequest>) : {};
    const data =
        candidate.data && typeof candidate.data === "object"
            ? (candidate.data as Partial<RestaurantCreationRequestData>)
            : {};

    if (
        candidate.type !== "restaurant_creation" ||
        !candidate._id ||
        !candidate.submitted_at ||
        !data.restaurant_name
    ) {
        return null;
    }

    const ownerId = candidate.submitted_by?.user_id ?? "";
    const restaurantName = data.restaurant_name;

    return {
        _id: candidate._id,
        request_id: candidate._id,
        owner_profile_id: deriveOwnerProfileId(ownerId, restaurantName),
        requester_user_id: ownerId,
        restaurant: {
            restaurant_id: null,
            restaurant_name: restaurantName,
            franchise_key: resolveRestaurantId(restaurantName),
            website_url: data.website_url ?? "",
            menu_url: data.menu_url ?? "",
            owner_note: data.menu_note ?? "",
        },
        contact: {
            owner_full_name: candidate.submitted_by?.name ?? "",
            owner_role: data.owner_role ?? "",
            restaurant_email: candidate.submitted_by?.email ?? "",
            owner_phone: data.phone ?? "",
        },
        files: {
            nutrition_pdf: createOwnerUploadedFile(
                data.nutrition_pdf,
                "nutrition_pdf",
                "application/pdf",
            ),
            restaurant_image: null,
            menu_export: null,
        },
        sample_items: (data.sample_items ?? []).map((sample) => ({
            item_name: sample.name ?? "",
            category: sample.category ?? "",
            price_cad: parseNullableNumber(sample.price),
            protein_g: parseNullableNumber(sample.protein_g),
            calories: parseNullableNumber(sample.calories),
            sodium_mg: null,
            files: {
                item_image: null,
            },
        })),
        checklist: {
            official_source_confirmed: true,
            review_before_launch_acknowledged: true,
        },
        review: {
            status: mapRequestStatusToOwnerReviewStatus(candidate.status),
            admin_notes: null,
            reviewed_by_admin_id: candidate.reviewed_by ?? null,
            reviewed_at: candidate.reviewed_at ?? null,
        },
        submitted_at: candidate.submitted_at,
        created_at: candidate.submitted_at,
        updated_at: candidate.reviewed_at ?? candidate.submitted_at,
    };
}

function mapDbRequestToOwnerRestaurantChangeRequest(
    value: unknown,
): OwnerRestaurantChangeRequest | null {
    const candidate =
        value && typeof value === "object" ? (value as Partial<DbRequest>) : {};
    const data =
        candidate.data && typeof candidate.data === "object"
            ? (candidate.data as Partial<ChangeRequestData>)
            : {};

    if (
        candidate.type !== "change_request" ||
        !candidate._id ||
        !candidate.submitted_at ||
        !data.restaurant_name
    ) {
        return null;
    }

    const ownerId = candidate.submitted_by?.user_id ?? "";
    const description =
        data.change_field === "rest_description" ? data.description ?? null : null;

    return {
        _id: candidate._id,
        request_id: candidate._id,
        owner_profile_id: deriveOwnerProfileId(ownerId, data.restaurant_name),
        requester_user_id: ownerId,
        restaurant_id: resolveRestaurantId(data.restaurant_name),
        restaurant_name: data.restaurant_name,
        request_type: "restaurant_profile_update",
        requested_changes: {
            description,
            image_url: null,
        },
        owner_note: data.description ?? "",
        files: {
            restaurant_image: createOwnerUploadedFile(
                data.pdf_file,
                "restaurant_image",
                "application/pdf",
            ),
        },
        review: {
            status: mapRequestStatusToChangeReviewStatus(candidate.status),
            admin_notes: null,
            reviewed_by_admin_id: candidate.reviewed_by ?? null,
            reviewed_at: candidate.reviewed_at ?? null,
        },
        submitted_at: candidate.submitted_at,
        created_at: candidate.submitted_at,
        updated_at: candidate.reviewed_at ?? candidate.submitted_at,
    };
}

const defaultOwnerTasks = (rawDemoTasks as DbTask[])
    .map((task) => mapDbTaskToOwnerTask(task))
    .filter((task): task is OwnerTask => task !== null);
const defaultOwnerItemDrafts = rawOwnerItemDrafts as OwnerItemDraft[];
const defaultOwnerRestaurantChangeRequests = (rawDemoRequests as DbRequest[])
    .map((request) => mapDbRequestToOwnerRestaurantChangeRequest(request))
    .filter((request): request is OwnerRestaurantChangeRequest => request !== null);
const defaultOwnerRestaurantRequests = (rawDemoRequests as DbRequest[])
    .map((request) => mapDbRequestToOwnerRestaurantRequest(request))
    .filter((request): request is OwnerRestaurantRequestDraft => request !== null);

export function createOwnerUploadedFile(
    fileName: string | null | undefined,
    fileType: OwnerUploadedFileType,
    mimeType: string | null = null,
): OwnerUploadedFile | null {
    if (!fileName) return null;

    const uploadedAt = new Date().toISOString();
    const slug = normalizeSlug(fileName) || "file";

    return {
        file_id: `${fileType}-${Date.now()}-${slug}`,
        file_name: fileName,
        file_type: fileType,
        mime_type: mimeType,
        storage_path: null,
        local_preview_url: null,
        uploaded_at: uploadedAt,
    };
}

function normalizeStringList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is string => typeof entry === "string");
}

function parseNullableNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "string" || !value.trim()) return null;
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeOwnerUploadedFile(
    value: unknown,
    fallbackFileName: string | null | undefined,
    fallbackFileType: OwnerUploadedFileType,
): OwnerUploadedFile | null {
    if (!value || typeof value !== "object") {
        return createOwnerUploadedFile(fallbackFileName, fallbackFileType);
    }

    const candidate = value as Partial<OwnerUploadedFile>;
    if (!candidate.file_name) {
        return createOwnerUploadedFile(fallbackFileName, fallbackFileType);
    }

    return {
        file_id:
            candidate.file_id ??
            `${fallbackFileType}-${Date.now()}-${normalizeSlug(candidate.file_name) || "file"}`,
        file_name: candidate.file_name,
        file_type: candidate.file_type ?? fallbackFileType,
        mime_type: candidate.mime_type ?? null,
        storage_path: candidate.storage_path ?? null,
        local_preview_url: candidate.local_preview_url ?? null,
        uploaded_at: candidate.uploaded_at ?? new Date().toISOString(),
    };
}

function normalizeOwnerTask(value: unknown): OwnerTask | null {
    const candidate = value && typeof value === "object" ? (value as Partial<OwnerTask>) : {};

    if (
        !candidate.task_id ||
        !candidate.owner_profile_id ||
        !candidate.restaurant_id ||
        !candidate.restaurant_name ||
        !candidate.title
    ) {
        return null;
    }

    return {
        task_id: candidate.task_id,
        owner_profile_id: candidate.owner_profile_id,
        restaurant_id: candidate.restaurant_id,
        restaurant_name: candidate.restaurant_name,
        task_type:
            candidate.task_type === "pdf_review" || candidate.task_type === "photo_review"
                ? candidate.task_type
                : "item_details",
        title: candidate.title,
        summary: candidate.summary ?? "",
        status:
            candidate.status === "queued" ||
            candidate.status === "submitted_for_admin_review" ||
            candidate.status === "completed"
                ? candidate.status
                : "needs_owner_input",
        priority:
            candidate.priority === "low" || candidate.priority === "high"
                ? candidate.priority
                : "medium",
        source_label: candidate.source_label ?? "Owner request",
        item_keys: normalizeStringList(candidate.item_keys),
        missing_fields: normalizeStringList(candidate.missing_fields),
        admin_note: candidate.admin_note ?? "",
        created_at: candidate.created_at ?? new Date().toISOString(),
        updated_at: candidate.updated_at ?? new Date().toISOString(),
    };
}

function parseStoredArray<T>(
    storageKey: string,
    fallback: T[],
    normalize: (value: unknown) => T | null,
    getKey?: (value: T) => string,
): T[] {
    try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return fallback;
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return fallback;
        const normalized = parsed
            .map(normalize)
            .filter((entry): entry is T => entry !== null);

        if (!getKey) return normalized;

        const storedKeys = new Set(normalized.map(getKey));
        const missingFallbackEntries = fallback.filter(
            (entry) => !storedKeys.has(getKey(entry)),
        );
        return [...normalized, ...missingFallbackEntries];
    } catch {
        return fallback;
    }
}

export function loadOwnerTasks(): OwnerTask[] {
    return parseStoredArray(
        OWNER_TASKS_STORAGE_KEY,
        defaultOwnerTasks,
        normalizeOwnerTask,
        (task) => task.task_id,
    );
}

export function saveOwnerTasks(tasks: OwnerTask[]): void {
    window.localStorage.setItem(OWNER_TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

export function loadOwnerItemDrafts(): OwnerItemDraft[] {
    return parseStoredArray(
        OWNER_ITEM_DRAFTS_STORAGE_KEY,
        defaultOwnerItemDrafts,
        (value): OwnerItemDraft | null => {
            const candidate =
                value && typeof value === "object" ? (value as Partial<OwnerItemDraft>) : {};
            if (!candidate.task_id || !candidate.item_key || !candidate.item_name) {
                return null;
            }
            const draftId = candidate.draft_id ?? `${candidate.task_id}-${candidate.item_key}`;
            const now = new Date().toISOString();
            return {
                _id: candidate._id ?? draftId,
                draft_id: draftId,
                task_id: candidate.task_id,
                owner_profile_id: candidate.owner_profile_id ?? null,
                restaurant_id: candidate.restaurant_id ?? null,
                item_key: candidate.item_key,
                item_name: candidate.item_name,
                summary: candidate.summary ?? "",
                category: candidate.category ?? "",
                image_url: candidate.image_url ?? "",
                tags: candidate.tags ?? "",
                diet_tags: candidate.diet_tags ?? "",
                files: {
                    item_image: normalizeOwnerUploadedFile(
                        candidate.files?.item_image,
                        null,
                        "item_image",
                    ),
                },
                status:
                    candidate.status === "submitted_for_admin_review"
                        ? "submitted_for_admin_review"
                        : "draft",
                review: {
                    admin_notes: candidate.review?.admin_notes ?? null,
                    reviewed_by_admin_id: candidate.review?.reviewed_by_admin_id ?? null,
                    reviewed_at: candidate.review?.reviewed_at ?? null,
                },
                owner_note: candidate.owner_note ?? "",
                created_at: candidate.created_at ?? now,
                updated_at: candidate.updated_at ?? now,
            };
        },
        (draft) => draft.draft_id,
    );
}

export function saveOwnerItemDrafts(drafts: OwnerItemDraft[]): void {
    window.localStorage.setItem(
        OWNER_ITEM_DRAFTS_STORAGE_KEY,
        JSON.stringify(drafts),
    );
}

export function loadOwnerRestaurantChangeRequests(): OwnerRestaurantChangeRequest[] {
    return parseStoredArray(
        OWNER_RESTAURANT_CHANGE_REQUESTS_STORAGE_KEY,
        defaultOwnerRestaurantChangeRequests,
        (value): OwnerRestaurantChangeRequest | null => {
            const candidate =
                value && typeof value === "object"
                    ? (value as Partial<OwnerRestaurantChangeRequest>)
                    : {};
            if (
                !candidate.request_id ||
                !candidate.owner_profile_id ||
                !candidate.requester_user_id ||
                !candidate.restaurant_id ||
                !candidate.restaurant_name
            ) {
                return null;
            }

            const now = new Date().toISOString();

            return {
                _id: candidate._id ?? candidate.request_id,
                request_id: candidate.request_id,
                owner_profile_id: candidate.owner_profile_id,
                requester_user_id: candidate.requester_user_id,
                restaurant_id: candidate.restaurant_id,
                restaurant_name: candidate.restaurant_name,
                request_type: "restaurant_profile_update",
                requested_changes: {
                    description: candidate.requested_changes?.description ?? null,
                    image_url: candidate.requested_changes?.image_url ?? null,
                },
                owner_note: candidate.owner_note ?? "",
                files: {
                    restaurant_image: normalizeOwnerUploadedFile(
                        candidate.files?.restaurant_image,
                        null,
                        "restaurant_image",
                    ),
                },
                review: {
                    status: candidate.review?.status ?? "pending_admin_review",
                    admin_notes: candidate.review?.admin_notes ?? null,
                    reviewed_by_admin_id: candidate.review?.reviewed_by_admin_id ?? null,
                    reviewed_at: candidate.review?.reviewed_at ?? null,
                },
                submitted_at: candidate.submitted_at ?? now,
                created_at: candidate.created_at ?? now,
                updated_at: candidate.updated_at ?? now,
            };
        },
        (request) => request.request_id,
    );
}

export function saveOwnerRestaurantChangeRequests(
    requests: OwnerRestaurantChangeRequest[],
): void {
    window.localStorage.setItem(
        OWNER_RESTAURANT_CHANGE_REQUESTS_STORAGE_KEY,
        JSON.stringify(requests),
    );
}

export function loadOwnerRestaurantRequests(): OwnerRestaurantRequestDraft[] {
    return parseStoredArray(
        OWNER_RESTAURANT_REQUESTS_STORAGE_KEY,
        defaultOwnerRestaurantRequests,
        (value): OwnerRestaurantRequestDraft | null => {
            const candidateBase =
                value && typeof value === "object"
                    ? (value as Partial<OwnerRestaurantRequestDraft>)
                    : {};
            const legacy = candidateBase as Partial<OwnerRestaurantRequestDraft> & {
                restaurant_name?: string;
                owner_full_name?: string;
                owner_role?: string;
                restaurant_email?: string;
                owner_phone?: string;
                website_url?: string;
                menu_url?: string;
                owner_note?: string;
                nutrition_pdf_file_name?: string | null;
                restaurant_image_file_name?: string | null;
                menu_export_file_name?: string | null;
                status?: OwnerRestaurantRequestDraft["review"]["status"];
            };
            const restaurantName =
                legacy.restaurant?.restaurant_name ?? legacy.restaurant_name ?? "";
            if (
                !legacy.request_id ||
                !legacy.owner_profile_id ||
                !restaurantName
            ) {
                return null;
            }

            const now = new Date().toISOString();
            const requestId = legacy.request_id;
            const franchiseKey =
                legacy.restaurant?.franchise_key ?? normalizeSlug(restaurantName);
            return {
                _id: legacy._id ?? requestId,
                request_id: requestId,
                owner_profile_id: legacy.owner_profile_id,
                requester_user_id: legacy.requester_user_id ?? "",
                restaurant: {
                    restaurant_id: legacy.restaurant?.restaurant_id ?? null,
                    restaurant_name: restaurantName,
                    franchise_key: franchiseKey,
                    website_url: legacy.restaurant?.website_url ?? legacy.website_url ?? "",
                    menu_url: legacy.restaurant?.menu_url ?? legacy.menu_url ?? "",
                    owner_note: legacy.restaurant?.owner_note ?? legacy.owner_note ?? "",
                },
                contact: {
                    owner_full_name:
                        legacy.contact?.owner_full_name ?? legacy.owner_full_name ?? "",
                    owner_role: legacy.contact?.owner_role ?? legacy.owner_role ?? "",
                    restaurant_email:
                        legacy.contact?.restaurant_email ?? legacy.restaurant_email ?? "",
                    owner_phone: legacy.contact?.owner_phone ?? legacy.owner_phone ?? "",
                },
                files: {
                    nutrition_pdf: normalizeOwnerUploadedFile(
                        legacy.files?.nutrition_pdf,
                        legacy.nutrition_pdf_file_name,
                        "nutrition_pdf",
                    ),
                    restaurant_image: normalizeOwnerUploadedFile(
                        legacy.files?.restaurant_image,
                        legacy.restaurant_image_file_name,
                        "restaurant_image",
                    ),
                    menu_export: normalizeOwnerUploadedFile(
                        legacy.files?.menu_export,
                        legacy.menu_export_file_name,
                        "menu_export",
                    ),
                },
                sample_items: (legacy.sample_items ?? []).map((sample) => {
                    const legacySample = sample as OwnerRestaurantRequestSampleItem & {
                        image_file_name?: string | null;
                    };
                    return {
                        item_name: legacySample.item_name ?? "",
                        category: legacySample.category ?? "",
                        price_cad: parseNullableNumber(legacySample.price_cad),
                        protein_g: parseNullableNumber(legacySample.protein_g),
                        calories: parseNullableNumber(legacySample.calories),
                        sodium_mg: parseNullableNumber(legacySample.sodium_mg),
                        files: {
                            item_image: normalizeOwnerUploadedFile(
                                legacySample.files?.item_image,
                                legacySample.image_file_name,
                                "item_image",
                            ),
                        },
                    };
                }),
                checklist: {
                    official_source_confirmed:
                        legacy.checklist?.official_source_confirmed ?? true,
                    review_before_launch_acknowledged:
                        legacy.checklist?.review_before_launch_acknowledged ?? true,
                },
                review: {
                    status: legacy.review?.status ?? legacy.status ?? "pending_admin_review",
                    admin_notes: legacy.review?.admin_notes ?? null,
                    reviewed_by_admin_id: legacy.review?.reviewed_by_admin_id ?? null,
                    reviewed_at: legacy.review?.reviewed_at ?? null,
                },
                submitted_at: legacy.submitted_at ?? now,
                created_at: legacy.created_at ?? now,
                updated_at: legacy.updated_at ?? now,
            };
        },
        (request) => request.request_id,
    );
}

export function saveOwnerRestaurantRequests(
    requests: OwnerRestaurantRequestDraft[],
): void {
    window.localStorage.setItem(
        OWNER_RESTAURANT_REQUESTS_STORAGE_KEY,
        JSON.stringify(requests),
    );
}
