import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const DATA_DIR = new URL("../data/", import.meta.url);
const NOW = "2026-04-10T00:00:00.000Z";

const pdfByRestaurantSlug = {
    "a-and-w": "aw_nutrition.pdf",
    "chucks-roadhouse": "chucks_roadhouse_nutrition.pdf",
    "jugo-juice": "jugo_juice_nutrition.pdf",
    moxies: "moxies_ca_nutrition.pdf",
    noodlebox: "noodlebox_nutrition.pdf",
    "old-spaghetti-factory": "old_spaghetti_factory_nutrition.pdf",
    subway: "Subway.pdf",
    "triple-os": "triple_os_nutrition.pdf",
};

function readJson(fileName) {
    return JSON.parse(readFileSync(new URL(fileName, DATA_DIR), "utf8"));
}

function writeJson(fileName, value) {
    writeFileSync(
        new URL(fileName, DATA_DIR),
        `${JSON.stringify(value, null, 2)}\n`,
    );
}

function slugify(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function sourcePdfFromItem(item) {
    if (pdfByRestaurantSlug[item.restaurant_id]) {
        return pdfByRestaurantSlug[item.restaurant_id];
    }

    if (item.source_url) {
        return basename(item.source_url);
    }

    return null;
}

function average(values) {
    const numericValues = values.filter(
        (value) => typeof value === "number" && Number.isFinite(value),
    );
    if (numericValues.length === 0) return null;
    return Math.round(
        (numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length) *
        10,
    ) / 10;
}

function ik(item) {
    return `${item.restaurant_name}::${item.item_name}`;
}

function itemId(item, seenIds) {
    const baseId = `item_${slugify(item.restaurant_id)}_${slugify(item.item_name)}`;
    if (!seenIds.has(baseId)) {
        seenIds.add(baseId);
        return baseId;
    }

    const withPortion = `${baseId}_${slugify(item.portion || item.unique_key)}`;
    if (!seenIds.has(withPortion)) {
        seenIds.add(withPortion);
        return withPortion;
    }

    let suffix = 2;
    let nextId = `${withPortion}_${suffix}`;
    while (seenIds.has(nextId)) {
        suffix += 1;
        nextId = `${withPortion}_${suffix}`;
    }
    seenIds.add(nextId);
    return nextId;
}

const oldItems = readJson("menu_items_imputed.json");
const oldUsers = readJson("demo_user_profiles.json");
const oldOwnerProfiles = readJson("demo_restaurant_owner_profiles.json");
const oldAdminProfiles = readJson("demo_admin_profiles.json");
const oldRoleRequests = readJson("demo_access_requests.json");
const oldRestaurantRequests = readJson("demo_owner_restaurant_requests.json");
const oldRestaurantChangeRequests = readJson(
    "demo_owner_restaurant_change_requests.json",
);
const oldReportedIssues = readJson("demo_reported_issues.json");
const oldTasks = readJson("demo_owner_tasks.json");

const seenItemIds = new Set();
const items = oldItems.map((item) => ({
    _id: itemId(item, seenItemIds),
    restaurant_name: item.restaurant_name,
    restaurant_slug: item.restaurant_id,
    name: item.item_name,
    category: item.category,
    macros: {
        calories: item.macros.calories ?? null,
        protein_g: item.macros.protein_g ?? null,
        fat_g: item.macros.fat_g ?? null,
        carbs_g: item.macros.carbs_g ?? null,
        sodium_mg: item.macros.sodium_mg ?? null,
        sugar_g: item.macros.sugar_g ?? null,
    },
    price_cad: item.price_cad ?? null,
    portion: item.portion ?? null,
    image_url: item.image_url ?? null,
    description: item.summary ?? null,
    data_quality: {
        missing_fields: item.data_quality?.missing_fields ?? [],
        source_pdf: sourcePdfFromItem(item),
    },
    status: item.availability_status ?? "active",
    created_at: item.scraped_at ?? NOW,
    updated_at: item.updated_at ?? item.scraped_at ?? NOW,
}));

const oldItemsByUniqueKey = new Map(
    oldItems.map((item) => [item.unique_key, item]),
);
const restaurantNameBySlug = new Map(
    oldItems.map((item) => [item.restaurant_id, item.restaurant_name]),
);
const restaurantSlugByName = new Map(
    oldItems.map((item) => [item.restaurant_name, item.restaurant_id]),
);
const canonicalItemsByNameKey = new Map(items.map((item) => [ik({
    restaurant_name: item.restaurant_name,
    item_name: item.name,
}), item]));
const canonicalItemByOldUniqueKey = new Map(
    oldItems.map((item) => [
        item.unique_key,
        canonicalItemsByNameKey.get(ik(item)) ?? null,
    ]),
);

const restaurantGroups = new Map();
for (const item of items) {
    const existing = restaurantGroups.get(item.restaurant_slug) ?? [];
    existing.push(item);
    restaurantGroups.set(item.restaurant_slug, existing);
}

const restaurants = [...restaurantGroups.entries()]
    .map(([slug, restaurantItems]) => {
        const name = restaurantItems[0].restaurant_name;
        const categories = [...new Set(restaurantItems.map((item) => item.category))];
        const heroItem = [...restaurantItems].sort(
            (left, right) =>
                (right.macros.protein_g ?? 0) / Math.max(right.price_cad ?? 0.1, 0.1) -
                (left.macros.protein_g ?? 0) / Math.max(left.price_cad ?? 0.1, 0.1),
        )[0];

        return {
            _id: `rest_${slug}`,
            name,
            slug,
            description: `Franchise-level record for ${name}, with ${restaurantItems.length} tracked items across ${categories.slice(0, 5).join(", ")}.`,
            website_url: null,
            menu_url: null,
            tags: [...new Set(oldItems.filter((item) => item.restaurant_id === slug).flatMap((item) => item.tags ?? []))].slice(0, 6),
            categories,
            nutrition_pdf: pdfByRestaurantSlug[slug] ?? null,
            image_url: heroItem?.image_url ?? null,
            stats: {
                item_count: restaurantItems.length,
                avg_protein_g: average(restaurantItems.map((item) => item.macros.protein_g)),
                avg_calories: average(restaurantItems.map((item) => item.macros.calories)),
            },
            status: "active",
            created_at: NOW,
            updated_at: NOW,
        };
    })
    .sort((left, right) => right.stats.item_count - left.stats.item_count);

const ownerProfileByUserId = new Map(
    oldOwnerProfiles.map((profile) => [profile.user_id, profile]),
);
const adminProfileByUserId = new Map(
    oldAdminProfiles.map((profile) => [profile.user_id, profile]),
);

function savedItemKey(oldKey) {
    const oldItem = oldItemsByUniqueKey.get(oldKey);
    if (oldItem) return ik(oldItem);
    return oldKey.includes("::") ? oldKey : oldKey.replaceAll("|", "::");
}

function savedRestaurantName(oldId) {
    return restaurantNameBySlug.get(oldId) ?? oldId;
}

const users = oldUsers.map((record) => {
    const profile = record.profile;
    const ownerProfile = ownerProfileByUserId.get(profile.user_id);
    const adminProfile = adminProfileByUserId.get(profile.user_id);
    const managedRestaurants =
        ownerProfile?.managed_restaurant_ids.map((restaurantSlug) => ({
            restaurant_slug: restaurantSlug,
            restaurant_name: restaurantNameBySlug.get(restaurantSlug) ?? restaurantSlug,
            verified: ownerProfile.verification_status === "verified",
            status: ownerProfile.access_status === "approved" ? "active" : "pending",
            franchise_type: "",
            cuisine_tags: [],
            pdf_file: pdfByRestaurantSlug[restaurantSlug] ?? null,
            pdf_status: pdfByRestaurantSlug[restaurantSlug] ? "approved" : "not_submitted",
        })) ?? [];

    return {
        _id: profile.user_id,
        name: profile.full_name,
        email: profile.email,
        password_hash: record.password,
        role: profile.account_type,
        phone: ownerProfile?.phone ?? null,
        saved_items: [...new Set(profile.saved_item_keys.map(savedItemKey))],
        saved_restaurants: [
            ...new Set(profile.saved_restaurant_ids.map(savedRestaurantName)),
        ],
        diet_preferences: [],
        managed_restaurants: managedRestaurants,
        permissions: adminProfile?.permissions ?? [],
        created_at: profile.created_at,
        updated_at: profile.updated_at,
    };
});

const userById = new Map(users.map((user) => [user._id, user]));

function submittedBy(userId) {
    const user = userById.get(userId);
    return {
        user_id: userId,
        name: user?.name ?? "Demo User",
        email: user?.email ?? "demo@macrofinder.ca",
    };
}

function requestStatus(value, type) {
    if (value === "pending_review" || value === "pending_admin_review") {
        return "pending";
    }
    if (value === "rejected") return "denied";
    if (value === "in_progress") return "pending";
    if (value) return value;
    return type === "reported_issue" ? "open" : "pending";
}

const requests = [
    ...oldRoleRequests.map((request) => ({
        _id: request.requestId,
        type: "role_upgrade",
        status: requestStatus(request.status, "role_upgrade"),
        submitted_at: request.submittedAt,
        reviewed_at: request.reviewedAt ?? null,
        reviewed_by: request.reviewedByAdminId ?? null,
        submitted_by: submittedBy(request.requesterUserId),
        data: {
            restaurant_name: request.restaurantName,
            role_claimed: request.role,
            note: request.note,
        },
    })),
    ...oldRestaurantRequests.map((request) => ({
        _id: request.request_id,
        type: "restaurant_creation",
        status: requestStatus(request.review?.status, "restaurant_creation"),
        submitted_at: request.submitted_at,
        reviewed_at: request.review?.reviewed_at ?? null,
        reviewed_by: request.review?.reviewed_by_admin_id ?? null,
        submitted_by: submittedBy(request.requester_user_id),
        data: {
            restaurant_name: request.restaurant.restaurant_name,
            owner_role: request.contact.owner_role,
            phone: request.contact.owner_phone,
            website_url: request.restaurant.website_url,
            menu_url: request.restaurant.menu_url,
            menu_note: request.restaurant.owner_note,
            nutrition_pdf: request.files.nutrition_pdf?.file_name ?? null,
            has_image: request.files.restaurant_image !== null,
            sample_items: request.sample_items.map((item) => ({
                name: item.item_name,
                category: item.category,
                price: item.price_cad === null ? null : String(item.price_cad),
                protein_g: item.protein_g,
                calories: item.calories,
            })),
        },
    })),
    ...oldRestaurantChangeRequests.map((request) => ({
        _id: request.request_id,
        type: "change_request",
        status: requestStatus(request.review?.status, "change_request"),
        submitted_at: request.submitted_at,
        reviewed_at: request.review?.reviewed_at ?? null,
        reviewed_by: request.review?.reviewed_by_admin_id ?? null,
        submitted_by: submittedBy(request.requester_user_id),
        data: {
            restaurant_name: request.restaurant_name,
            change_scope: "restaurant",
            change_field: request.requested_changes.image_url
                ? "rest_image"
                : "rest_description",
            item_name: null,
            description:
                request.owner_note || request.requested_changes.description || "",
            pdf_file: pdfByRestaurantSlug[request.restaurant_id] ?? null,
        },
    })),
    ...oldReportedIssues.map((issue) => ({
        _id: issue.issue_id,
        type: "reported_issue",
        status: requestStatus(issue.status, "reported_issue"),
        submitted_at: issue.submitted_at ?? issue.created_at,
        reviewed_at: issue.resolved_at ?? null,
        reviewed_by: issue.resolved_by_admin_id ?? null,
        submitted_by: submittedBy(issue.reporter_user_id),
        data: {
            item_key:
                issue.item_key && oldItemsByUniqueKey.has(issue.item_key)
                    ? savedItemKey(issue.item_key)
                    : issue.item_key,
            restaurant_name: issue.restaurant_name,
            issue_type: issue.issue_type,
            note: issue.note,
        },
    })),
];

const ownerUserByRestaurantName = new Map();
for (const user of users) {
    for (const restaurant of user.managed_restaurants) {
        ownerUserByRestaurantName.set(restaurant.restaurant_name, user);
    }
}

const tasks = oldTasks
    .filter((task) => task.status !== "completed")
    .map((task) => {
        const owner = ownerUserByRestaurantName.get(task.restaurant_name);
        const firstTaskItem =
            task.item_keys.length > 0 ? oldItemsByUniqueKey.get(task.item_keys[0]) : null;
        const taskNeedsImage = task.missing_fields?.includes("image");
        const taskNeedsPdf = task.task_type === "pdf_review";
        return {
            _id: task.task_id,
            owner_id: owner?._id ?? task.owner_profile_id,
            restaurant_name: task.restaurant_name,
            scope: firstTaskItem ? "item" : "restaurant",
            item_name: firstTaskItem?.item_name ?? null,
            item_category: firstTaskItem?.category ?? null,
            task_type: taskNeedsPdf
                ? "request_pdf"
                : taskNeedsImage
                    ? "request_image"
                    : "request_description",
            description: task.summary,
            admin_note: task.admin_note,
            status: task.status === "submitted_for_admin_review" ? "submitted" : "pending",
            created_at: task.created_at,
        };
    });

writeJson("items.json", items);
writeJson("restaurants.json", restaurants);
writeJson("users.json", users);
writeJson("requests.json", requests);
writeJson("tasks.json", tasks);
