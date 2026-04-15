from __future__ import annotations

import copy
import json
import math
from collections import Counter
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[1]
RAW_ITEMS_PATH = ROOT / "data" / "menu_items.json"
IMPUTED_ITEMS_PATH = ROOT / "data" / "menu_items_imputed.json"
IMPUTED_BY_RESTAURANT_DIR = ROOT / "data" / "menu_items_imputed_by_restaurant"
SUMMARY_PATH = ROOT / "data" / "imputation_summary.json"


PLACEHOLDER_COLORS = {
    "subway": ("0B7A33", "FFFFFF"),
    "a-and-w": ("7A2F23", "FFF6F0"),
    "chucks-roadhouse": ("5D3B2E", "FFF7F2"),
    "jugo-juice": ("5B7C5D", "F6FFF7"),
    "moxies": ("2C3E50", "F8FBFF"),
    "noodlebox": ("A6462A", "FFF8F5"),
    "old-spaghetti-factory": ("7B4B2A", "FFF8F2"),
    "triple-os": ("2A567A", "F4FAFF"),
}

JUGO_NAME_OVERRIDES = {
    "CONTAINS PEANUTS AND TREE NUTS": "Peanut Butter Protein",
}

JUGO_CATEGORY_OVERRIDES = {
    "Good Shot": "Wellness Shot",
    "Ground Flax": "Xtra Benefits",
    "Hemp Hearts": "Xtra Benefits",
    "Chia Seeds": "Xtra Benefits",
    "Vanilla Whey Protein": "Xtra Benefits",
    "Chocolate Whey Protein": "Xtra Benefits",
    "Vega One Protein": "Xtra Benefits",
    "Three Cheese": "Grilled Cheese",
    "Chicken Avocado": "Wraps",
    "Chicken Melt": "Wraps",
    "Crunchy Veggie": "Wraps",
    "Falafel": "Wraps",
    "Turkey Bacon Club": "Wraps",
    "Thai Chicken": "Wraps",
    "GOA Chicken": "Wraps",
    "Tuna Avocado": "Wraps",
    "Apple Pie Chia Pudding": "Snacks",
    "Peaches n' Raspberry Overnight Oats": "Snacks",
    "Yogurt Parfait": "Snacks",
}

PORTION_DEFAULTS = {
    ("jugo-juice", "Wraps"): "1 wrap",
    ("jugo-juice", "Grilled Cheese"): "1 sandwich",
    ("jugo-juice", "Snacks"): "1 serving",
    ("jugo-juice", "Fresh Pressed Juice"): "24 oz.",
    ("jugo-juice", "Wellness Shot"): "2 oz.",
    ("jugo-juice", "Xtra Benefits"): "1 add-on",
    ("noodlebox", "Boxes"): "1 box",
    ("noodlebox", "Extras"): "1 extra",
    ("noodlebox", "Protein"): "1 add-on",
    ("chucks-roadhouse", "Starters"): "1 serving",
    ("chucks-roadhouse", "Kids' Menu"): "1 meal",
    ("chucks-roadhouse", "Steak & Lobster"): "1 plate",
    ("chucks-roadhouse", "Chuck's Favourites"): "1 plate",
    ("chucks-roadhouse", "Burgers"): "1 burger",
}


def menu_round(value: float) -> float:
    base = round(value * 2) / 2
    cents = 0.49 if base < 10 else 0.99
    return round(math.floor(base) + cents if base >= 1 else cents, 2)


def placeholder_image_url(item: dict) -> str:
    bg, fg = PLACEHOLDER_COLORS.get(item["restaurant_id"], ("3F7B58", "FFFFFF"))
    label = f"{item['restaurant_name']}\n{item['item_name']}"
    return f"https://placehold.co/800x600/{bg}/{fg}?text={quote(label)}"


def normalize_name(item: dict) -> None:
    if item["restaurant_id"] == "jugo-juice":
        item["item_name"] = JUGO_NAME_OVERRIDES.get(item["item_name"], item["item_name"])


def correct_categories(item: dict) -> None:
    if item["restaurant_id"] == "jugo-juice":
        item["category"] = JUGO_CATEGORY_OVERRIDES.get(item["item_name"], item["category"])


def infer_portion(item: dict) -> str | None:
    if item.get("portion"):
        return item["portion"]

    name = item["item_name"].lower()
    if "1/2 gallon" in name:
        return "1/2 gallon"
    if "1 cookie" in name:
        return "1 cookie"
    if "6\"" in name:
        return '6"'
    if "footlong" in name:
        return "1 footlong"
    if "(1)" in item["item_name"]:
        return "1 piece"
    if "(2)" in item["item_name"]:
        return "2 pieces"
    if "(5)" in item["item_name"]:
        return "5 pieces"

    default = PORTION_DEFAULTS.get((item["restaurant_id"], item["category"]))
    if default:
        return default

    category = (item["category"] or "").lower()
    if any(word in category for word in ("soup", "salad", "starter", "dessert", "snacks", "classics", "sides")):
        return "1 serving"
    if any(word in category for word in ("wrap", "sandwich", "burger", "handheld")):
        return "1 item"
    return "1 serving"


def estimate_price(item: dict) -> float:
    rid = item["restaurant_id"]
    category = item["category"] or ""
    calories = item["macros"]["calories"] or 0
    protein = item["macros"]["protein_g"] or 0
    portion = item.get("portion") or ""
    name = item["item_name"].lower()

    if rid == "subway":
        base = {"Sandwiches": 8.99, "Wraps": 10.49, "Salads": 9.99}.get(category, 8.99)
        if any(word in name for word in ("steak", "brisket")):
            base += 1.0
        if "veggie" in name:
            base -= 1.0
        return round(base, 2)

    if rid == "jugo-juice":
        if category in {"Smoothies", "Fresh Energy Smoothies", "Fresh Pressed Juice"}:
            return 6.99 if "14 oz." in portion else 8.99
        if category == "Protein Smoothies":
            return 9.49 if "24 oz." in portion else 7.49
        if category == "Wellness Shot":
            return 3.49
        if category == "Xtra Benefits":
            return 0.99 if "tbsp." in portion else 2.49
        if category == "Wraps":
            return 10.99
        if category == "Grilled Cheese":
            return 8.99
        if category == "Snacks":
            return 6.49
        return 8.49

    if rid == "noodlebox":
        base = {
            "Boxes": 14.99,
            "Extras": 4.49,
            "Protein": 4.99,
            "Noodles": 3.99,
        }.get(category, 9.99)
        if category == "Boxes" and calories > 800:
            base += 1.5
        if category == "Protein" and protein >= 18:
            base += 0.5
        return round(base, 2)

    if rid == "a-and-w":
        if category == "Sauces":
            return 0.99
        if category == "Root Beer":
            return 5.99 if "gallon" in portion.lower() else 2.99
        if category == "Sides":
            return 4.49 if calories >= 250 else 3.49
        if category == "Sweets & Treats":
            return 3.49 if calories < 400 else 4.49
        base = 5.99
        if calories >= 700:
            base = 10.99
        elif calories >= 500:
            base = 8.99
        elif calories >= 300:
            base = 7.49
        if "double" in name:
            base += 1.5
        if "slider" in name:
            base = 3.99
        return round(base, 2)

    if rid == "triple-os":
        if "cookie" in name:
            return 2.49
        if "cheesecake" in name:
            return 4.49
        if "bun" in name:
            return 1.49
        if "onion rings" in name:
            return 5.49
        if "poutine" in name:
            return 6.99
        if category == "Breakfast":
            return 8.99
        return 6.49

    if rid == "chucks-roadhouse":
        base = {
            "Starters": 13.99,
            "Salads & Soups": 10.99,
            "Burgers": 16.99,
            "Sandwiches": 15.99,
            "Steaks & Prime Rib (select locations)": 26.99,
            "Steak & Lobster": 29.99,
            "Chuck's Favourites": 18.99,
            "BBQ Chicken, Ribs & Combos": 21.99,
            "Desserts": 7.99,
            "Kids' Menu": 8.99,
            "Side Fixin's": 5.49,
        }.get(category, 14.99)
        if calories > 1200:
            base += 2.0
        return round(base, 2)

    if rid == "moxies":
        base = {
            "Appetizers": 15.99,
            "Soup & Salads": 16.99,
            "Steaks (also see sides)": 31.99,
            "Mains (sides included)": 24.99,
            "Pastas & Bowls (no bread)": 21.99,
            "Handhelds (also see sides)": 18.99,
            "Sides": 5.99,
            "Desserts": 9.99,
        }.get(category, 18.99)
        if calories > 1200:
            base += 2.0
        return round(base, 2)

    if rid == "old-spaghetti-factory":
        base = {
            "Bread": 2.49,
            "Starter Soups": 5.99,
            "Starter Salads": 6.49,
            "Appetizers": 12.99,
            "Entree Salads": 15.99,
            "Spaghetti Classics": 17.99,
            "Signature Pastas": 19.99,
            "Grilled Items": 21.99,
            "Kids Menu": 8.99,
            "Lunch Menu": 12.99,
        }.get(category, 16.99)
        if calories > 1000:
            base += 2.0
        return round(base, 2)

    return round(menu_round(7.99 + calories / 300 + protein / 20), 2)


def estimate_sodium(item: dict) -> float:
    category = item["category"] or ""
    carbs = item["macros"]["carbs_g"] or 0
    fat = item["macros"]["fat_g"] or 0
    protein = item["macros"]["protein_g"] or 0
    calories = item["macros"]["calories"] or 0

    if item["restaurant_id"] == "jugo-juice":
        if category in {"Smoothies", "Fresh Energy Smoothies"}:
            return round(25 + protein * 6 + fat * 4)
        if category == "Protein Smoothies":
            return round(60 + protein * 5 + fat * 4)
        if category == "Fresh Pressed Juice":
            return round(15 + protein * 5)
        if category == "Wellness Shot":
            return 20
        if category == "Xtra Benefits":
            return 35 if "tbsp." in (item["portion"] or "") else 90
        if category == "Wraps":
            return round(420 + protein * 8 + fat * 4)
        if category == "Grilled Cheese":
            return round(780 + protein * 6 + fat * 3)
        if category == "Snacks":
            savory_words = ("turkey", "falafel", "parfait", "oats")
            return round(280 + protein * 6 + fat * 2) if any(word in item["item_name"].lower() for word in savory_words) else 140

    if item["restaurant_id"] == "noodlebox":
        if category == "Boxes":
            return round(650 + carbs * 6 + protein * 4 + fat * 2)
        if category == "Extras":
            return round(140 + carbs * 3 + protein * 2)
        if category == "Protein":
            return round(120 + protein * 3 + carbs * 2)
        if category == "Noodles":
            return round(40 + carbs * 2 + protein * 1.5)

    return round(80 + carbs * 2 + protein * 2 + fat * 1.5 + calories / 20)


def estimate_sugar(item: dict) -> float:
    category = item["category"] or ""
    carbs = item["macros"]["carbs_g"] or 0
    protein = item["macros"]["protein_g"] or 0
    name = item["item_name"].lower()

    if item["restaurant_id"] == "jugo-juice":
        if category in {"Smoothies", "Fresh Energy Smoothies", "Fresh Pressed Juice"}:
            return round(carbs * 0.72, 1)
        if category == "Protein Smoothies":
            return round(max(8.0, carbs * 0.45), 1)
        if category == "Wellness Shot":
            return round(carbs * 0.7, 1)
        if category == "Xtra Benefits":
            return round(max(0.0, carbs * 0.25), 1)
        if category == "Wraps":
            return round(max(3.0, carbs * 0.12), 1)
        if category == "Grilled Cheese":
            return round(max(2.0, carbs * 0.08), 1)
        if category == "Snacks":
            if any(word in name for word in ("chia pudding", "oats", "parfait")):
                return round(max(10.0, carbs * 0.35), 1)
            return round(max(4.0, carbs * 0.15), 1)

    if item["restaurant_id"] == "noodlebox":
        if category == "Boxes":
            return round(max(4.0, carbs * 0.16), 1)
        if category == "Extras":
            return round(max(2.0, carbs * 0.28), 1)
        if category == "Protein":
            return round(max(0.0, carbs * 0.2), 1)
        if category == "Noodles":
            return round(max(1.0, carbs * 0.05), 1)

    return round(max(1.0, carbs * 0.18 - protein * 0.05), 1)


def generate_summary(item: dict) -> str:
    restaurant = item["restaurant_name"]
    category = (item["category"] or "menu item").lower()
    calories = item["macros"]["calories"]
    protein = item["macros"]["protein_g"]
    price = item["price_cad"]

    if "smoothie" in category or "juice" in category or "shot" in category:
        lead = f"A drinkable option from {restaurant}"
    elif protein >= 25 and calories <= 500:
        lead = f"A protein-forward pick from {restaurant}"
    elif calories >= 800:
        lead = f"A heavier, more filling {category} from {restaurant}"
    elif calories <= 300:
        lead = f"A lighter option from {restaurant}"
    else:
        lead = f"A solid {category} option from {restaurant}"

    return f"{lead} with {protein}g protein and {calories} calories. Estimated demo price: ${price:.2f}."


def generate_tags(item: dict) -> list[str]:
    tags: list[str] = []
    category = (item["category"] or "").lower()
    calories = item["macros"]["calories"] or 0
    protein = item["macros"]["protein_g"] or 0
    sodium = item["macros"]["sodium_mg"]
    sugar = item["macros"]["sugar_g"]

    if protein >= 25:
        tags.append("high-protein")
    elif protein >= 15:
        tags.append("protein-friendly")
    if calories <= 350:
        tags.append("lower-cal")
    if calories >= 800:
        tags.append("big-meal")
    if sodium is not None and sodium <= 450:
        tags.append("low-sodium")
    if sugar is not None and sugar >= 20:
        tags.append("sweet")
    if any(word in category for word in ("wrap", "sandwich", "burger", "handheld", "snack", "smoothie", "juice")):
        tags.append("quick")
    if any(word in category for word in ("smoothie", "juice", "shot")):
        tags.append("drink")
    if any(word in category for word in ("salad", "wrap", "sandwich", "snack")):
        tags.append("portable")

    seen = []
    for tag in tags:
        if tag not in seen:
            seen.append(tag)
    return seen[:4]


def generate_diet_tags(item: dict) -> list[str]:
    tags: list[str] = []
    text = f"{item['item_name']} {item.get('category') or ''}".lower()
    if any(word in text for word in ("veggie", "vegetarian", "falafel", "tofu", "vegan", "beyond")):
        tags.append("vegetarian")
    if "vegan" in text:
        tags.append("vegan")
    return tags


def apply_manual_fixes(item: dict) -> None:
    normalize_name(item)
    correct_categories(item)


def impute_item(item: dict) -> dict:
    result = copy.deepcopy(item)
    apply_manual_fixes(result)

    imputed_fields: list[str] = list(result.get("data_quality", {}).get("imputed_fields", []))

    if not result.get("portion"):
        result["portion"] = infer_portion(result)
        imputed_fields.append("portion")

    if result.get("price_cad") is None:
        result["price_cad"] = estimate_price(result)
        imputed_fields.append("price_cad")

    if not result.get("summary"):
        result["summary"] = generate_summary(result)
        imputed_fields.append("summary")

    if not result.get("image_url"):
        result["image_url"] = placeholder_image_url(result)
        result["image_status"] = "placeholder"
        imputed_fields.append("image_url")

    if result["macros"].get("sodium_mg") is None:
        result["macros"]["sodium_mg"] = estimate_sodium(result)
        imputed_fields.append("macros.sodium_mg")

    if result["macros"].get("sugar_g") is None:
        result["macros"]["sugar_g"] = estimate_sugar(result)
        imputed_fields.append("macros.sugar_g")

    if not result.get("tags"):
        result["tags"] = generate_tags(result)
        if result["tags"]:
            imputed_fields.append("tags")

    if not result.get("diet_tags"):
        result["diet_tags"] = generate_diet_tags(result)
        if result["diet_tags"]:
            imputed_fields.append("diet_tags")

    # Recompute missing fields after imputation.
    missing_fields = []
    if result["price_cad"] is None:
        missing_fields.append("price_cad")
    if not result.get("image_url"):
        missing_fields.append("image_url")
    for macro_name, macro_value in result["macros"].items():
        if macro_value is None:
            missing_fields.append(f"macros.{macro_name}")

    result["data_quality"]["missing_fields"] = missing_fields
    result["data_quality"]["partial_data"] = bool(missing_fields)
    result["data_quality"]["imputed_fields"] = sorted(set(imputed_fields))
    result["data_quality"]["presentation_ready"] = True
    return result


def main() -> None:
    items = json.loads(RAW_ITEMS_PATH.read_text())
    imputed_items = [impute_item(item) for item in items]
    imputed_items.sort(key=lambda item: (item["restaurant_id"], item["item_name"], item["portion"] or ""))

    by_restaurant: dict[str, list[dict]] = {}
    imputed_counts = Counter()
    for item in imputed_items:
        by_restaurant.setdefault(item["restaurant_id"], []).append(item)
        for field in item["data_quality"].get("imputed_fields", []):
            imputed_counts[field] += 1

    IMPUTED_ITEMS_PATH.write_text(json.dumps(imputed_items, indent=2, ensure_ascii=True) + "\n")
    IMPUTED_BY_RESTAURANT_DIR.mkdir(parents=True, exist_ok=True)
    for restaurant_id, restaurant_items in by_restaurant.items():
        (IMPUTED_BY_RESTAURANT_DIR / f"{restaurant_id}.json").write_text(
            json.dumps(restaurant_items, indent=2, ensure_ascii=True) + "\n"
        )

    summary = {
        "source_file": str(RAW_ITEMS_PATH),
        "output_file": str(IMPUTED_ITEMS_PATH),
        "item_count": len(imputed_items),
        "restaurants": {restaurant_id: len(restaurant_items) for restaurant_id, restaurant_items in sorted(by_restaurant.items())},
        "imputed_field_counts": dict(sorted(imputed_counts.items())),
        "notes": [
            "This file is presentation-oriented and includes heuristic fills.",
            "Raw extracted data remains in data/menu_items.json.",
            "Placeholder image URLs were generated for display stability.",
        ],
    }
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2, ensure_ascii=True) + "\n")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
