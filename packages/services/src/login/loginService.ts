import { UserRepository, type UserRole } from '@skillshub/storage';
import * as bcrypt from 'bcryptjs';

export class LoginService {
  constructor(private userRepository: UserRepository) {}

  register(username: string, password: string, role: UserRole = 'member') {
    const password_hash = bcrypt.hashSync(password, 10);
    return this.userRepository.createUser(username, password_hash, role);
  }

  login(username: string, password: string) {
    const user = this.userRepository.getUserByUsername(username);
    if (!user) return null;
    if (user.disabled_at) return null;
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return null;
    // 这里可生成 JWT token，暂返回 user
    return user;
  }
}
