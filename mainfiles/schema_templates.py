"""
Presentation-oriented template helpers used by the PDF extraction scripts.

Canonical backend document templates now live in `models.py` and `schema.md`.
"""

from datetime import datetime, UTC

from models import (  # noqa: F401
    change_request_data,
    create_item,
    create_managed_restaurant,
    create_request,
    create_restaurant,
    create_task,
    create_user,
    reported_issue_data,
    restaurant_creation_data,
    role_upgrade_data,
)


def _now():
    return datetime.now(UTC).isoformat()


def create_empty_menu_item():
    now = _now()
    return {
        "item_id": None,
        "restaurant_id": None,
        "restaurant_name": None,
        "item_name": None,
        "summary": None,
        "unique_key": None,
        "category": None,
        "category_path": [],
        "portion": None,
        "price_cad": None,
        "availability_status": "active",
        "tags": [],
        "diet_tags": [],
        "macros": {
            "calories": None,
            "protein_g": None,
            "carbs_g": None,
            "fat_g": None,
            "sodium_mg": None,
            "sugar_g": None,
        },
        "data_quality": {
            "partial_data": False,
            "missing_fields": [],
        },
        "source_url": None,
        "source_type": None,
        "image_url": None,
        "image_source_url": None,
        "image_status": "missing",
        "last_verified_at": None,
        "scraped_at": now,
        "updated_at": now,
    }


def create_empty_restaurant():
    now = _now()
    return {
        "restaurant_id": None,
        "restaurant_name": None,
        "slug": None,
        "short_description": None,
        "website_url": None,
        "menu_url": None,
        "contact_email": None,
        "phone": None,
        "locations": [],
        "tags": [],
        "top_categories": [],
        "image_url": None,
        "logo_url": None,
        "nutrition_source": {
            "source_type": None,
            "source_url": None,
            "file_name": None,
            "last_synced_at": None,
        },
        "stats_cache": {
            "tracked_item_count": 0,
            "avg_protein_g": None,
            "avg_protein_per_dollar": None,
            "price_range_cad": {
                "min": None,
                "max": None,
            },
        },
        "status": "active",
        "owner_profile_ids": [],
        "created_at": now,
        "updated_at": now,
    }


def create_empty_user_profile():
    now = _now()
    return {
        "user_id": None,
        "full_name": None,
        "email": None,
        "password_hash": None,
        "account_type": "user",
        "saved_item_keys": [],
        "saved_restaurant_ids": [],
        "restaurant_access_request_ids": [],
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }


def create_empty_restaurant_owner_profile():
    now = _now()
    return {
        "owner_profile_id": None,
        "user_id": None,
        "display_name": None,
        "role_title": None,
        "business_email": None,
        "phone": None,
        "managed_restaurant_ids": [],
        "verification_status": "pending",
        "access_status": "pending_review",
        "created_at": now,
        "updated_at": now,
    }


def create_empty_admin_profile():
    now = _now()
    return {
        "admin_profile_id": None,
        "user_id": None,
        "display_name": None,
        "email": None,
        "permissions": [
            "review_restaurant_requests",
            "review_owner_submissions",
            "review_reported_issues",
            "manage_restaurants",
            "manage_menu_items",
        ],
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }


def create_empty_access_request_sample_item():
    return {
        "item_name": None,
        "category": None,
        "price_cad": None,
        "protein_g": None,
        "calories": None,
        "sodium_mg": None,
        "image_file_name": None,
    }


def create_empty_restaurant_access_request():
    now = _now()
    return {
        "request_id": None,
        "requester_user_id": None,
        "restaurant_name": None,
        "owner_full_name": None,
        "owner_role": None,
        "restaurant_email": None,
        "owner_phone": None,
        "website_url": None,
        "menu_url": None,
        "owner_note": None,
        "uploaded_files": {
            "nutrition_pdf": {
                "file_name": None,
                "file_url": None,
            },
            "restaurant_image": {
                "file_name": None,
                "file_url": None,
            },
            "menu_export": {
                "file_name": None,
                "file_url": None,
            },
        },
        "sample_items": [
            create_empty_access_request_sample_item(),
            create_empty_access_request_sample_item(),
        ],
        "checklist": {
            "official_source_confirmed": False,
            "review_before_launch_acknowledged": False,
        },
        "status": "draft",
        "admin_notes": None,
        "reviewed_by_admin_id": None,
        "submitted_at": None,
        "reviewed_at": None,
        "created_at": now,
        "updated_at": now,
    }


def create_empty_owner_submission():
    now = _now()
    return {
        "submission_id": None,
        "restaurant_id": None,
        "owner_profile_id": None,
        "submission_type": None,
        "item_key": None,
        "item_name": None,
        "change_type": None,
        "note": None,
        "attachment": {
            "file_name": None,
            "file_url": None,
            "file_type": None,
        },
        "requested_changes": {},
        "status": "pending_review",
        "admin_notes": None,
        "reviewed_by_admin_id": None,
        "submitted_at": None,
        "reviewed_at": None,
        "created_at": now,
        "updated_at": now,
    }


def create_empty_reported_issue():
    now = _now()
    return {
        "issue_id": None,
        "reporter_user_id": None,
        "reporter_type": "user",
        "restaurant_id": None,
        "restaurant_name": None,
        "item_key": None,
        "item_name": None,
        "issue_type": None,
        "note": None,
        "attachment": {
            "file_name": None,
            "file_url": None,
            "file_type": None,
        },
        "listing_snapshot": {
            "shown_price_cad": None,
            "shown_category": None,
            "last_updated_at": None,
            "source_url": None,
        },
        "status": "open",
        "resolution_note": None,
        "resolved_by_admin_id": None,
        "submitted_at": None,
        "resolved_at": None,
        "created_at": now,
        "updated_at": now,
    }
