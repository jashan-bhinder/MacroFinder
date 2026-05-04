import type {
  AppBootstrapData,
  DatabaseItem,
  DatabaseRequest,
  DatabaseRestaurant,
  DatabaseUser,
  DbTask,
} from "../types/models";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

export interface UploadedFileRecord {
  fileId: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedAt: string;
  purpose?: string | null;
  file_url: string;
  download_url: string;
}

export interface RemoteAppStatePayload {
  bootstrap: AppBootstrapData;
  users: DatabaseUser[];
  requests: DatabaseRequest[];
  tasks: DbTask[];
  items: DatabaseItem[];
  restaurants: DatabaseRestaurant[];
}

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const payload = await response.json();
      message = payload.error ?? payload.message ?? message;
    } catch {
      const fallback = await response.text();
      if (fallback) message = fallback;
    }

    throw new Error(`${message} (${response.status})`);
  }

  return (await response.json()) as T;
}

function fileUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!apiBaseUrl) return path;
  return `${apiBaseUrl}${path}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export const appStateApi = {
  getAppState(): Promise<RemoteAppStatePayload> {
    return apiRequest<RemoteAppStatePayload>("/api/app-state");
  },

  async uploadFile(
    file: File,
    payload?: { purpose?: string; uploaderUserId?: string | null },
  ): Promise<UploadedFileRecord> {
    const buffer = await file.arrayBuffer();
    const response = await apiRequest<{
      ok: boolean;
      file: UploadedFileRecord;
    }>("/api/files", {
      method: "POST",
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        dataBase64: arrayBufferToBase64(buffer),
        purpose: payload?.purpose ?? null,
        uploaderUserId: payload?.uploaderUserId ?? null,
      }),
    });

    return response.file;
  },

  getFileViewUrl(fileId: string): string {
    return fileUrl(`/api/files/${encodeURIComponent(fileId)}`);
  },

  getFileDownloadUrl(fileId: string): string {
    return fileUrl(`/api/files/${encodeURIComponent(fileId)}?download=1`);
  },

  createUser(payload: { name: string; email: string; password: string }) {
    return apiRequest<{ ok: boolean; user: DatabaseUser }>("/api/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateUserPreferences(
    userId: string,
    payload: { savedItems: string[]; savedRestaurants: string[]; actorUserId: string },
  ) {
    return apiRequest<{ ok: boolean }>(
      `/api/users/${encodeURIComponent(userId)}/preferences`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  },

  createRoleUpgradeRequest(payload: {
    requesterUserId: string;
    restaurantName: string;
    role: string;
    businessEmail: string;
    note: string;
  }) {
    return apiRequest<{ ok: boolean }>("/api/requests/role-upgrade", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  createRestaurantCreationRequest(payload: Record<string, unknown>) {
    return apiRequest<{ ok: boolean }>("/api/requests/restaurant-creation", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  createChangeRequest(payload: Record<string, unknown>) {
    return apiRequest<{ ok: boolean }>("/api/requests/change", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  createIssue(payload: Record<string, unknown>) {
    return apiRequest<{ ok: boolean }>("/api/issues", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateRequestStatus(
    requestId: string,
    payload: { status: string; reviewedByUserId?: string | null },
  ) {
    return apiRequest<{ ok: boolean }>(
      `/api/requests/${encodeURIComponent(requestId)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  },

  createTask(payload: Record<string, unknown>) {
    return apiRequest<{ ok: boolean }>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateTaskStatus(
    taskId: string,
    payload: {
      status: string;
      submittedFiles?: unknown[];
      note?: string | null;
      actorUserId?: string | null;
    },
  ) {
    return apiRequest<{ ok: boolean }>(
      `/api/tasks/${encodeURIComponent(taskId)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  },
};
