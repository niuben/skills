export type UserRole = "admin" | "member";
export type ApprovalStatus = "approved" | "pending" | "rejected";
export type ArtifactKind = "skills" | "prompt" | "agent";

export interface AdminUser {
  id: number;
  username: string;
  role: UserRole;
  disabledAt: string | null;
  createdAt: string;
}

export interface ResetPasswordResult {
  user: AdminUser;
  password: string;
}

export interface ArtifactRecord {
  id: string;
  kind: ArtifactKind;
  name: string;
  version: string;
  description?: string;
  tags?: string[];
  author?: { name: string; email?: string };
  size: number;
  storagePath: string;
  publishedAt: string;
  approvalStatus?: ApprovalStatus;
}

export interface DashboardStats {
  skills: number;
  prompts: number;
  agents: number;
  createdToday: number;
  createdThisMonth: number;
  users: number;
  pendingApprovals: number;
  recentArtifacts: ArtifactRecord[];
}

export interface SystemSettings {
  siteName: string;
  logoPath: string;
  primaryColor: string;
  requireApproval: boolean;
}
