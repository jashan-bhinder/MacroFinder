import rawItems from "../../data/items.json";
import rawRestaurants from "../../data/restaurants.json";
import type {
    AppBootstrapData,
    DatabaseItem,
    DatabaseRestaurant,
    MenuItem,
    RestaurantSummary,
} from "../types/models";
import { auditMenuData } from "./dataAudit";
import type { MenuRepository } from "./menuRepository";
import { dbItemToMenuItem, dbRestaurantToSummary } from "./schemaAdapters";

const databaseItems = rawItems as DatabaseItem[];
const databaseRestaurants = rawRestaurants as DatabaseRestaurant[];
const menuItems = databaseItems.map(dbItemToMenuItem);
const restaurants = databaseRestaurants
    .map((restaurant) => dbRestaurantToSummary(restaurant, menuItems))
    .sort((left, right) => right.item_count - left.item_count);
const audit = auditMenuData(menuItems, restaurants);

export const mockMenuRepository: MenuRepository = {
    async getBootstrapData(): Promise<AppBootstrapData> {
        return {
            items: menuItems,
            restaurants,
            audit,
        };
    },

    async listMenuItems(): Promise<MenuItem[]> {
        return menuItems;
    },

    async listRestaurants(): Promise<RestaurantSummary[]> {
        return restaurants;
    },

    async getMenuItemByKey(uniqueKey: string): Promise<MenuItem | null> {
        return menuItems.find((item) => item.unique_key === uniqueKey) ?? null;
    },

    async getRestaurantById(restaurantId: string): Promise<RestaurantSummary | null> {
        return restaurants.find((restaurant) => restaurant.restaurant_id === restaurantId) ?? null;
    },
};
