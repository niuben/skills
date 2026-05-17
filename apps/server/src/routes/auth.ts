import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { LoginService } from "@taoai/skill-services";
import { createToken } from "../auth.js";

export interface AuthRouteDeps {
  loginService: LoginService;
  jwtSecret: string;
}

interface LoginBody {
  username?: string;
  password?: string;
}

export function registerAuthRoutes(app: FastifyInstance, deps: AuthRouteDeps): void {
  async function login(request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) {
    const { username, password } = request.body;
    if (!username || !password) {
      return reply.code(400).send({ error: "username_and_password_required" });
    }

    const user = deps.loginService.login(username, password);
    if (!user) {
      return reply.code(401).send({ error: "invalid_credentials" });
    }

    const token = createToken(user, deps.jwtSecret);
    return reply.send({
      token,
      expiresIn: "7d",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        disabledAt: user.disabled_at ?? null,
      },
    });
  }

  app.post<{ Body: LoginBody }>("/api/auth/login", login);
  app.post<{ Body: LoginBody }>("/login", login);
}
