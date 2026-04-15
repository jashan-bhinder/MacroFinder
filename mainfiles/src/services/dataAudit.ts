import type { DataAudit, MenuItem, RestaurantSummary } from "../types/models";

export function auditMenuData(
    items: MenuItem[],
    restaurants: RestaurantSummary[],
): DataAudit {
    const seen = new Set<string>();
    const duplicateUniqueKeys: string[] = [];
    const missingRequiredKeys: string[] = [];

    for (const item of items) {
        if (!item.unique_key || !item.restaurant_id || !item.restaurant_name) {
            missingRequiredKeys.push(item.item_name || "unknown-item");
        }
        if (seen.has(item.unique_key)) {
            duplicateUniqueKeys.push(item.unique_key);
        }
        seen.add(item.unique_key);
    }

    const restaurantIds = new Set(restaurants.map((restaurant) => restaurant.restaurant_id));
    const franchiseIdsReady = items.every((item) => restaurantIds.has(item.restaurant_id));

    return {
        total_items: items.length,
        total_restaurants: restaurants.length,
        duplicate_unique_keys: duplicateUniqueKeys,
        missing_required_keys: missingRequiredKeys,
        franchise_ids_ready: franchiseIdsReady,
    };
}

