
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { LoginService } from '@skillsos/services';
import { UserRepository, openDatabase } from '@skillsos/storage';

const dbFile = process.env.SKILLOS_DB_FILE || './data/skills.db';
let loginService: LoginService;

async function ensureLoginService() {
	if (!loginService) {
		const db = await openDatabase({ file: dbFile });
		const userRepository = new UserRepository(db);
		loginService = new LoginService(userRepository);
	}
}

export default async function loginRoutes(app: FastifyInstance, opts: FastifyPluginOptions) {
	await ensureLoginService();
	app.post('/', async (request, reply) => {
		const { username, password } = request.body as any;
		if (!username || !password) {
			return reply.status(400).send({ error: 'Username and password required' });
		}
		if (!loginService) {
			return reply.status(503).send({ error: 'Service not ready' });
		}
		const user = loginService.login(username, password);
		if (!user) {
			return reply.status(401).send({ error: 'Invalid credentials' });
		}
		// TODO: 生成并返回 JWT token
		reply.send({ id: user.id, username: user.username });
	});
}
