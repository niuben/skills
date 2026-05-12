import type { Database as DB } from 'better-sqlite3';

export type UserRole = 'admin' | 'member';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
  disabled_at?: string | null;
  created_at: string;
}

export class UserRepository {
  private db: DB;
  constructor(db: DB) {
    this.db = db;
  }

  createUser(username: string, password_hash: string, role: UserRole = 'member'): User {
    const created_at = new Date().toISOString();
    const stmt = this.db.prepare(
      'INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(username, password_hash, role, created_at);
    return { id: Number(info.lastInsertRowid), username, password_hash, role, disabled_at: null, created_at };
  }

  getUserByUsername(username: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    const row = stmt.get(username);
    return row ? (row as User) : null;
  }

  getUserById(id: number): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id);
    return row ? (row as User) : null;
  }

  listUsers(): User[] {
    const stmt = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC, id DESC');
    return stmt.all() as User[];
  }

  countUsers(): number {
    const row = this.db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number } | undefined;
    return row?.count ?? 0;
  }

  disableUser(id: number): User | null {
    const disabledAt = new Date().toISOString();
    this.db.prepare('UPDATE users SET disabled_at = ? WHERE id = ?').run(disabledAt, id);
    return this.getUserById(id);
  }

  updatePasswordHash(id: number, password_hash: string): User | null {
    this.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, id);
    return this.getUserById(id);
  }

  hasUsers(): boolean {
    return this.countUsers() > 0;
  }
}
