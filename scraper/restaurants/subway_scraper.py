import re
import sys
from pathlib import Path
from datetime import datetime

sys.path.append(str(Path(__file__).resolve().parents[1]))

import requests
import pdfplumber

from item_template import create_empty_item
from api_client import BackendApiClient


class SubwayCanadaScraper:
    def __init__(self):
        self.restaurant_id = "subway_ca"
        self.restaurant_name = "Subway (Canada)"
        self.source_url = "https://www.subway.com/en-ca/menunutrition/nutrition"
        self.pdf_url = "https://www.subway.com/en-ca/-/media/northamerica/canada/nutrition/2025/can-nutrition-eng-8%2C-d-%2C28%2C-d-%2C25.pdf"

    def download_pdf(self, url: str, save_path: Path):
        save_path.parent.mkdir(parents=True, exist_ok=True)

        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=120)
        response.raise_for_status()

        save_path.write_bytes(response.content)
        return save_path

    def extract_lines(self, pdf_path: Path):
        lines = []

        with pdfplumber.open(str(pdf_path)) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                for raw in text.splitlines():
                    cleaned = " ".join(raw.split())
                    if cleaned:
                        lines.append(cleaned)

        return lines

    def infer_portion(self, item_name: str):
        name = item_name.lower()

        if "salad" in name:
            return "salad"

        if "cookie" in name or "brownie" in name or "muffin" in name or "donut" in name:
            return "1 item"

        if "chips" in name:
            return "1 bag"

        if "soup" in name:
            return "1 bowl"

        if "bottle" in name or "can" in name:
            return "1 drink"

        return None

    def parse_candidate_row(self, line: str):
        numbers = re.findall(r"\d+(?:\.\d+)?", line)
        if len(numbers) < 6:
            return None

        name_split = re.split(r"\s+\d", line, maxsplit=1)
        if not name_split:
            return None

        item_name = name_split[0].strip()
        if not item_name or len(item_name) < 3:
            return None

        calories = self.to_int(numbers[0])
        if calories is None:
            return None

        fat_g = self.to_float(numbers[2]) if len(numbers) > 2 else None
        sodium_mg = self.to_int(numbers[6]) if len(numbers) > 6 else None
        carbs_g = self.to_float(numbers[7]) if len(numbers) > 7 else None
        sugar_g = self.to_float(numbers[9]) if len(numbers) > 9 else None
        protein_g = self.to_float(numbers[10]) if len(numbers) > 10 else None

        return {
            "item_name": item_name,
            "calories": calories,
            "protein_g": protein_g,
            "carbs_g": carbs_g,
            "fat_g": fat_g,
            "sodium_mg": sodium_mg,
            "sugar_g": sugar_g
        }

    def build_item(self, row: dict):
        item = create_empty_item()

        item["restaurant_id"] = self.restaurant_id
        item["restaurant_name"] = self.restaurant_name
        item["item_name"] = row["item_name"].strip()
        item["category"] = None
        item["portion"] = self.infer_portion(row["item_name"])
        portion = (item["portion"] or "").strip()
        item["unique_key"] = f"{self.restaurant_id}|{item['item_name']}|{portion}".lower()
        item["price_cad"] = None
        item["source_url"] = self.pdf_url
        item["scraped_at"] = datetime.utcnow().isoformat()

        item["macros"]["calories"] = row["calories"]
        item["macros"]["protein_g"] = row["protein_g"]
        item["macros"]["carbs_g"] = row["carbs_g"]
        item["macros"]["fat_g"] = row["fat_g"]
        item["macros"]["sodium_mg"] = row["sodium_mg"]
        item["macros"]["sugar_g"] = row["sugar_g"]

        return item

    def scrape(self):
        pdf_path = self.download_pdf(self.pdf_url, Path("data/subway_nutrition.pdf"))
        lines = self.extract_lines(pdf_path)

        results = []
        seen = set()

        for line in lines:
            row = self.parse_candidate_row(line)
            if not row:
                continue

            key = row["item_name"].lower()
            if key in seen:
                continue

            seen.add(key)
            results.append(self.build_item(row))

        return results


    def to_int(self, value):
        try:
            return int(float(value))
        except Exception:
            return None

    def to_float(self, value):
        try:
            return float(value)
        except Exception:
            return None


if __name__ == "__main__":
    scraper = SubwayCanadaScraper()
    items = scraper.scrape()

    print("Items scraped:", len(items))

    api = BackendApiClient("http://127.0.0.1:5000")
    ok, fail = api.add_items(items)

    print("Sent to backend:", ok, "ok,", fail, "failed")
