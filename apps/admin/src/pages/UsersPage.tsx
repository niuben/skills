import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import type { AdminUser, UserRole } from "../types";

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("member");

  function reload() {
    api.users().then((data) => setUsers(data.items));
  }

  useEffect(() => {
    reload();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await api.createUser({ username, password, role });
    setUsername("");
    setPassword("");
    setRole("member");
    reload();
  }

  async function disable(id: number) {
    await api.disableUser(id);
    reload();
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Users</span>
          <h1>人员管理</h1>
        </div>
      </header>
      <form className="panel user-form" onSubmit={submit}>
        <input placeholder="用户名" value={username} onChange={(event) => setUsername(event.target.value)} required />
        <input
          placeholder="初始密码"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          required
        />
        <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
          <option value="member">成员</option>
          <option value="admin">管理员</option>
        </select>
        <button className="primary-button" type="submit">新建用户</button>
      </form>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>用户</th>
              <th>角色</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.role === "admin" ? "管理员" : "成员"}</td>
                <td>{user.disabledAt ? "已禁用" : "正常"}</td>
                <td>{new Date(user.createdAt).toLocaleString("zh-CN")}</td>
                <td>
                  <button disabled={Boolean(user.disabledAt)} onClick={() => disable(user.id)}>禁用</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
