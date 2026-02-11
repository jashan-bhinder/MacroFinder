from flask import Blueprint, request, jsonify
from db import menu_items

api = Blueprint("api", __name__)

@api.get("/health")
def health():
    return {"status": "ok"}

@api.post("/items")
def add_item():
    data = request.json
    if not data:
        return {"error": "Missing JSON"}, 400

    menu_items.insert_one(data)
    return {"message": "Inserted"}, 201

@api.get("/items")
def get_items():
    items = list(menu_items.find({}, {"_id": 0}))
    return jsonify(items)
