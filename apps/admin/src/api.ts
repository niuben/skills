import type { AdminUser, ApprovalStatus, ArtifactRecord, DashboardStats, ResetPasswordResult, SystemSettings, UserRole } from "./types";

const TOKEN_KEY = "skillos_admin_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, { ...init, headers });
  if (res.status === 401 || res.status === 403) {
    clearToken();
    if (window.location.pathname !== "/login") window.location.href = "/login";
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function login(username: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("用户名或密码错误");
  return (await res.json()) as { token: string; user: AdminUser; expiresIn: string };
}

export const api = {
  dashboard: () => request<DashboardStats>("/api/admin/dashboard"),
  artifacts: (approvalStatus: ApprovalStatus | "all") =>
    request<{ items: ArtifactRecord[] }>(`/api/admin/artifacts?approvalStatus=${approvalStatus}`),
  updateApproval: (id: string, approvalStatus: ApprovalStatus) =>
    request<ArtifactRecord>(`/api/admin/artifacts/${encodeURIComponent(id)}/approval`, {
      method: "PATCH",
      body: JSON.stringify({ approvalStatus }),
    }),
  users: () => request<{ items: AdminUser[] }>("/api/admin/users"),
  createUser: (input: { username: string; password: string; role: UserRole }) =>
    request<AdminUser>("/api/admin/users", { method: "POST", body: JSON.stringify(input) }),
  disableUser: (id: number) => request<AdminUser>(`/api/admin/users/${id}/disable`, { method: "PATCH" }),
  resetPassword: (id: number, password?: string) =>
    request<ResetPasswordResult>(`/api/admin/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify(password ? { password } : {}),
    }),
  settings: () => request<SystemSettings>("/api/admin/settings"),
  updateSettings: (input: Partial<SystemSettings>) =>
    request<SystemSettings>("/api/admin/settings", { method: "PUT", body: JSON.stringify(input) }),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<SystemSettings>("/api/admin/settings/logo", { method: "POST", body: form });
  },
};
