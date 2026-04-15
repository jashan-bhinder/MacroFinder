import type {
    DatabaseItem,
    DatabaseRestaurant,
    DatabaseUser,
    MenuItem,
    RestaurantOwnerProfile,
    RestaurantSummary,
    UserProfile,
    AdminProfile,
} from "../types/models";

export function slugForUiKey(value: string | null | undefined): string {
    const slug = String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return slug || "item";
}

export function savedItemDisplayKey(item: DatabaseItem): string {
    return `${item.restaurant_name}::${item.name}`;
}

export function dbItemToUniqueKey(item: DatabaseItem): string {
    return `${item.restaurant_slug}|${slugForUiKey(item.name)}|${slugForUiKey(
        item.portion,
    )}`;
}

export function dbRestaurantNameToSlug(
    restaurantName: string,
    restaurants: DatabaseRestaurant[],
): string {
    return (
        restaurants.find((restaurant) => restaurant.name === restaurantName)?.slug ??
        slugForUiKey(restaurantName)
    );
}

export function dbSavedItemToUniqueKey(
    savedItem: string,
    items: DatabaseItem[],
): string {
    const matchingItem = items.find(
        (item) => savedItemDisplayKey(item) === savedItem,
    );

    return matchingItem ? dbItemToUniqueKey(matchingItem) : savedItem;
}

export function dbItemToMenuItem(item: DatabaseItem): MenuItem {
    const missingFields = item.data_quality.missing_fields ?? [];

    return {
        item_id: item._id,
        restaurant_id: item.restaurant_slug,
        restaurant_name: item.restaurant_name,
        item_name: item.name,
        summary:
            item.description ??
            `${item.name} from ${item.restaurant_name}. Nutrition details are available from the source PDF.`,
        unique_key: dbItemToUniqueKey(item),
        category: item.category,
        category_path: item.category ? [item.category] : [],
        portion: item.portion ?? "1 serving",
        price_cad: item.price_cad ?? 0,
        availability_status: item.status,
        tags: [],
        diet_tags: [],
        macros: {
            calories: item.macros.calories ?? 0,
            protein_g: item.macros.protein_g ?? 0,
            carbs_g: item.macros.carbs_g ?? 0,
            fat_g: item.macros.fat_g ?? 0,
            sodium_mg: item.macros.sodium_mg ?? 0,
            sugar_g: item.macros.sugar_g ?? 0,
        },
        data_quality: {
            partial_data: missingFields.length > 0,
            missing_fields: missingFields,
            presentation_ready: true,
        },
        source_url: item.data_quality.source_pdf ?? "",
        source_type: item.data_quality.source_pdf ? "pdf" : "unknown",
        image_url:
            item.image_url ??
            `https://placehold.co/800x600/EDE7DC/2C2B27?text=${encodeURIComponent(
                `${item.restaurant_name}\n${item.name}`,
            )}`,
        image_source_url: null,
        image_status: item.image_url ? "ok" : "missing",
        last_verified_at: item.updated_at,
        scraped_at: item.created_at,
        updated_at: item.updated_at,
    };
}

function average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
    return Math.round(value * 100) / 100;
}

export function dbRestaurantToSummary(
    restaurant: DatabaseRestaurant,
    items: MenuItem[],
): RestaurantSummary {
    const restaurantItems = items.filter(
        (item) => item.restaurant_id === restaurant.slug,
    );
    const prices = restaurantItems
        .map((item) => item.price_cad)
        .filter((price) => Number.isFinite(price));
    const proteins = restaurantItems.map((item) => item.macros.protein_g);
    const values = restaurantItems.map(
        (item) => item.macros.protein_g / Math.max(item.price_cad, 0.1),
    );
    const heroItem =
        [...restaurantItems].sort(
            (left, right) =>
                right.macros.protein_g / Math.max(right.price_cad, 0.1) -
                left.macros.protein_g / Math.max(left.price_cad, 0.1),
        )[0] ?? null;

    return {
        restaurant_id: restaurant.slug,
        restaurant_name: restaurant.name,
        franchise_key: restaurant.slug,
        item_count: restaurant.stats.item_count,
        categories: restaurant.categories,
        avg_protein_g: restaurant.stats.avg_protein_g ?? round(average(proteins)),
        avg_price_cad: round(average(prices)),
        avg_protein_per_dollar: round(average(values)),
        min_price_cad: prices.length > 0 ? round(Math.min(...prices)) : 0,
        max_price_cad: prices.length > 0 ? round(Math.max(...prices)) : 0,
        hero_item_key: heroItem?.unique_key ?? "",
        image_url: restaurant.image_url ?? heroItem?.image_url ?? "",
        description:
            restaurant.description ??
            `Franchise-level record for ${restaurant.name}.`,
        tags: restaurant.tags,
    };
}

export function dbUserToUserProfile(
    user: DatabaseUser,
    items: DatabaseItem[],
    restaurants: DatabaseRestaurant[],
): UserProfile {
    return {
        user_id: user._id,
        full_name: user.name,
        email: user.email,
        password_hash: user.password_hash,
        account_type: user.role,
        saved_item_keys: user.saved_items.map((savedItem) =>
            dbSavedItemToUniqueKey(savedItem, items),
        ),
        saved_restaurant_ids: user.saved_restaurants.map((restaurantName) =>
            dbRestaurantNameToSlug(restaurantName, restaurants),
        ),
        restaurant_access_request_ids: [],
        status: "active",
        created_at: user.created_at,
        updated_at: user.updated_at,
    };
}

export function dbUserToOwnerProfile(
    user: DatabaseUser,
): RestaurantOwnerProfile | null {
    if (user.role !== "restaurant_owner") return null;

    return {
        owner_profile_id: user._id,
        user_id: user._id,
        display_name: user.name,
        role_title: user.permissions[0] ?? "Restaurant owner",
        business_email: user.email,
        phone: user.phone,
        managed_restaurant_ids: user.managed_restaurants.map(
            (restaurant) => restaurant.restaurant_slug,
        ),
        verification_status: user.managed_restaurants.some(
            (restaurant) => restaurant.verified,
        )
            ? "verified"
            : "pending",
        access_status: user.managed_restaurants.some(
            (restaurant) => restaurant.status === "active",
        )
            ? "approved"
            : "pending_review",
        created_at: user.created_at,
        updated_at: user.updated_at,
    };
}

export function dbUserToAdminProfile(user: DatabaseUser): AdminProfile | null {
    if (user.role !== "admin") return null;

    return {
        admin_profile_id: user._id,
        user_id: user._id,
        display_name: user.name,
        email: user.email,
        permissions: user.permissions,
        status: "active",
        created_at: user.created_at,
        updated_at: user.updated_at,
    };
}
