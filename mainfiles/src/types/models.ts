export type UserRole = "user" | "restaurant_owner" | "admin";

export interface ManagedRestaurantRecord {
    restaurant_slug: string;
    restaurant_name: string;
    verified: boolean;
    status: "active" | "pending";
    franchise_type: string;
    cuisine_tags: string[];
    pdf_file: string | null;
    pdf_status: "approved" | "pending" | "not_submitted";
}

export interface DbUser {
    _id: string;
    name: string;
    email: string;
    password_hash: string | null;
    role: UserRole;
    phone: string | null;
    saved_items: string[];
    saved_restaurants: string[];
    diet_preferences: string[];
    managed_restaurants: ManagedRestaurantRecord[];
    permissions: string[];
    created_at: string;
    updated_at: string;
}

export interface RestaurantStatsRecord {
    item_count: number;
    avg_protein_g: number | null;
    avg_calories: number | null;
}

export interface DbRestaurant {
    _id: string;
    name: string;
    slug: string;
    description: string | null;
    website_url: string | null;
    menu_url: string | null;
    tags: string[];
    categories: string[];
    nutrition_pdf: string | null;
    image_url: string | null;
    stats: RestaurantStatsRecord;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface DbMacroBreakdown {
    calories: number | null;
    protein_g: number | null;
    fat_g: number | null;
    carbs_g: number | null;
    sodium_mg: number | null;
    sugar_g: number | null;
}

export interface DbItemDataQuality {
    missing_fields: string[];
    source_pdf: string | null;
}

export interface DbItem {
    _id: string | null;
    restaurant_name: string;
    restaurant_slug: string;
    name: string;
    category: string;
    macros: DbMacroBreakdown;
    price_cad: number | null;
    portion: string | null;
    image_url: string | null;
    description: string | null;
    data_quality: DbItemDataQuality;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface RequestSubmittedBy {
    user_id: string;
    name: string;
    email: string;
}

export interface RestaurantCreationSampleItem {
    name: string;
    category: string;
    price: string | null;
    protein_g: number | null;
    calories: number | null;
}

export interface RestaurantCreationRequestData {
    restaurant_name: string;
    owner_role: string;
    phone: string | null;
    website_url: string | null;
    menu_url: string | null;
    menu_note: string | null;
    nutrition_pdf: string | null;
    has_image: boolean;
    sample_items: RestaurantCreationSampleItem[];
}

export interface RoleUpgradeRequestData {
    restaurant_name: string;
    role_claimed: string;
    note: string | null;
}

export interface ChangeRequestData {
    restaurant_name: string;
    change_scope: "restaurant" | "item";
    change_field:
        | "rest_image"
        | "rest_description"
        | "rest_url"
        | "rest_pdf"
        | "item_image"
        | "item_nutrition";
    item_name: string | null;
    description: string | null;
    pdf_file: string | null;
}

export interface ReportedIssueRequestData {
    item_key: string | null;
    restaurant_name: string;
    issue_type: string;
    note: string | null;
}

export type DbRequestData =
    | RestaurantCreationRequestData
    | RoleUpgradeRequestData
    | ChangeRequestData
    | ReportedIssueRequestData;

export type DbRequestType =
    | "restaurant_creation"
    | "role_upgrade"
    | "change_request"
    | "reported_issue";

export type DbRequestStatus =
    | "pending"
    | "approved"
    | "denied"
    | "resolved"
    | "open";

export interface DbRequest<TData extends DbRequestData = DbRequestData> {
    _id: string | null;
    type: DbRequestType;
    status: DbRequestStatus;
    submitted_at: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
    submitted_by: RequestSubmittedBy;
    data: TData;
}

export interface DbTask {
    _id: string | null;
    owner_id: string;
    restaurant_name: string;
    scope: "restaurant" | "item";
    item_name: string | null;
    item_category: string | null;
    task_type:
        | "request_image"
        | "request_description"
        | "request_pdf"
        | "request_url";
    description: string;
    admin_note: string | null;
    status: "pending" | "completed" | string;
    created_at: string;
}

export interface MacroBreakdown {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sodium_mg: number;
    sugar_g: number;
}

export interface DatabaseMacroBreakdown {
    calories: number | null;
    protein_g: number | null;
    fat_g: number | null;
    carbs_g: number | null;
    sodium_mg: number | null;
    sugar_g: number | null;
}

export interface DatabaseItem {
    _id: string;
    restaurant_name: string;
    restaurant_slug: string;
    name: string;
    category: string;
    macros: DatabaseMacroBreakdown;
    price_cad: number | null;
    portion: string | null;
    image_url: string | null;
    description: string | null;
    data_quality: {
        missing_fields: string[];
        source_pdf: string | null;
    };
    status: "active" | "inactive" | "pending";
    created_at: string;
    updated_at: string;
}

export interface DatabaseRestaurant {
    _id: string;
    name: string;
    slug: string;
    description: string | null;
    website_url: string | null;
    menu_url: string | null;
    tags: string[];
    categories: string[];
    nutrition_pdf: string | null;
    image_url: string | null;
    stats: {
        item_count: number;
        avg_protein_g: number | null;
        avg_calories: number | null;
    };
    status: "active" | "inactive" | "pending";
    created_at: string;
    updated_at: string;
}

export interface ManagedRestaurant {
    restaurant_slug: string;
    restaurant_name: string;
    verified: boolean;
    status: "active" | "pending";
    franchise_type: string;
    cuisine_tags: string[];
    pdf_file: string | null;
    pdf_status: "approved" | "pending" | "not_submitted";
}

export interface DatabaseUser {
    _id: string;
    name: string;
    email: string;
    password_hash: string | null;
    role: "user" | "restaurant_owner" | "admin";
    phone: string | null;
    saved_items: string[];
    saved_restaurants: string[];
    diet_preferences: string[];
    managed_restaurants: ManagedRestaurant[];
    permissions: string[];
    created_at: string;
    updated_at: string;
}

export type DatabaseRequestType =
    | "restaurant_creation"
    | "role_upgrade"
    | "change_request"
    | "reported_issue";

export type DatabaseRequestStatus =
    | "pending"
    | "approved"
    | "denied"
    | "resolved"
    | "open";

export interface DatabaseRequest {
    _id: string;
    type: DatabaseRequestType;
    status: DatabaseRequestStatus;
    submitted_at: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
    submitted_by: {
        user_id: string;
        name: string;
        email: string;
    };
    data:
        | {
        restaurant_name: string;
        owner_role: string;
        phone: string | null;
        website_url: string | null;
        menu_url: string | null;
        menu_note: string | null;
        nutrition_pdf: string | null;
        has_image: boolean;
        sample_items: Array<{
            name: string;
            category: string;
            price: string | null;
            protein_g: number | null;
            calories: number | null;
        }>;
    }
        | {
        restaurant_name: string;
        role_claimed: string;
        note: string | null;
    }
        | {
        restaurant_name: string;
        change_scope: "restaurant" | "item";
        change_field:
            | "rest_image"
            | "rest_description"
            | "rest_url"
            | "rest_pdf"
            | "item_image"
            | "item_nutrition";
        item_name: string | null;
        description: string;
        pdf_file: string | null;
    }
        | {
        item_key: string | null;
        restaurant_name: string;
        issue_type: string;
        note: string | null;
    };
}

export interface DatabaseTask {
    _id: string;
    owner_id: string;
    restaurant_name: string;
    scope: "restaurant" | "item";
    item_name: string | null;
    item_category: string | null;
    task_type:
        | "request_image"
        | "request_description"
        | "request_pdf"
        | "request_url";
    description: string;
    admin_note: string | null;
    status: "pending" | "submitted";
    created_at: string;
}

export interface DataQuality {
    partial_data: boolean;
    missing_fields: string[];
    imputed_fields?: string[];
    presentation_ready?: boolean;
    source_pdf?: string | null;
}

export interface MenuItem {
    item_id: string | null;
    restaurant_id: string;
    restaurant_name: string;
    item_name: string;
    summary: string;
    unique_key: string;
    category: string;
    category_path: string[];
    portion: string;
    price_cad: number;
    availability_status: string;
    tags: string[];
    diet_tags: string[];
    macros: MacroBreakdown;
    data_quality: DataQuality;
    source_url: string;
    source_type: string;
    image_url: string;
    image_source_url: string | null;
    image_status: string;
    last_verified_at: string | null;
    scraped_at: string;
    updated_at: string;
}

export interface RestaurantSummary {
    restaurant_id: string;
    restaurant_name: string;
    franchise_key: string;
    item_count: number;
    categories: string[];
    avg_protein_g: number;
    avg_price_cad: number;
    avg_protein_per_dollar: number;
    min_price_cad: number;
    max_price_cad: number;
    hero_item_key: string;
    image_url: string;
    description: string;
    tags: string[];
}

export interface UserProfile {
    user_id: string;
    full_name: string;
    email: string;
    password_hash: string | null;
    account_type: UserRole;
    saved_item_keys: string[];
    saved_restaurant_ids: string[];
    restaurant_access_request_ids: string[];
    status: "active" | "disabled";
    created_at: string;
    updated_at: string;
}

export interface RestaurantOwnerProfile {
    owner_profile_id: string;
    user_id: string;
    display_name: string;
    role_title: string;
    business_email: string;
    phone: string | null;
    managed_restaurant_ids: string[];
    verification_status: "pending" | "verified";
    access_status: "pending_review" | "approved" | "rejected";
    created_at: string;
    updated_at: string;
}

export interface AdminProfile {
    admin_profile_id: string;
    user_id: string;
    display_name: string;
    email: string;
    permissions: string[];
    status: "active" | "disabled";
    created_at: string;
    updated_at: string;
}

export interface RestaurantAccessRequestSampleItem {
    item_name: string;
    category: string;
    price_cad: number | null;
    protein_g: number | null;
    calories: number | null;
    sodium_mg: number | null;
    image_file_name: string | null;
}

export interface RestaurantAccessRequest {
    request_id: string;
    requester_user_id: string;
    restaurant_name: string;
    owner_full_name: string;
    owner_role: string;
    restaurant_email: string;
    owner_phone: string | null;
    website_url: string;
    menu_url: string;
    owner_note: string | null;
    uploaded_files: {
        nutrition_pdf: { file_name: string | null; file_url: string | null };
        restaurant_image: { file_name: string | null; file_url: string | null };
        menu_export: { file_name: string | null; file_url: string | null };
    };
    sample_items: RestaurantAccessRequestSampleItem[];
    checklist: {
        official_source_confirmed: boolean;
        review_before_launch_acknowledged: boolean;
    };
    status: "draft" | "pending_review" | "approved" | "needs_changes" | "rejected";
    admin_notes: string | null;
    reviewed_by_admin_id: string | null;
    submitted_at: string | null;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface OwnerSubmission {
    submission_id: string;
    restaurant_id: string;
    owner_profile_id: string;
    submission_type: "pdf_refresh" | "menu_change" | "photo_update";
    item_key: string | null;
    item_name: string | null;
    change_type: string | null;
    note: string | null;
    attachment: {
        file_name: string | null;
        file_url: string | null;
        file_type: string | null;
    };
    requested_changes: Record<string, string | number | boolean | null>;
    status: "pending_review" | "approved" | "needs_changes";
    admin_notes: string | null;
    reviewed_by_admin_id: string | null;
    submitted_at: string | null;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ReportedIssue {
    issue_id: string;
    reporter_user_id: string;
    reporter_type: "user" | "admin";
    restaurant_id: string;
    restaurant_name: string;
    item_key: string | null;
    item_name: string | null;
    issue_type: string;
    note: string | null;
    attachment: {
        file_name: string | null;
        file_url: string | null;
        file_type: string | null;
    };
    listing_snapshot: {
        shown_price_cad: number | null;
        shown_category: string | null;
        last_updated_at: string | null;
        source_url: string | null;
    };
    status: "open" | "in_progress" | "resolved";
    resolution_note: string | null;
    resolved_by_admin_id: string | null;
    submitted_at: string | null;
    resolved_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface DataAudit {
    total_items: number;
    total_restaurants: number;
    duplicate_unique_keys: string[];
    missing_required_keys: string[];
    franchise_ids_ready: boolean;
}

export interface AppBootstrapData {
    items: MenuItem[];
    restaurants: RestaurantSummary[];
    audit: DataAudit;
}

export type SortMode =
    | "best-value"
    | "highest-protein"
    | "lowest-calories"
    | "lowest-sodium";
