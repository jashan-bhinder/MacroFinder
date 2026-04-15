from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Callable


ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / ".idea" / "DATABASE"
DATA_DIR = ROOT / "data"
RAW_TEXT_DIR = DATA_DIR / "raw_pdf_text"
BY_RESTAURANT_DIR = DATA_DIR / "menu_items_by_restaurant"
EXTRACTOR_SOURCE = ROOT / "scripts" / "extract_pdf_text.swift"
EXTRACTOR_BINARY = Path("/tmp/extract_pdf_text")

sys.path.insert(0, str(ROOT))
from schema_templates import create_empty_menu_item  # noqa: E402


NUM_TOKEN = r"(?:<1|[0-9]+(?:\.[0-9]+)?)"
UPPER_HEADING_RE = re.compile(r"^[A-Z0-9&'’/\-\(\)\.\+\s]+$")


PDF_CONFIG = {
    "aw_nutrition.pdf": {
        "restaurant_id": "a-and-w",
        "restaurant_name": "A&W",
        "parser": "parse_aw",
    },
    "chucks_roadhouse_nutrition.pdf": {
        "restaurant_id": "chucks-roadhouse",
        "restaurant_name": "Chuck's Roadhouse",
        "parser": "parse_chucks",
    },
    "jugo_juice_nutrition.pdf": {
        "restaurant_id": "jugo-juice",
        "restaurant_name": "Jugo Juice",
        "parser": "parse_jugo",
    },
    "moxies_ca_nutrition.pdf": {
        "restaurant_id": "moxies",
        "restaurant_name": "Moxies",
        "parser": "parse_moxies",
    },
    "noodlebox_nutrition.pdf": {
        "restaurant_id": "noodlebox",
        "restaurant_name": "Noodlebox",
        "parser": "parse_noodlebox",
    },
    "old_spaghetti_factory_nutrition.pdf": {
        "restaurant_id": "old-spaghetti-factory",
        "restaurant_name": "Old Spaghetti Factory",
        "parser": "parse_old_spaghetti_factory",
    },
    "triple_os_nutrition.pdf": {
        "restaurant_id": "triple-os",
        "restaurant_name": "Triple O's",
        "parser": "parse_triple_os",
    },
}


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = value.replace("&", "and")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def as_float(token: str | None) -> float | None:
    if token is None:
        return None
    token = token.strip()
    if not token:
        return None
    if token == "<1":
        return 0.5
    try:
        return float(token)
    except ValueError:
        return None


def as_int_if_whole(value: float | None) -> int | float | None:
    if value is None:
        return None
    if float(value).is_integer():
        return int(value)
    return value


def clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.replace("TM", "").replace("®", "").replace("◊", "")
    value = value.replace("’", "'").replace("–", "-")
    value = re.sub(r"\s+", " ", value).strip()
    return value or None


def normalize_lines(text: str) -> list[str]:
    lines = []
    for raw_line in text.splitlines():
        line = clean_text(raw_line)
        if not line or line.startswith("=== PAGE"):
            continue
        lines.append(line)
    return lines


def file_uri(path: Path) -> str:
    return path.resolve().as_uri()


def build_unique_key(restaurant_id: str, item_name: str, portion: str | None = None) -> str:
    parts = [restaurant_id, slugify(item_name)]
    if portion:
        parts.append(slugify(portion))
    return "|".join(parts)


def finalize_item(item: dict) -> dict:
    missing_fields = []
    macros = item["macros"]
    if item["price_cad"] is None:
        missing_fields.append("price_cad")
    for field in ("calories", "protein_g", "carbs_g", "fat_g", "sodium_mg", "sugar_g"):
        if macros[field] is None:
            missing_fields.append(f"macros.{field}")
    item["data_quality"]["missing_fields"] = missing_fields
    item["data_quality"]["partial_data"] = bool(missing_fields)
    return item


def make_item(
        *,
        restaurant_id: str,
        restaurant_name: str,
        source_path: Path,
        item_name: str,
        category: str | None = None,
        portion: str | None = None,
        summary: str | None = None,
        calories: float | None = None,
        protein_g: float | None = None,
        carbs_g: float | None = None,
        fat_g: float | None = None,
        sodium_mg: float | None = None,
        sugar_g: float | None = None,
) -> dict:
    item = create_empty_menu_item()
    item["restaurant_id"] = restaurant_id
    item["restaurant_name"] = restaurant_name
    item["item_name"] = clean_text(item_name)
    item["summary"] = clean_text(summary)
    item["category"] = clean_text(category)
    item["portion"] = clean_text(portion)
    item["unique_key"] = build_unique_key(
        restaurant_id=restaurant_id,
        item_name=item["item_name"],
        portion=item["portion"],
    )
    item["source_url"] = file_uri(source_path)
    item["source_type"] = "pdf"
    item["macros"]["calories"] = as_int_if_whole(calories)
    item["macros"]["protein_g"] = as_int_if_whole(protein_g)
    item["macros"]["carbs_g"] = as_int_if_whole(carbs_g)
    item["macros"]["fat_g"] = as_int_if_whole(fat_g)
    item["macros"]["sodium_mg"] = as_int_if_whole(sodium_mg)
    item["macros"]["sugar_g"] = as_int_if_whole(sugar_g)
    item["image_status"] = "missing"
    return finalize_item(item)


def dedupe_items(items: list[dict]) -> list[dict]:
    seen = {}
    for item in items:
        if is_reasonable_item_name(item["item_name"]):
            seen[item["unique_key"]] = item
    return list(seen.values())


def is_heading_candidate(line: str) -> bool:
    if any(char.isdigit() for char in line):
        return False
    if len(line) > 60:
        return False
    return True


def is_reasonable_item_name(name: str | None) -> bool:
    if not name:
        return False
    denylist = {
        "Garlic Parmesan Fries Cajun Fries",
    }
    if name in denylist:
        return False
    if not re.search(r"[A-Za-z]", name):
        return False
    if name.startswith("3 <1"):
        return False
    digit_groups = re.findall(r"\d+(?:\.\d+)?", name)
    if len(digit_groups) >= 4:
        return False
    if len(name) > 100 and digit_groups:
        return False
    return True


def split_trailing_portion(prefix: str) -> tuple[str, str | None]:
    prefix = clean_text(prefix) or ""

    parenthetical_match = re.search(r"\(([^()]*)\)\s*$", prefix)
    if parenthetical_match:
        raw_portion = clean_text(parenthetical_match.group(1))
        if raw_portion and re.search(r"(oz|g|slice|serv|each|lb|pcs?|piece|taco|wrap|box|scoop|tbsp)", raw_portion, re.IGNORECASE):
            name = clean_text(prefix[:parenthetical_match.start()])
            return name or prefix, raw_portion

    quantity_match = re.search(
        r"(?P<portion>(?:\d+(?:\.\d+)?\s*(?:fl oz|oz\.?|g|kg|lb|lbs|tsp\.?|tbsp\.?|serv(?:ing)?s?|pcs?|pieces?|piece|each|loaf|slices?|rack))|(?:[0-9]+\s*x\s*[0-9]+))$",
        prefix,
        re.IGNORECASE,
    )
    if quantity_match:
        portion = clean_text(quantity_match.group("portion"))
        name = clean_text(prefix[:quantity_match.start()])
        return name or prefix, portion

    return prefix, None


def ensure_extractor() -> None:
    if EXTRACTOR_BINARY.exists() and EXTRACTOR_BINARY.stat().st_mtime >= EXTRACTOR_SOURCE.stat().st_mtime:
        return
    subprocess.run(
        [
            "swiftc",
            "-module-cache-path",
            "/tmp/swift-module-cache",
            "-o",
            str(EXTRACTOR_BINARY),
            str(EXTRACTOR_SOURCE),
        ],
        check=True,
        cwd=ROOT,
    )


def extract_text(pdf_path: Path) -> str:
    ensure_extractor()
    completed = subprocess.run(
        [str(EXTRACTOR_BINARY), str(pdf_path)],
        check=True,
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    return completed.stdout


def parse_aw(text: str, *, restaurant_id: str, restaurant_name: str, source_path: Path) -> list[dict]:
    value_re = re.compile(
        rf"^(?P<serving>{NUM_TOKEN})\s+"
        rf"(?P<calories>{NUM_TOKEN})\s+"
        rf"(?P<calories_from_fat>{NUM_TOKEN})\s+"
        rf"(?P<fat>{NUM_TOKEN})\s+"
        rf"(?P<saturated>{NUM_TOKEN})\s+"
        rf"(?P<trans>{NUM_TOKEN})\s+"
        rf"(?P<cholesterol>{NUM_TOKEN})\s+"
        rf"(?P<sodium>{NUM_TOKEN})\s+"
        rf"(?P<carbs>{NUM_TOKEN})\s+"
        rf"(?P<fibre>{NUM_TOKEN})\s+"
        rf"(?P<sugar>{NUM_TOKEN})\s+"
        rf"(?P<protein>{NUM_TOKEN})\s+"
        rf"(?P<rest>.+)$"
    )
    heading_blacklist = {
        "A&W Nutrition & Allergen Information",
        "Menu item may not be available at all A&W Restaurants.",
        "Serving Weight (g)",
        "Calories",
        "Calories from Fat",
        "Fat - Total (g)",
        "Saturated Fat (g)",
        "Trans Fat",
        "Cholesterol (mg)",
        "Sodium (mg)",
        "Carbohydrates (g)",
        "Dietary Fiber (g)",
        "Sugars (g)",
        "Protein (g)",
        "Allergen Statement",
    }
    items = []
    current_category = None
    pending_name = None
    for line in normalize_lines(text):
        if line in heading_blacklist:
            continue
        if UPPER_HEADING_RE.fullmatch(line) and line not in heading_blacklist and line.isupper():
            current_category = line.title()
            pending_name = None
            continue
        match = value_re.match(line)
        if match and pending_name:
            item_name = clean_text(pending_name)
            items.append(
                make_item(
                    restaurant_id=restaurant_id,
                    restaurant_name=restaurant_name,
                    source_path=source_path,
                    item_name=item_name,
                    category=current_category,
                    portion=f"{as_int_if_whole(as_float(match.group('serving')))} g",
                    calories=as_float(match.group("calories")),
                    protein_g=as_float(match.group("protein")),
                    carbs_g=as_float(match.group("carbs")),
                    fat_g=as_float(match.group("fat")),
                    sodium_mg=as_float(match.group("sodium")),
                    sugar_g=as_float(match.group("sugar")),
                )
            )
            pending_name = None
            continue

        pending_name = line
    return dedupe_items(items)


def parse_chucks(text: str, *, restaurant_id: str, restaurant_name: str, source_path: Path) -> list[dict]:
    row_re = re.compile(
        rf"^(?P<prefix>.+?)\s+"
        rf"(?P<calories>{NUM_TOKEN})\s+"
        rf"(?P<fat>{NUM_TOKEN})\s+"
        rf"(?P<saturated>{NUM_TOKEN})\s+"
        rf"(?P<trans>{NUM_TOKEN})\s+"
        rf"(?P<cholesterol>{NUM_TOKEN})\s+"
        rf"(?P<sodium>{NUM_TOKEN})\s+"
        rf"(?P<carbs>{NUM_TOKEN})\s+"
        rf"(?P<fibre>{NUM_TOKEN})\s+"
        rf"(?P<sugar>{NUM_TOKEN})\s+"
        rf"(?P<protein>{NUM_TOKEN})\s+"
        rf"(?P<vit_a>{NUM_TOKEN})\s+"
        rf"(?P<vit_c>{NUM_TOKEN})\s+"
        rf"(?P<calcium>{NUM_TOKEN})\s+"
        rf"(?P<iron>{NUM_TOKEN})"
        rf"(?:\s+[*xX].*)?$"
    )
    heading_blacklist = {
        "Chuck's Roadhouse Nutritional and Allergen Chart",
        "Nutrition Information",
        "Allergens",
        "2025 September",
        "Serving size",
        "Calories",
        "Total Fat (g)",
        "Saturated Fat (g)",
        "Trans Fat (g)",
        "Cholesterol (mg)",
        "Sodium (mg)",
        "Carbohydrate (g)",
        "Fibre (g)",
        "Sugars (g)",
        "Protein (g)",
        "Vitamin A %DV",
        "Vitamin C %DV",
        "Calcium %DV",
        "Iron %DV",
    }
    items = []
    current_category = None
    for line in normalize_lines(text):
        if line in heading_blacklist:
            continue
        if is_heading_candidate(line) and not row_re.match(line):
            current_category = line
            continue
        match = row_re.match(line)
        if not match:
            continue
        raw_name = clean_text(match.group("prefix"))
        item_name, portion = split_trailing_portion(raw_name)
        items.append(
            make_item(
                restaurant_id=restaurant_id,
                restaurant_name=restaurant_name,
                source_path=source_path,
                item_name=item_name,
                category=current_category,
                portion=portion,
                calories=as_float(match.group("calories")),
                protein_g=as_float(match.group("protein")),
                carbs_g=as_float(match.group("carbs")),
                fat_g=as_float(match.group("fat")),
                sodium_mg=as_float(match.group("sodium")),
                sugar_g=as_float(match.group("sugar")),
            )
        )
    return dedupe_items(items)


def parse_moxies(text: str, *, restaurant_id: str, restaurant_name: str, source_path: Path) -> list[dict]:
    row_re = re.compile(
        rf"^(?P<name>.+?)\s+"
        rf"(?P<serving>{NUM_TOKEN})\s+"
        rf"(?P<calories>{NUM_TOKEN})\s+"
        rf"(?P<fat>{NUM_TOKEN})\s+"
        rf"(?P<saturated>{NUM_TOKEN})\s+"
        rf"(?P<trans>{NUM_TOKEN})\s+"
        rf"(?P<cholesterol>{NUM_TOKEN})\s+"
        rf"(?P<sodium>{NUM_TOKEN})\s+"
        rf"(?P<carbs>{NUM_TOKEN})\s+"
        rf"(?P<fibre>{NUM_TOKEN})\s+"
        rf"(?P<protein>{NUM_TOKEN})\s+"
        rf"(?P<sugar>{NUM_TOKEN})\s*$"
    )
    heading_blacklist = {
        "Nutritional guide",
        "SERVING",
        "SIZE (g) CALORIES FAT (g)",
        "TOTAL",
        "SATURATED",
        "FAT (g)",
        "TRANS",
        "CHOLESTEROL",
        "SODIUM",
        "CARBOHYDATES",
        "DIETARY",
        "FIBRE (g)",
        "PROTEIN",
        "SUGAR",
    }
    items = []
    current_category = None
    for line in normalize_lines(text):
        if line in heading_blacklist or line == "S.24_05.15_ALL":
            continue
        if is_heading_candidate(line) and not row_re.match(line):
            current_category = line
            continue
        match = row_re.match(line)
        if not match:
            continue
        name = clean_text(match.group("name"))
        items.append(
            make_item(
                restaurant_id=restaurant_id,
                restaurant_name=restaurant_name,
                source_path=source_path,
                item_name=name,
                category=current_category,
                portion=f"{as_int_if_whole(as_float(match.group('serving')))} g",
                calories=as_float(match.group("calories")),
                protein_g=as_float(match.group("protein")),
                carbs_g=as_float(match.group("carbs")),
                fat_g=as_float(match.group("fat")),
                sodium_mg=as_float(match.group("sodium")),
                sugar_g=as_float(match.group("sugar")),
            )
        )
    return dedupe_items(items)


def parse_noodlebox(text: str, *, restaurant_id: str, restaurant_name: str, source_path: Path) -> list[dict]:
    row_re = re.compile(
        rf"^(?P<name>.+?)\s+"
        rf"(?P<calories>{NUM_TOKEN})\s+"
        rf"(?P<carbs>{NUM_TOKEN})\s+"
        rf"(?P<protein>{NUM_TOKEN})\s+"
        rf"(?P<fat>{NUM_TOKEN})\s+"
        rf"(?P<trans>{NUM_TOKEN})\b.*$"
    )
    heading_blacklist = {
        "NOODLEBOX NUTRITION GUIDE",
        "Calories",
        "Carbs (g)",
        "Protien (g)",
        "Total Fats (g)",
        "Trans Fats (g)",
        "NUTS",
        "GLUTEN",
        "SHELLFISH",
        "DAIRY",
        "SESAME",
        "EGG",
        "GARLIC",
        "SOY",
    }
    items = []
    current_category = None
    for line in normalize_lines(text):
        if line in heading_blacklist:
            continue
        if line.isupper() and line not in heading_blacklist:
            current_category = line.title()
            continue
        match = row_re.match(line)
        if not match:
            continue
        raw_name = clean_text(match.group("name"))
        item_name, portion = split_trailing_portion(raw_name)
        items.append(
            make_item(
                restaurant_id=restaurant_id,
                restaurant_name=restaurant_name,
                source_path=source_path,
                item_name=item_name,
                category=current_category,
                portion=portion,
                calories=as_float(match.group("calories")),
                protein_g=as_float(match.group("protein")),
                carbs_g=as_float(match.group("carbs")),
                fat_g=as_float(match.group("fat")),
            )
        )
    return dedupe_items(items)


def parse_old_spaghetti_factory(text: str, *, restaurant_id: str, restaurant_name: str, source_path: Path) -> list[dict]:
    row_re = re.compile(
        rf"^(?P<name>.+?)\s+"
        rf"(?P<serving>{NUM_TOKEN})\s+"
        rf"(?P<calories>{NUM_TOKEN})\s+"
        rf"(?P<fat>{NUM_TOKEN})\s+"
        rf"(?P<saturated>{NUM_TOKEN})\s+"
        rf"(?P<trans>{NUM_TOKEN})\s+"
        rf"(?P<cholesterol>{NUM_TOKEN})\s+"
        rf"(?P<sodium>{NUM_TOKEN})\s+"
        rf"(?P<carbs>{NUM_TOKEN})\s+"
        rf"(?P<fibre>{NUM_TOKEN})\s+"
        rf"(?P<sugar>{NUM_TOKEN})\s+"
        rf"(?P<protein>{NUM_TOKEN})\s+"
        rf"(?P<vit_a>{NUM_TOKEN})\s+"
        rf"(?P<vit_c>{NUM_TOKEN})\s+"
        rf"(?P<calcium>{NUM_TOKEN})\s+"
        rf"(?P<iron>{NUM_TOKEN})\s*$"
    )
    heading_blacklist = {
        "NUTRITION GUIDE",
        "March 2023",
        "Serving Size",
        "(g)",
        "Calories",
        "(kCal)",
        "Total Fat",
        "Saturated Fat",
        "Trans Fat",
        "Cholesterol",
        "Sodium",
        "Carbohydrates",
        "Dietary Fibre",
        "Sugar",
        "Protein",
        "Vitamin A",
        "(%DV)",
        "Vitamin C",
        "Calcium",
        "Iron",
    }
    items = []
    current_category = None
    for line in normalize_lines(text):
        if line in heading_blacklist or line.startswith("The information in this guide"):
            continue
        if is_heading_candidate(line) and not row_re.match(line):
            current_category = line
            continue
        match = row_re.match(line)
        if not match:
            continue
        items.append(
            make_item(
                restaurant_id=restaurant_id,
                restaurant_name=restaurant_name,
                source_path=source_path,
                item_name=clean_text(match.group("name")),
                category=current_category,
                portion=f"{as_int_if_whole(as_float(match.group('serving')))} g",
                calories=as_float(match.group("calories")),
                protein_g=as_float(match.group("protein")),
                carbs_g=as_float(match.group("carbs")),
                fat_g=as_float(match.group("fat")),
                sodium_mg=as_float(match.group("sodium")),
                sugar_g=as_float(match.group("sugar")),
            )
        )
    return dedupe_items(items)


def parse_triple_os(text: str, *, restaurant_id: str, restaurant_name: str, source_path: Path) -> list[dict]:
    row_re = re.compile(
        rf"^(?P<name>.+?)\s+"
        rf"(?P<grams>{NUM_TOKEN})\s+"
        rf"(?P<calories>{NUM_TOKEN})\s+"
        rf"(?P<fat>{NUM_TOKEN})\s+"
        rf"(?P<saturated>{NUM_TOKEN})\s+"
        rf"(?P<trans>{NUM_TOKEN})\s+"
        rf"(?P<cholesterol>{NUM_TOKEN})\s+"
        rf"(?P<sodium>{NUM_TOKEN})\s+"
        rf"(?P<carbs>{NUM_TOKEN})\s+"
        rf"(?P<fibre>{NUM_TOKEN})\s+"
        rf"(?P<sugar>{NUM_TOKEN})\s+"
        rf"(?P<protein>{NUM_TOKEN})\s+"
        rf"(?P<vit_a>{NUM_TOKEN})\s+"
        rf"(?P<vit_c>{NUM_TOKEN})\s+"
        rf"(?P<calcium>{NUM_TOKEN})\s+"
        rf"(?P<iron>{NUM_TOKEN})\s*$"
    )
    items = []
    current_category = None
    for line in normalize_lines(text):
        if line.startswith("TRIPLE O'S NUTRITIONAL INFORMATION") or line.startswith("Updated June"):
            continue
        if line.startswith("TRIPLE O'S ") and line.isupper():
            current_category = clean_text(line.replace("TRIPLE O'S ", "").title())
            continue
        match = row_re.match(line)
        if not match:
            continue
        items.append(
            make_item(
                restaurant_id=restaurant_id,
                restaurant_name=restaurant_name,
                source_path=source_path,
                item_name=clean_text(match.group("name")),
                category=current_category,
                portion=f"{as_int_if_whole(as_float(match.group('grams')))} g",
                calories=as_float(match.group("calories")),
                protein_g=as_float(match.group("protein")),
                carbs_g=as_float(match.group("carbs")),
                fat_g=as_float(match.group("fat")),
                sodium_mg=as_float(match.group("sodium")),
                sugar_g=as_float(match.group("sugar")),
            )
        )
    return dedupe_items(items)


def looks_like_jugo_item_title(line: str) -> bool:
    if any(char.isdigit() for char in line):
        return False
    if "," in line:
        return False
    if line.startswith("*") or line.startswith("Our products"):
        return False
    if line in {
        "NU T RI T ION GUIDE",
        "SMOOTHIES",
        "FRESH ENERGY SMOOTHIES",
        "PROTEIN SMOOTHIES",
        "XTRA BENEFITS",
        "WELLNESS SHOT",
        "GRILLED CHEESE",
        "WRAPS",
        "SNACKS",
        "FRESH PRESSED JUICE",
    }:
        return False
    return len(line.split()) <= 6


def parse_jugo(text: str, *, restaurant_id: str, restaurant_name: str, source_path: Path) -> list[dict]:
    size_row_re = re.compile(
        rf"^(?P<size>(?:\d+\s*oz\.|2 oz\.|1? ?tbsp\.|scoop))\s+"
        rf"(?P<calories>{NUM_TOKEN})\s+"
        rf"(?P<protein>{NUM_TOKEN})\s*g?\s+"
        rf"(?P<fat>{NUM_TOKEN})\s*g?\s+"
        rf"(?P<carbs>{NUM_TOKEN})\s*g?\s+"
        rf"(?P<fibre>{NUM_TOKEN})\s*g?(?:\s+.*)?$",
        re.IGNORECASE,
    )
    no_size_row_re = re.compile(
        rf"^(?P<calories>{NUM_TOKEN})\s+"
        rf"(?P<protein>{NUM_TOKEN})\s*g?\s+"
        rf"(?P<fat>{NUM_TOKEN})\s*g?\s+"
        rf"(?P<carbs>{NUM_TOKEN})\s*g?\s+"
        rf"(?P<fibre>{NUM_TOKEN})\s*g?(?:\s+.*)?$",
        re.IGNORECASE,
    )
    section_map = {
        "SMOOTHIES": "Smoothies",
        "FRESH ENERGY SMOOTHIES": "Fresh Energy Smoothies",
        "PROTEIN SMOOTHIES": "Protein Smoothies",
        "WELLNESS SHOT": "Wellness Shot",
        "GRILLED CHEESE": "Grilled Cheese",
        "WRAPS": "Wraps",
        "SNACKS": "Snacks",
        "FRESH PRESSED JUICE": "Fresh Pressed Juice",
    }
    lines = normalize_lines(text)
    items = []
    current_category = None
    current_item = None
    current_description: list[str] = []
    expecting_size_rows = False
    expecting_value_row = False

    for line in lines:
        if line == "NU T RI T ION GUIDE" or line.startswith("Our products may contain"):
            continue

        if line in section_map:
            current_category = section_map[line]
            current_item = None
            current_description = []
            expecting_size_rows = False
            expecting_value_row = False
            continue

        if line.startswith("SIZE CALORIES PROTEIN FAT CARBS FIBRE"):
            expecting_size_rows = True
            expecting_value_row = False
            continue

        if line == "CALORIES PROTEIN FAT CARBS FIBRE":
            expecting_value_row = True
            expecting_size_rows = False
            continue

        if expecting_size_rows:
            match = size_row_re.match(line)
            if match and current_item and current_category:
                items.append(
                    make_item(
                        restaurant_id=restaurant_id,
                        restaurant_name=restaurant_name,
                        source_path=source_path,
                        item_name=current_item,
                        category=current_category,
                        portion=clean_text(match.group("size")),
                        summary=" ".join(current_description) if current_description else None,
                        calories=as_float(match.group("calories")),
                        protein_g=as_float(match.group("protein")),
                        carbs_g=as_float(match.group("carbs")),
                        fat_g=as_float(match.group("fat")),
                    )
                )
                continue
            expecting_size_rows = False

        if expecting_value_row:
            match = no_size_row_re.match(line)
            if match and current_item and current_category:
                items.append(
                    make_item(
                        restaurant_id=restaurant_id,
                        restaurant_name=restaurant_name,
                        source_path=source_path,
                        item_name=current_item,
                        category=current_category,
                        summary=" ".join(current_description) if current_description else None,
                        calories=as_float(match.group("calories")),
                        protein_g=as_float(match.group("protein")),
                        carbs_g=as_float(match.group("carbs")),
                        fat_g=as_float(match.group("fat")),
                    )
                )
                expecting_value_row = False
                continue
            expecting_value_row = False

        if looks_like_jugo_item_title(line):
            current_item = line
            current_description = []
            continue

        if current_item:
            current_description.append(line)

    return dedupe_items(items)


def manual_subway_items(source_path: Path) -> list[dict]:
    # The provided Subway PDF is an image-only export, so this is a small manual seed
    # pulled from the visible rows in the concept source image.
    restaurant_id = "subway"
    restaurant_name = "Subway"
    source_uri = source_path
    rows = [
        ("Steak & Bacon", "Sandwiches", '6"', 600, 32, 46, 18, 1480, 3),
        ("Bourbon Brisket", "Sandwiches", '6"', 690, 34, 65, 31, 1600, 13),
        ("Bourbon BBQ Steak & Cheddar", "Sandwiches", '6"', 520, 18, 55, 8, 1230, 6),
        ("Chicken Ranch", "Sandwiches", '6"', 560, 26, 47, 20, 1140, 3),
        ("Piri-Piri Chicken", "Sandwiches", '6"', 510, 23, 52, 12, 740, 2),
        ("Black Forest Ham", "Sandwiches", '6"', 290, 5, 44, 7, 870, 4),
        ("Cold Cut Combo", "Sandwiches", '6"', 400, 18, 43, 16, 930, 7),
        ("Italian B.M.T.", "Sandwiches", '6"', 410, 17, 45, 21, 1470, 5),
        ("Meatball Marinara", "Sandwiches", '6"', 460, 18, 64, 24, 1170, 5),
        ("Pizza Sub", "Sandwiches", '6"', 430, 20, 54, 18, 1050, 4),
        ("Rotisserie-Style Chicken", "Sandwiches", '6"', 320, 5, 45, 24, 650, 4),
        ("Steak & Cheese", "Sandwiches", '6"', 360, 10, 51, 24, 1120, 4),
        ("Sweet Onion Chicken Teriyaki", "Sandwiches", '6"', 370, 5, 43, 24, 920, 10),
        ("Turkey Breast", "Sandwiches", '6"', 290, 5, 40, 17, 860, 2),
        ("Veggie Delite", "Sandwiches", '6"', 220, 3, 36, 10, 360, 2),
        ("Chicken Ranch", "Wraps", "1 wrap", 650, 31, 44, 31, 1340, 7),
        ("Grilled Chicken", "Wraps", "1 wrap", 450, 17, 55, 21, 1030, 4),
        ("Rotisserie-Style Chicken", "Wraps", "1 wrap", 490, 19, 53, 26, 960, 3),
        ("Steak & Cheese", "Wraps", "1 wrap", 510, 22, 55, 24, 1420, 5),
        ("Veggie Delite", "Wraps", "1 wrap", 390, 15, 50, 9, 330, 4),
        ("Black Forest Ham", "Salads", "1 salad", 140, 3, 12, 11, 590, 1),
        ("Cold Cut Combo", "Salads", "1 salad", 240, 17, 15, 15, 620, 5),
        ("Italian B.M.T.", "Salads", "1 salad", 240, 16, 14, 15, 1080, 4),
        ("Rotisserie-Style Chicken", "Salads", "1 salad", 170, 4, 10, 23, 340, 3),
        ("Steak & Cheese", "Salads", "1 salad", 260, 21, 10, 18, 780, 4),
        ("Sweet Onion Chicken Teriyaki", "Salads", "1 salad", 160, 4, 8, 17, 760, 3),
        ("Tuna (Includes Mayonnaise)", "Salads", "1 salad", 280, 21, 10, 18, 380, 4),
        ("Turkey Breast", "Salads", "1 salad", 120, 3, 4, 12, 570, 1),
        ("Veggie Delite", "Salads", "1 salad", 50, 1, 5, 2, 75, 1),
    ]
    items = []
    for item_name, category, portion, calories, fat, carbs, protein, sodium, sugar in rows:
        items.append(
            make_item(
                restaurant_id=restaurant_id,
                restaurant_name=restaurant_name,
                source_path=source_uri,
                item_name=item_name,
                category=category,
                portion=portion,
                calories=calories,
                protein_g=protein,
                carbs_g=carbs,
                fat_g=fat,
                sodium_mg=sodium,
                sugar_g=sugar,
            )
        )
    return dedupe_items(items)


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    RAW_TEXT_DIR.mkdir(parents=True, exist_ok=True)
    BY_RESTAURANT_DIR.mkdir(parents=True, exist_ok=True)

    parser_lookup: dict[str, Callable[..., list[dict]]] = {
        "parse_aw": parse_aw,
        "parse_chucks": parse_chucks,
        "parse_jugo": parse_jugo,
        "parse_moxies": parse_moxies,
        "parse_noodlebox": parse_noodlebox,
        "parse_old_spaghetti_factory": parse_old_spaghetti_factory,
        "parse_triple_os": parse_triple_os,
    }

    all_items: list[dict] = []
    parse_summary = {
        "restaurants": {},
        "notes": [
            "restaurant_id values are franchise-level, not location-level",
            "price_cad is left null because the nutrition PDFs rarely include price",
            "partial_data is true whenever one or more core fields are missing",
            "Subway.pdf was image-only, so its entries were seeded manually from the visible table",
        ],
    }

    for pdf_path in sorted(PDF_DIR.glob("*.pdf")):
        if pdf_path.name == "Subway.pdf":
            text = ""
            items = manual_subway_items(pdf_path)
            write_text(RAW_TEXT_DIR / f"{pdf_path.stem}.txt", text)
            parse_summary["restaurants"]["subway"] = {
                "restaurant_name": "Subway",
                "source_pdf": pdf_path.name,
                "parsed_items": len(items),
                "parser": "manual_subway_items",
            }
            all_items.extend(items)
            continue

        config = PDF_CONFIG.get(pdf_path.name)
        if not config:
            continue

        text = extract_text(pdf_path)
        write_text(RAW_TEXT_DIR / f"{pdf_path.stem}.txt", text)

        parser = parser_lookup[config["parser"]]
        items = parser(
            text,
            restaurant_id=config["restaurant_id"],
            restaurant_name=config["restaurant_name"],
            source_path=pdf_path,
        )
        parse_summary["restaurants"][config["restaurant_id"]] = {
            "restaurant_name": config["restaurant_name"],
            "source_pdf": pdf_path.name,
            "parsed_items": len(items),
            "parser": config["parser"],
        }
        all_items.extend(items)

    all_items = sorted(dedupe_items(all_items), key=lambda item: (item["restaurant_id"], item["item_name"], item["portion"] or ""))
    grouped: dict[str, list[dict]] = {}
    for item in all_items:
        grouped.setdefault(item["restaurant_id"], []).append(item)

    write_json(DATA_DIR / "menu_items.json", all_items)
    for restaurant_id, items in grouped.items():
        write_json(BY_RESTAURANT_DIR / f"{restaurant_id}.json", items)
    write_json(DATA_DIR / "parse_summary.json", parse_summary)

    print(json.dumps(parse_summary, indent=2))
    print(f"Total items written: {len(all_items)}")


if __name__ == "__main__":
    main()
