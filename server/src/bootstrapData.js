function slugForUiKey(value) {
  const slug = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "item";
}

function numberOrZero(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function dbItemToUniqueKey(item) {
  return `${item.restaurant_slug}|${slugForUiKey(item.name)}|${slugForUiKey(
    item.portion,
  )}`;
}

function buildPlaceholderImageUrl(item) {
  return `https://placehold.co/800x600/EDE7DC/2C2B27?text=${encodeURIComponent(
    `${item.restaurant_name}\n${item.name}`,
  )}`;
}

function dbItemToMenuItem(item) {
  const missingFields = Array.isArray(item?.data_quality?.missing_fields)
    ? item.data_quality.missing_fields
    : [];

  return {
    item_id: item._id ?? null,
    restaurant_id: item.restaurant_slug,
    restaurant_name: item.restaurant_name,
    item_name: item.name,
    summary:
      item.description ??
      `${item.name} from ${item.restaurant_name}. Nutrition details are available from the source PDF.`,
    unique_key: dbItemToUniqueKey(item),
    category: item.category || "Other",
    category_path: item.category ? [item.category] : [],
    portion: item.portion ?? "1 serving",
    price_cad:
      typeof item.price_cad === "number" && Number.isFinite(item.price_cad)
        ? item.price_cad
        : 0,
    availability_status: item.status ?? "active",
    tags: [],
    diet_tags: [],
    macros: {
      calories: numberOrZero(item?.macros?.calories),
      protein_g: numberOrZero(item?.macros?.protein_g),
      carbs_g: numberOrZero(item?.macros?.carbs_g),
      fat_g: numberOrZero(item?.macros?.fat_g),
      sodium_mg: numberOrZero(item?.macros?.sodium_mg),
      sugar_g: numberOrZero(item?.macros?.sugar_g),
    },
    data_quality: {
      partial_data: missingFields.length > 0,
      missing_fields: missingFields,
      presentation_ready: true,
    },
    source_url: item?.data_quality?.source_pdf ?? "",
    source_type: item?.data_quality?.source_pdf ? "pdf" : "unknown",
    image_url: item.image_url ?? buildPlaceholderImageUrl(item),
    image_source_url: null,
    image_status: item.image_url ? "ok" : "missing",
    last_verified_at: item.updated_at ?? null,
    scraped_at: item.created_at ?? item.updated_at ?? new Date().toISOString(),
    updated_at: item.updated_at ?? item.created_at ?? new Date().toISOString(),
  };
}

function dbRestaurantToSummary(restaurant, items) {
  const restaurantItems = items.filter(
    (item) => item.restaurant_id === restaurant.slug,
  );
  const prices = restaurantItems
    .map((item) => item.price_cad)
    .filter((price) => Number.isFinite(price));
  const proteins = restaurantItems.map((item) => item.macros.protein_g);
  const proteinPerDollarValues = restaurantItems.map(
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
    item_count: restaurant?.stats?.item_count ?? restaurantItems.length,
    categories: Array.isArray(restaurant.categories) ? restaurant.categories : [],
    avg_protein_g:
      restaurant?.stats?.avg_protein_g ?? round(average(proteins)),
    avg_price_cad: round(average(prices)),
    avg_protein_per_dollar: round(average(proteinPerDollarValues)),
    min_price_cad: prices.length > 0 ? round(Math.min(...prices)) : 0,
    max_price_cad: prices.length > 0 ? round(Math.max(...prices)) : 0,
    hero_item_key: heroItem?.unique_key ?? "",
    image_url: restaurant.image_url ?? heroItem?.image_url ?? "",
    description:
      restaurant.description ?? `Franchise-level record for ${restaurant.name}.`,
    tags: Array.isArray(restaurant.tags) ? restaurant.tags : [],
  };
}

function auditMenuData(items, restaurants) {
  const seen = new Set();
  const duplicateUniqueKeys = [];
  const missingRequiredKeys = [];

  for (const item of items) {
    if (!item.unique_key || !item.restaurant_id || !item.restaurant_name) {
      missingRequiredKeys.push(item.item_name || "unknown-item");
    }
    if (seen.has(item.unique_key)) {
      duplicateUniqueKeys.push(item.unique_key);
    }
    seen.add(item.unique_key);
  }

  const restaurantIds = new Set(
    restaurants.map((restaurant) => restaurant.restaurant_id),
  );

  return {
    total_items: items.length,
    total_restaurants: restaurants.length,
    duplicate_unique_keys: duplicateUniqueKeys,
    missing_required_keys: missingRequiredKeys,
    franchise_ids_ready: items.every((item) => restaurantIds.has(item.restaurant_id)),
  };
}

export function buildBootstrapData(databaseItems, databaseRestaurants) {
  const items = databaseItems.map(dbItemToMenuItem);
  const restaurants = databaseRestaurants
    .map((restaurant) => dbRestaurantToSummary(restaurant, items))
    .sort((left, right) => right.item_count - left.item_count);

  return {
    items,
    restaurants,
    audit: auditMenuData(items, restaurants),
  };
}
