import rawUsers from "../../data/users.json";
import type {
    AdminProfile,
    DbUser,
    ManagedRestaurantRecord,
    RestaurantOwnerProfile,
    UserProfile,
} from "../types/models";
import {
    resolveItemUniqueKey,
    resolveSavedRestaurantIds,
    slugifyIdentifier,
} from "./demoSchemaUtils";

export interface DemoSession {
    logged_in: boolean;
    requested_owner_access: boolean;
    user: UserProfile;
}

export interface DemoLoginProfile {
    email: string;
    password: string;
    profile: UserProfile;
}

const DEFAULT_ADMIN_PERMISSIONS = [
    "review_restaurant_requests",
    "review_owner_submissions",
    "review_reported_issues",
    "manage_restaurants",
    "manage_menu_items",
];

const STORAGE_KEY = "macrofinder.demo.session";
const now = new Date().toISOString();

export const defaultDemoSession: DemoSession = {
    logged_in: false,
    requested_owner_access: false,
    user: {
        user_id: "demo-user-1",
        full_name: "Presentation User",
        email: "demo@macrofinder.ca",
        password_hash: null,
        account_type: "user",
        saved_item_keys: [],
        saved_restaurant_ids: [],
        restaurant_access_request_ids: [],
        status: "active",
        created_at: now,
        updated_at: now,
    },
};

function normalizeStringList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is string => typeof entry === "string");
}

function normalizeManagedRestaurants(value: unknown): ManagedRestaurantRecord[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((entry) => {
            const candidate =
                entry && typeof entry === "object"
                    ? (entry as Partial<ManagedRestaurantRecord>)
                    : null;
            if (!candidate?.restaurant_slug || !candidate.restaurant_name) {
                return null;
            }

            return {
                restaurant_slug: candidate.restaurant_slug,
                restaurant_name: candidate.restaurant_name,
                verified: candidate.verified === true,
                status: candidate.status === "active" ? "active" : "pending",
                franchise_type: candidate.franchise_type ?? "",
                cuisine_tags: normalizeStringList(candidate.cuisine_tags),
                pdf_file: candidate.pdf_file ?? null,
                pdf_status:
                    candidate.pdf_status === "approved" ||
                    candidate.pdf_status === "pending"
                        ? candidate.pdf_status
                        : "not_submitted",
            };
        })
        .filter((entry): entry is ManagedRestaurantRecord => entry !== null);
}

function normalizeAccountType(value: unknown): UserProfile["account_type"] {
    if (value === "restaurant_owner" || value === "admin") return value;
    return "user";
}

function normalizeDbUser(value: unknown): DbUser {
    const nowIso = new Date().toISOString();
    const candidate = value && typeof value === "object" ? (value as Partial<DbUser>) : {};
    const email = candidate.email ?? "";
    const fallbackId =
        candidate._id ?? slugifyIdentifier(email || candidate.name || "demo-user");

    return {
        _id: fallbackId,
        name: candidate.name ?? candidate.email ?? "Demo User",
        email,
        password_hash:
            typeof candidate.password_hash === "string" ? candidate.password_hash : null,
        role: normalizeAccountType(candidate.role),
        phone: candidate.phone ?? null,
        saved_items: normalizeStringList(candidate.saved_items),
        saved_restaurants: normalizeStringList(candidate.saved_restaurants),
        diet_preferences: normalizeStringList(candidate.diet_preferences),
        managed_restaurants: normalizeManagedRestaurants(candidate.managed_restaurants),
        permissions: normalizeStringList(candidate.permissions),
        created_at: candidate.created_at ?? nowIso,
        updated_at: candidate.updated_at ?? nowIso,
    };
}

function deriveOwnerProfileId(user: DbUser): string {
    const primaryRestaurantSlug =
        user.managed_restaurants[0]?.restaurant_slug || slugifyIdentifier(user.name) || user._id;
    return `owner-profile-${primaryRestaurantSlug}-demo`;
}

function toUserProfile(user: DbUser): UserProfile {
    return {
        user_id: user._id,
        full_name: user.name,
        email: user.email,
        password_hash: null,
        account_type: user.role,
        saved_item_keys: normalizeStringList(
            user.saved_items
                .map((value) => resolveItemUniqueKey(value))
                .filter((value): value is string => Boolean(value)),
        ),
        saved_restaurant_ids: resolveSavedRestaurantIds(user.saved_restaurants),
        restaurant_access_request_ids: [],
        status: "active",
        created_at: user.created_at,
        updated_at: user.updated_at,
    };
}

function toRestaurantOwnerProfile(user: DbUser): RestaurantOwnerProfile | null {
    if (user.role !== "restaurant_owner") return null;

    const hasActiveRestaurant = user.managed_restaurants.some(
        (restaurant) => restaurant.status === "active",
    );
    const hasVerifiedRestaurant = user.managed_restaurants.some(
        (restaurant) => restaurant.verified,
    );

    return {
        owner_profile_id: deriveOwnerProfileId(user),
        user_id: user._id,
        display_name: user.name,
        role_title: "Restaurant Owner",
        business_email: user.email,
        phone: user.phone,
        managed_restaurant_ids: user.managed_restaurants.map(
            (restaurant) => restaurant.restaurant_slug,
        ),
        verification_status: hasVerifiedRestaurant ? "verified" : "pending",
        access_status: hasActiveRestaurant ? "approved" : "pending_review",
        created_at: user.created_at,
        updated_at: user.updated_at,
    };
}

function toAdminProfile(user: DbUser): AdminProfile | null {
    if (user.role !== "admin") return null;

    return {
        admin_profile_id: `admin-profile-${slugifyIdentifier(user._id) || "demo"}`,
        user_id: user._id,
        display_name: user.name,
        email: user.email,
        permissions:
            user.permissions.length > 0 ? user.permissions : DEFAULT_ADMIN_PERMISSIONS,
        status: "active",
        created_at: user.created_at,
        updated_at: user.updated_at,
    };
}

function normalizeUserProfile(value: unknown): UserProfile {
    const candidate =
        value && typeof value === "object"
            ? (value as Partial<UserProfile> & Partial<DbUser>)
            : {};

    if (!candidate.user_id && candidate._id) {
        return toUserProfile(normalizeDbUser(candidate));
    }

    return {
        ...defaultDemoSession.user,
        ...candidate,
        password_hash: null,
        account_type: normalizeAccountType(candidate.account_type),
        saved_item_keys: normalizeStringList(candidate.saved_item_keys),
        saved_restaurant_ids: normalizeStringList(candidate.saved_restaurant_ids),
        restaurant_access_request_ids: normalizeStringList(
            candidate.restaurant_access_request_ids,
        ),
        status: candidate.status === "disabled" ? "disabled" : "active",
    };
}

const demoUsers = (rawUsers as DbUser[]).map((record) => normalizeDbUser(record));
const demoLoginProfiles = demoUsers.map((user) => ({
    email: user.email,
    password: user.password_hash ?? "",
    profile: toUserProfile(user),
}));
const demoRestaurantOwnerProfiles = demoUsers
    .map((user) => toRestaurantOwnerProfile(user))
    .filter((profile): profile is RestaurantOwnerProfile => profile !== null);
const demoAdminProfiles = demoUsers
    .map((user) => toAdminProfile(user))
    .filter((profile): profile is AdminProfile => profile !== null);

export function findDemoLoginProfile(email: string): DemoLoginProfile | null {
    const normalizedEmail = email.trim().toLowerCase();
    return (
        demoLoginProfiles.find(
            (record) => record.email.trim().toLowerCase() === normalizedEmail,
        ) ?? null
    );
}

export function getDemoLoginProfiles(): DemoLoginProfile[] {
    return demoLoginProfiles.map((record) => ({
        ...record,
        profile: normalizeUserProfile(record.profile),
    }));
}

export function getDemoRestaurantOwnerProfiles(): RestaurantOwnerProfile[] {
    return demoRestaurantOwnerProfiles.map((profile) => ({
        ...profile,
        managed_restaurant_ids: [...profile.managed_restaurant_ids],
    }));
}

export function getDemoAdminProfiles(): AdminProfile[] {
    return demoAdminProfiles.map((profile) => ({
        ...profile,
        permissions: [...profile.permissions],
    }));
}

export function loadDemoSession(): DemoSession {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultDemoSession;
        const rawParsed: unknown = JSON.parse(raw);
        const parsed =
            rawParsed && typeof rawParsed === "object"
                ? (rawParsed as Partial<DemoSession>)
                : {};

        return {
            ...defaultDemoSession,
            ...parsed,
            logged_in: parsed.logged_in === true,
            requested_owner_access: parsed.requested_owner_access === true,
            user: normalizeUserProfile(parsed.user),
        };
    } catch {
        return defaultDemoSession;
    }
}

export function saveDemoSession(session: DemoSession): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}
