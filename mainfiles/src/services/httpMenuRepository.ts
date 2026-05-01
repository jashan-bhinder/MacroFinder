import type {
  AppBootstrapData,
  MenuItem,
  RestaurantSummary,
} from "../types/models";
import type { MenuRepository } from "./menuRepository";
import { mockMenuRepository } from "./mockMenuRepository";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
const bootstrapUrl = `${apiBaseUrl}/api/bootstrap`;

let bootstrapPromise: Promise<AppBootstrapData> | null = null;

async function fetchBootstrapData(): Promise<AppBootstrapData> {
  const response = await fetch(bootstrapUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Bootstrap request failed (${response.status}): ${message || response.statusText}`,
    );
  }

  return (await response.json()) as AppBootstrapData;
}

function loadBootstrapData(): Promise<AppBootstrapData> {
  if (!bootstrapPromise) {
    bootstrapPromise = fetchBootstrapData().catch(async (error) => {
      console.warn(
        "Falling back to mock bootstrap data because the API is unavailable.",
        error,
      );
      return mockMenuRepository.getBootstrapData();
    });
  }

  return bootstrapPromise;
}

export const httpMenuRepository: MenuRepository = {
  async getBootstrapData(): Promise<AppBootstrapData> {
    return loadBootstrapData();
  },

  async listMenuItems(): Promise<MenuItem[]> {
    const bootstrap = await loadBootstrapData();
    return bootstrap.items;
  },

  async listRestaurants(): Promise<RestaurantSummary[]> {
    const bootstrap = await loadBootstrapData();
    return bootstrap.restaurants;
  },

  async getMenuItemByKey(uniqueKey: string): Promise<MenuItem | null> {
    const bootstrap = await loadBootstrapData();
    return bootstrap.items.find((item) => item.unique_key === uniqueKey) ?? null;
  },

  async getRestaurantById(restaurantId: string): Promise<RestaurantSummary | null> {
    const bootstrap = await loadBootstrapData();
    return (
      bootstrap.restaurants.find(
        (restaurant) => restaurant.restaurant_id === restaurantId,
      ) ?? null
    );
  },
};
