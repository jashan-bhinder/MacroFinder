import { httpMenuRepository } from "./httpMenuRepository";
import { mockMenuRepository } from "./mockMenuRepository";

const shouldUseMockRepository = import.meta.env.VITE_USE_MOCK_DATA === "true";

export const menuRepository = shouldUseMockRepository
    ? mockMenuRepository
    : httpMenuRepository;
