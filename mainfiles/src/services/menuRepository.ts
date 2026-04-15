import type { AppBootstrapData, MenuItem, RestaurantSummary } from "../types/models";

export interface MenuRepository {
    getBootstrapData(): Promise<AppBootstrapData>;
    listMenuItems(): Promise<MenuItem[]>;
    listRestaurants(): Promise<RestaurantSummary[]>;
    getMenuItemByKey(uniqueKey: string): Promise<MenuItem | null>;
    getRestaurantById(restaurantId: string): Promise<RestaurantSummary | null>;
}

