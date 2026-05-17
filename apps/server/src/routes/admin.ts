import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ArtifactRecord } from "@taoai/skill-core";
import type { ArtifactRepository, SettingsRepository, UserRepository } from "@taoai/skill-storage";
import { LoginService } from "@taoai/skill-services";
import { ensureDir } from "@taoai/skill-utils";
import { createRequireAdmin } from "../auth.js";

export interface AdminRouteDeps {
  repository: ArtifactRepository;
  userRepository: UserRepository;
  settingsRepository: SettingsRepository;
  jwtSecret: string;
  dataDir: string;
}

type ApprovalStatus = NonNullable<ArtifactRecord["approvalStatus"]>;

function generateRandomPassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  return result;
}

export function registerAdminRoutes(app: FastifyInstance, deps: AdminRouteDeps): void {
  const requireAdmin = createRequireAdmin(deps.userRepository, deps.jwtSecret);

  async function guard(req: FastifyRequest, reply: FastifyReply) {
    return requireAdmin(req, reply);
  }

  app.get("/api/admin/dashboard", { preHandler: guard }, async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const month = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return {
      skills: deps.repository.countByKind("skills"),
      prompts: deps.repository.countByKind("prompt"),
      agents: deps.repository.countByKind("agent"),
      createdToday: deps.repository.countPublishedSince(today),
      createdThisMonth: deps.repository.countPublishedSince(month),
      users: deps.userRepository.countUsers(),
      pendingApprovals: deps.repository.countByApprovalStatus("pending"),
      recentArtifacts: deps.repository.list({ limit: 8 }),
    };
  });

  app.get<{ Querystring: { approvalStatus?: ApprovalStatus | "all" } }>(
    "/api/admin/artifacts",
    { preHandler: guard },
    async (req) => {
      const approvalStatus = req.query.approvalStatus === "all" ? undefined : req.query.approvalStatus;
      return { items: deps.repository.list({ approvalStatus, limit: 200 }) };
    }
  );

  app.patch<{ Params: { id: string }; Body: { approvalStatus?: ApprovalStatus } }>(
    "/api/admin/artifacts/:id/approval",
    { preHandler: guard },
    async (req, reply) => {
      const status = req.body.approvalStatus;
      if (!status || !["approved", "pending", "rejected"].includes(status)) {
        return reply.code(400).send({ error: "invalid_approval_status" });
      }
      const record = deps.repository.updateApprovalStatus(req.params.id, status);
      if (!record) return reply.code(404).send({ error: "not_found" });
      return record;
    }
  );

  app.get("/api/admin/users", { preHandler: guard }, async () => ({
    items: deps.userRepository.listUsers().map(toSafeUser),
  }));

  app.post<{ Body: { username?: string; password?: string; role?: "admin" | "member" } }>(
    "/api/admin/users",
    { preHandler: guard },
    async (req, reply) => {
      const { username, password, role = "member" } = req.body;
      if (!username || !password) return reply.code(400).send({ error: "username_and_password_required" });
      if (!["admin", "member"].includes(role)) return reply.code(400).send({ error: "invalid_role" });
      try {
        const user = new LoginService(deps.userRepository).register(username, password, role);
        return reply.code(201).send(toSafeUser(user));
      } catch (error) {
        return reply.code(409).send({ error: "user_exists", message: (error as Error).message });
      }
    }
  );

  app.patch<{ Params: { id: string } }>("/api/admin/users/:id/disable", { preHandler: guard }, async (req, reply) => {
    const user = deps.userRepository.disableUser(Number(req.params.id));
    if (!user) return reply.code(404).send({ error: "not_found" });
    return toSafeUser(user);
  });

  app.post<{ Params: { id: string }; Body: { password?: string } }>(
    "/api/admin/users/:id/reset-password",
    { preHandler: guard },
    async (req, reply) => {
      const userId = Number(req.params.id);
      if (!Number.isFinite(userId) || userId <= 0) return reply.code(400).send({ error: "invalid_user_id" });

      const password = req.body.password?.trim() || generateRandomPassword(12);
      if (password.length < 8) return reply.code(400).send({ error: "password_too_short" });

      const user = new LoginService(deps.userRepository).resetPassword(userId, password);
      if (!user) return reply.code(404).send({ error: "not_found" });

      return { user: toSafeUser(user), password };
    }
  );

  app.get("/api/admin/settings", { preHandler: guard }, async () => deps.settingsRepository.getSettings());

  app.put<{
    Body: { siteName?: string; logoPath?: string; primaryColor?: string; requireApproval?: boolean };
  }>("/api/admin/settings", { preHandler: guard }, async (req) => deps.settingsRepository.updateSettings(req.body));

  app.post("/api/admin/settings/logo", { preHandler: guard }, async (req, reply) => {
    const file = await req.file();
    if (!file) return reply.code(400).send({ error: "missing_file" });
    const ext = path.extname(file.filename) || ".png";
    const filename = `logo-${randomUUID()}${ext}`;
    const dir = path.join(deps.dataDir, "admin-assets");
    await ensureDir(dir);
    await fs.writeFile(path.join(dir, filename), await file.toBuffer());
    const logoPath = `/api/admin-assets/${filename}`;
    const settings = deps.settingsRepository.updateSettings({ logoPath });
    return settings;
  });

  app.get<{ Params: { filename: string } }>("/api/admin-assets/:filename", async (req, reply) => {
    if (req.params.filename.includes("/") || req.params.filename.includes("..")) {
      return reply.code(400).send({ error: "invalid_filename" });
    }
    const filePath = path.join(deps.dataDir, "admin-assets", req.params.filename);
    try {
      const buf = await fs.readFile(filePath);
      return reply.type(contentType(filePath)).send(buf);
    } catch {
      return reply.code(404).send({ error: "not_found" });
    }
  });
}

function toSafeUser(user: { id: number; username: string; role: string; disabled_at?: string | null; created_at: string }) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    disabledAt: user.disabled_at ?? null,
    createdAt: user.created_at,
  };
}

function contentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}
