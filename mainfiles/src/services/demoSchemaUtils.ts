import rawMenuItems from "../../data/menu_items_imputed.json";

interface LookupMenuItem {
    unique_key?: string;
    restaurant_id?: string;
    restaurant_name?: string;
    item_name?: string;
    portion?: string | null;
    macros?: {
        calories?: number | null;
    };
}

const lookupItems = Array.isArray(rawMenuItems)
    ? (rawMenuItems as LookupMenuItem[])
    : [];

function normalizeLookupValue(value: string): string {
    return value.trim().toLowerCase();
}

function buildPairKey(restaurantName: string, itemName: string): string {
    return `${normalizeLookupValue(restaurantName)}::${normalizeLookupValue(itemName)}`;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const value of values) {
        if (!value) continue;
        if (seen.has(value)) continue;
        seen.add(value);
        result.push(value);
    }

    return result;
}

const restaurantNameToId = new Map<string, string>();
const itemNameToKeys = new Map<string, LookupMenuItem[]>();
const itemKeyToName = new Map<string, string>();

for (const item of lookupItems) {
    if (
        !item.unique_key ||
        !item.restaurant_id ||
        !item.restaurant_name ||
        !item.item_name
    ) {
        continue;
    }

    restaurantNameToId.set(
        normalizeLookupValue(item.restaurant_name),
        item.restaurant_id,
    );

    const pairKey = buildPairKey(item.restaurant_name, item.item_name);
    const existing = itemNameToKeys.get(pairKey) ?? [];
    existing.push(item);
    itemNameToKeys.set(pairKey, existing);

    itemKeyToName.set(item.unique_key, item.item_name);
}

export function slugifyIdentifier(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function resolveRestaurantId(value: string | null | undefined): string {
    if (!value) return "";

    const normalized = normalizeLookupValue(value);
    return restaurantNameToId.get(normalized) ?? slugifyIdentifier(value);
}

export function resolveSavedRestaurantIds(values: string[]): string[] {
    return uniqueStrings(values.map((value) => resolveRestaurantId(value)));
}

export function resolveItemUniqueKey(
    value: string | null | undefined,
    restaurantName?: string | null,
    itemName?: string | null,
): string | null {
    if (typeof value === "string" && value.includes("|")) {
        return value;
    }

    let resolvedRestaurantName = restaurantName ?? null;
    let resolvedItemName = itemName ?? null;

    if (typeof value === "string" && value.includes("::")) {
        const [restaurantPart, itemPart] = value.split("::", 2);
        resolvedRestaurantName = restaurantPart?.trim() || resolvedRestaurantName;
        resolvedItemName = itemPart?.trim() || resolvedItemName;
    }

    if (!resolvedRestaurantName || !resolvedItemName) {
        return null;
    }

    const candidates = itemNameToKeys.get(
        buildPairKey(resolvedRestaurantName, resolvedItemName),
    );
    if (!candidates || candidates.length === 0) {
        return null;
    }

    const sortedCandidates = [...candidates].sort((left, right) => {
        const portionCompare = (left.portion ?? "").localeCompare(right.portion ?? "");
        if (portionCompare !== 0) return portionCompare;

        return (left.macros?.calories ?? Number.MAX_SAFE_INTEGER) -
            (right.macros?.calories ?? Number.MAX_SAFE_INTEGER);
    });

    return sortedCandidates[0]?.unique_key ?? null;
}

export function extractItemNameFromKey(
    value: string | null | undefined,
): string | null {
    if (!value) return null;

    if (value.includes("::")) {
        const [, itemName] = value.split("::", 2);
        return itemName?.trim() || null;
    }

    return itemKeyToName.get(value) ?? null;
}
