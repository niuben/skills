import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import type { User, UserRepository } from "@taoai/skill-storage";

export interface AuthContext {
  user: User;
}

export function createToken(user: User, secret: string): string {
  return jwt.sign(
    { username: user.username, role: user.role },
    secret,
    { subject: String(user.id), expiresIn: "7d" }
  );
}

export function createRequireUser(userRepository: UserRepository, secret: string) {
  return async function requireUser(req: FastifyRequest, reply: FastifyReply): Promise<AuthContext | void> {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return reply.code(401).send({ error: "missing_token" });
    }

    try {
      const payload = jwt.verify(header.slice("Bearer ".length), secret) as jwt.JwtPayload;
      const id = Number(payload.sub);
      if (!Number.isFinite(id)) {
        return reply.code(401).send({ error: "invalid_token" });
      }
      const user = userRepository.getUserById(id);
      if (!user) return reply.code(401).send({ error: "user_not_found" });
      if (user.disabled_at) return reply.code(403).send({ error: "user_disabled" });
      return { user };
    } catch {
      return reply.code(401).send({ error: "invalid_token" });
    }
  };
}

export function createRequireAdmin(userRepository: UserRepository, secret: string) {
  const requireUser = createRequireUser(userRepository, secret);
  return async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<AuthContext | void> {
    const context = await requireUser(req, reply);
    if (!context) return;
    if (context.user.role !== "admin") {
      return reply.code(403).send({ error: "admin_required" });
    }
    return context;
  };
}
