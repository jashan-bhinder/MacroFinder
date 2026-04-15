"""
MacroFinder v1.0 — Database Models
MongoDB document templates matching the finalized schema.
"""

from datetime import datetime, timezone


def now():
    return datetime.now(timezone.utc).isoformat()


def create_user(name, email, password_hash, role="user"):
    return {
        "_id": None,
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "role": role,
        "phone": None,
        "saved_items": [],
        "saved_restaurants": [],
        "diet_preferences": [],
        "managed_restaurants": [],
        "permissions": [],
        "created_at": now(),
        "updated_at": now(),
    }


def create_managed_restaurant(name, slug):
    return {
        "restaurant_slug": slug,
        "restaurant_name": name,
        "verified": False,
        "status": "pending",
        "franchise_type": "",
        "cuisine_tags": [],
        "pdf_file": None,
        "pdf_status": "not_submitted",
    }


def create_restaurant(name, slug):
    return {
        "_id": f"rest_{slug}",
        "name": name,
        "slug": slug,
        "description": None,
        "website_url": None,
        "menu_url": None,
        "tags": [],
        "categories": [],
        "nutrition_pdf": None,
        "image_url": None,
        "stats": {
            "item_count": 0,
            "avg_protein_g": None,
            "avg_calories": None,
        },
        "status": "active",
        "created_at": now(),
        "updated_at": now(),
    }


def create_item(name, restaurant_name, restaurant_slug, category):
    return {
        "_id": None,
        "restaurant_name": restaurant_name,
        "restaurant_slug": restaurant_slug,
        "name": name,
        "category": category,
        "macros": {
            "calories": None,
            "protein_g": None,
            "fat_g": None,
            "carbs_g": None,
            "sodium_mg": None,
            "sugar_g": None,
        },
        "price_cad": None,
        "portion": None,
        "image_url": None,
        "description": None,
        "data_quality": {
            "missing_fields": [],
            "source_pdf": None,
        },
        "status": "active",
        "created_at": now(),
        "updated_at": now(),
    }


def create_request(req_type, submitted_by_id, submitted_by_name, submitted_by_email, data):
    return {
        "_id": None,
        "type": req_type,
        "status": "pending" if req_type != "reported_issue" else "open",
        "submitted_at": now(),
        "reviewed_at": None,
        "reviewed_by": None,
        "submitted_by": {
            "user_id": submitted_by_id,
            "name": submitted_by_name,
            "email": submitted_by_email,
        },
        "data": data,
    }


def restaurant_creation_data(
        restaurant_name,
        owner_role,
        phone,
        website_url,
        menu_url,
        menu_note,
        nutrition_pdf,
        has_image,
        sample_items,
):
    return {
        "restaurant_name": restaurant_name,
        "owner_role": owner_role,
        "phone": phone,
        "website_url": website_url,
        "menu_url": menu_url,
        "menu_note": menu_note,
        "nutrition_pdf": nutrition_pdf,
        "has_image": has_image,
        "sample_items": sample_items,
    }


def role_upgrade_data(restaurant_name, role_claimed, note):
    return {
        "restaurant_name": restaurant_name,
        "role_claimed": role_claimed,
        "note": note,
    }


def change_request_data(
        restaurant_name,
        change_scope,
        change_field,
        item_name,
        description,
        pdf_file,
):
    return {
        "restaurant_name": restaurant_name,
        "change_scope": change_scope,
        "change_field": change_field,
        "item_name": item_name,
        "description": description,
        "pdf_file": pdf_file,
    }


def reported_issue_data(item_key, restaurant_name, issue_type, note):
    return {
        "item_key": item_key,
        "restaurant_name": restaurant_name,
        "issue_type": issue_type,
        "note": note,
    }


def create_task(
        owner_id,
        restaurant_name,
        scope,
        task_type,
        description,
        item_name=None,
        item_category=None,
        admin_note=None,
):
    return {
        "_id": None,
        "owner_id": owner_id,
        "restaurant_name": restaurant_name,
        "scope": scope,
        "item_name": item_name,
        "item_category": item_category,
        "task_type": task_type,
        "description": description,
        "admin_note": admin_note,
        "status": "pending",
        "created_at": now(),
    }
