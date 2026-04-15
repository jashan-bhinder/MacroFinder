import rawDemoRequests from "../../data/demo_requests.json";
import type { DbRequest, RoleUpgradeRequestData } from "../types/models";

export interface DemoAccessRequestRecord {
    requestId?: string;
    requesterUserId: string;
    restaurantName: string;
    role: string;
    businessEmail: string;
    websiteUrl: string;
    note: string;
    submittedAt: string;
    status?: "pending_review" | "approved" | "denied" | "needs_changes";
    adminNotes?: string | null;
    reviewedAt?: string | null;
    reviewedByAdminId?: string | null;
}

const STORAGE_KEY = "macrofinder.demo.accessRequests";

function normalizeRequestStatus(
    value: unknown,
): DemoAccessRequestRecord["status"] {
    if (value === "approved" || value === "denied" || value === "needs_changes") {
        return value;
    }
    return "pending_review";
}

function toDemoAccessRequestRecord(value: unknown): DemoAccessRequestRecord | null {
    const candidate =
        value && typeof value === "object" ? (value as Partial<DbRequest>) : {};
    const data =
        candidate.data && typeof candidate.data === "object"
            ? (candidate.data as Partial<RoleUpgradeRequestData>)
            : {};

    if (candidate.type !== "role_upgrade" || !candidate._id || !candidate.submitted_at) {
        return null;
    }

    return {
        requestId: candidate._id,
        requesterUserId: candidate.submitted_by?.user_id ?? "",
        restaurantName: data.restaurant_name ?? "",
        role: data.role_claimed ?? "",
        businessEmail: candidate.submitted_by?.email ?? "",
        websiteUrl: "",
        note: data.note ?? "",
        submittedAt: candidate.submitted_at,
        status: normalizeRequestStatus(candidate.status),
        adminNotes: null,
        reviewedAt: candidate.reviewed_at ?? null,
        reviewedByAdminId: candidate.reviewed_by ?? null,
    };
}

const defaultDemoAccessRequests = (rawDemoRequests as DbRequest[])
    .map((request) => toDemoAccessRequestRecord(request))
    .filter((request): request is DemoAccessRequestRecord => request !== null);

function accessRequestKey(request: DemoAccessRequestRecord): string {
    return request.requestId ?? `${request.requesterUserId}:${request.submittedAt}`;
}

function isDemoAccessRequestRecord(value: unknown): value is DemoAccessRequestRecord {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Partial<DemoAccessRequestRecord>;

    return (
        typeof candidate.requesterUserId === "string" &&
        typeof candidate.restaurantName === "string" &&
        typeof candidate.role === "string" &&
        typeof candidate.businessEmail === "string" &&
        typeof candidate.websiteUrl === "string" &&
        typeof candidate.note === "string" &&
        typeof candidate.submittedAt === "string"
    );
}

export function loadDemoAccessRequests(): DemoAccessRequestRecord[] {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultDemoAccessRequests;
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return defaultDemoAccessRequests;
        const storedRequests = parsed.filter(isDemoAccessRequestRecord);
        const storedKeys = new Set(storedRequests.map(accessRequestKey));
        const missingDefaultRequests = defaultDemoAccessRequests.filter(
            (request) => !storedKeys.has(accessRequestKey(request)),
        );
        return [...storedRequests, ...missingDefaultRequests];
    } catch {
        return defaultDemoAccessRequests;
    }
}

export function saveDemoAccessRequests(
    accessRequests: DemoAccessRequestRecord[],
): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accessRequests));
}
