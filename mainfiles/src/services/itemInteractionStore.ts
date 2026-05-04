import type { ReportedIssue } from "../types/models";
import rawRequests from "../../data/requests.json";
import type { DbRequest, ReportedIssueRequestData } from "../types/models";
import {
    extractItemNameFromKey,
    resolveItemUniqueKey,
    resolveRestaurantId,
} from "./demoSchemaUtils";

const COMPARE_STORAGE_KEY = "macrofinder.demo.compare";
const REPORTS_STORAGE_KEY = "macrofinder.demo.reports";

function toReportedIssue(value: unknown): ReportedIssue | null {
    const candidate =
        value && typeof value === "object" ? (value as Partial<DbRequest>) : {};
    const data =
        candidate.data && typeof candidate.data === "object"
            ? (candidate.data as Partial<ReportedIssueRequestData>)
            : {};

    if (
        candidate.type !== "reported_issue" ||
        !candidate._id ||
        !candidate.submitted_at ||
        !data.restaurant_name ||
        !data.issue_type
    ) {
        return null;
    }

    const itemKey = resolveItemUniqueKey(data.item_key, data.restaurant_name);

    return {
        issue_id: candidate._id,
        reporter_user_id: candidate.submitted_by?.user_id ?? "",
        reporter_type: "user",
        restaurant_id: resolveRestaurantId(data.restaurant_name),
        restaurant_name: data.restaurant_name,
        item_key: itemKey,
        item_name: extractItemNameFromKey(data.item_key ?? itemKey),
        issue_type: data.issue_type,
        note: data.note ?? null,
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
            candidate.status === "resolved"
                ? "resolved"
                : candidate.reviewed_at
                    ? "in_progress"
                    : "open",
        resolution_note: null,
        resolved_by_admin_id: candidate.status === "resolved" ? candidate.reviewed_by ?? null : null,
        submitted_at: candidate.submitted_at,
        resolved_at: candidate.status === "resolved" ? candidate.reviewed_at ?? null : null,
        created_at: candidate.submitted_at,
        updated_at: candidate.reviewed_at ?? candidate.submitted_at,
    };
}

const defaultReportedIssues = (rawRequests as DbRequest[])
    .map((request) => toReportedIssue(request))
    .filter((issue): issue is ReportedIssue => issue !== null);

function normalizeStringList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is string => typeof entry === "string");
}

function isReportedIssue(value: unknown): value is ReportedIssue {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Partial<ReportedIssue>;

    return (
        typeof candidate.issue_id === "string" &&
        typeof candidate.reporter_user_id === "string" &&
        typeof candidate.reporter_type === "string" &&
        typeof candidate.restaurant_id === "string" &&
        typeof candidate.restaurant_name === "string" &&
        typeof candidate.issue_type === "string" &&
        typeof candidate.status === "string" &&
        typeof candidate.created_at === "string" &&
        typeof candidate.updated_at === "string"
    );
}

export function loadCompareItemKeys(): string[] {
    try {
        const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
        if (!raw) return [];
        return normalizeStringList(JSON.parse(raw));
    } catch {
        return [];
    }
}

export function saveCompareItemKeys(compareItemKeys: string[]): void {
    window.localStorage.setItem(
        COMPARE_STORAGE_KEY,
        JSON.stringify(compareItemKeys),
    );
}

export function loadReportedIssues(): ReportedIssue[] {
    try {
        const raw = window.localStorage.getItem(REPORTS_STORAGE_KEY);
        if (!raw) return defaultReportedIssues;
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return defaultReportedIssues;
        const storedIssues = parsed.filter(isReportedIssue);
        const storedIssueIds = new Set(storedIssues.map((issue) => issue.issue_id));
        const missingDefaultIssues = defaultReportedIssues.filter(
            (issue) => !storedIssueIds.has(issue.issue_id),
        );
        return [...storedIssues, ...missingDefaultIssues];
    } catch {
        return defaultReportedIssues;
    }
}

export function saveReportedIssues(reportedIssues: ReportedIssue[]): void {
    window.localStorage.setItem(
        REPORTS_STORAGE_KEY,
        JSON.stringify(reportedIssues),
    );
}
