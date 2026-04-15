# MacroFinder — Database Schema (v1.0)

MongoDB collections based on what the app actually uses. Nothing speculative — every field here is read or written by the current UI.

---

## Collection: `users`

Single collection for all three roles. Role determines which fields are populated.

```json
{
  "_id": "user_001",
  "name": "Jordan Lee",
  "email": "jordan@example.com",
  "password_hash": "hashed_value",
  "role": "user | restaurant_owner | admin",
  "phone": null,

  "saved_items": ["A&W::5 Pc Hand-Breaded Chicken Tenders"],
  "saved_restaurants": ["Chuck's Roadhouse", "Moxies"],
  "diet_preferences": ["high-protein"],

  "managed_restaurants": [
    {
      "restaurant_slug": "moxies",
      "restaurant_name": "Moxies",
      "verified": true,
      "status": "active | pending",
      "franchise_type": "Casual Dining",
      "cuisine_tags": ["Canadian", "Steaks"],
      "pdf_file": "moxies_ca_nutrition.pdf",
      "pdf_status": "approved | pending | not_submitted"
    }
  ],

  "permissions": ["upload_pdf", "edit_items", "view_reports"],

  "created_at": "2025-11-15T08:00:00Z",
  "updated_at": "2026-04-10T00:00:00Z"
}
```

**Notes:**
- `saved_items` stores keys as `"Restaurant::Item Name"` — matches the `ik()` function in the frontend.
- `saved_restaurants` stores franchise names (not IDs) since we work at franchise level.
- `managed_restaurants`, `permissions` are empty arrays for regular users and admins.
- `phone` is only populated for owners.
- `diet_preferences` is only populated for users.
- Passwords will be bcrypt hashed in production. Plaintext only for current demo.

---

## Collection: `restaurants`

One document per franchise. No location data.

```json
{
  "_id": "rest_moxies",
  "name": "Moxies",
  "slug": "moxies",
  "description": "Canadian casual dining with steaks, pastas, bowls, and handhelds.",
  "website_url": "https://www.moxies.com",
  "menu_url": "https://www.moxies.com/menu",
  "tags": ["Casual Dining", "Canadian", "Steaks", "Pasta"],
  "categories": ["Appetizers", "Soup & Salads", "Steaks", "Mains", "Pastas & Bowls", "Handhelds", "Sides"],

  "nutrition_pdf": "moxies_ca_nutrition.pdf",
  "image_url": null,

  "stats": {
    "item_count": 61,
    "avg_protein_g": 27.7,
    "avg_calories": 649
  },

  "status": "active",
  "created_at": "2025-11-20T09:00:00Z",
  "updated_at": "2026-04-10T00:00:00Z"
}
```

**Notes:**
- `categories` is the list of actual menu categories from the PDF (used for filter chips on the restaurant page).
- `stats` is precomputed from items. Recompute on item changes.
- `nutrition_pdf` is a filename reference — actual file stored in GridFS.
- `image_url` is null for now. Will point to GridFS or CDN when owners upload images.

---

## Collection: `items`

One document per menu item. This is the largest collection (~310 documents currently).

```json
{
  "_id": "item_moxies_steak_frites",
  "restaurant_name": "Moxies",
  "restaurant_slug": "moxies",
  "name": "Steak Frites",
  "category": "Steaks",

  "macros": {
    "calories": 370,
    "protein_g": 44,
    "fat_g": 20,
    "carbs_g": 2,
    "sodium_mg": 1400,
    "sugar_g": 0
  },

  "price_cad": null,
  "portion": "217g",
  "image_url": null,
  "description": null,

  "data_quality": {
    "missing_fields": ["price_cad"],
    "source_pdf": "moxies_ca_nutrition.pdf"
  },

  "status": "active",
  "created_at": "2025-12-01T00:00:00Z",
  "updated_at": "2025-12-01T00:00:00Z"
}
```

**Notes:**
- `macros` fields can be `null` when the PDF didn't provide them (Jugo Juice and Noodlebox lack sodium/sugar).
- `price_cad` is null everywhere right now. Will populate when owners or scraping adds prices.
- `protein_per_calorie` is NOT stored — computed on read as `protein_g / calories`. The frontend already does this.
- `image_url` and `description` are null. These are the fields owners fill in via to-do tasks.
- `_id` format: `item_{restaurant_slug}_{slugified_item_name}`.

---

## Collection: `requests`

Single collection for ALL request types. The `type` field determines the shape.

```json
{
  "_id": "req_001",
  "type": "restaurant_creation | role_upgrade | change_request | reported_issue",
  "status": "pending | approved | denied | resolved | open",
  "submitted_at": "2026-04-09T14:00:00Z",
  "reviewed_at": null,
  "reviewed_by": null,

  "submitted_by": {
    "user_id": "owner_001",
    "name": "Maria Fontaine",
    "email": "maria@moxies.com"
  },

  "data": {}
}
```

### `type: "restaurant_creation"`

Owner submitting a new restaurant for admin review.

```json
{
  "data": {
    "restaurant_name": "Noodlebox",
    "owner_role": "Owner",
    "phone": "604-555-0391",
    "website_url": "https://www.noodlebox.ca",
    "menu_url": "https://www.noodlebox.ca/menu",
    "menu_note": "Asian-inspired noodle and rice boxes with customizable proteins.",
    "nutrition_pdf": "noodlebox_nutrition.pdf",
    "has_image": true,
    "sample_items": [
      {
        "name": "Crispy Shanghai Chicken Box",
        "category": "Boxes",
        "price": "15.49",
        "protein_g": 28,
        "calories": 680
      }
    ]
  }
}
```

### `type: "role_upgrade"`

User requesting restaurant owner access.

```json
{
  "data": {
    "restaurant_name": "Freshii",
    "role_claimed": "Owner",
    "note": "I own three Freshii locations in Calgary. Would like to upload our nutrition PDF."
  }
}
```

### `type: "change_request"`

Owner requesting a change to their restaurant or a menu item. Always includes a PDF.

```json
{
  "data": {
    "restaurant_name": "Moxies",
    "change_scope": "restaurant | item",
    "change_field": "rest_image | rest_description | rest_url | rest_pdf | item_image | item_nutrition",
    "item_name": null,
    "description": "Update restaurant hero image — branding photo PDF attached",
    "pdf_file": "moxies_branding_2026.pdf"
  }
}
```

### `type: "reported_issue"`

User reporting a problem with an item.

```json
{
  "data": {
    "item_key": "Moxies::Rib Eye",
    "restaurant_name": "Moxies",
    "issue_type": "Wrong nutrition info | Wrong price | Item discontinued | Wrong category | Duplicate listing | Other",
    "note": "Protein count seems too high at 100g for a 388g serving."
  }
}
```

---

## Collection: `tasks`

Admin-created tasks sent to restaurant owners. Owner uploads a PDF to complete. Completed tasks are deleted (not archived).

```json
{
  "_id": "task_001",
  "owner_id": "owner_001",
  "restaurant_name": "Moxies",

  "scope": "restaurant | item",
  "item_name": "Rib Eye",
  "item_category": "Steaks",

  "task_type": "request_image | request_description | request_pdf | request_url",
  "description": "Upload a photo for Rib Eye",
  "admin_note": "The current protein value looks too high — please verify against your nutrition sheet.",

  "status": "pending",
  "created_at": "2026-04-10T00:00:00Z"
}
```

**Notes:**
