import requests


class BackendApiClient:
    def __init__(self, base_url="http://127.0.0.1:5000"):
        self.base_url = base_url.rstrip("/")

    def add_item(self, item: dict):
        url = f"{self.base_url}/items"
        response = requests.post(url, json=item, timeout=30)
        return response.status_code, response.text

    def add_items(self, items: list[dict]):
        ok = 0
        fail = 0

        for item in items:
            status, _ = self.add_item(item)
            if 200 <= status < 300:
                ok += 1
            else:
                fail += 1

        return ok, fail
