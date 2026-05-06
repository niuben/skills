import type { Database as DB } from 'better-sqlite3';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export class UserRepository {
  private db: DB;
  constructor(db: DB) {
    this.db = db;
  }

  createUser(username: string, password_hash: string): User {
    const created_at = new Date().toISOString();
    const stmt = this.db.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)');
    const info = stmt.run(username, password_hash, created_at);
    return { id: Number(info.lastInsertRowid), username, password_hash, created_at };
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
}
