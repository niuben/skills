import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import type { AdminUser, UserRole } from "../types";
import { useTranslation } from "react-i18next";

export function UsersPage() {
  const { t, i18n } = useTranslation();
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
          <span className="eyebrow">{t('users.title')}</span>
          <h1>{t('users.title')}</h1>
        </div>
      </header>
      <form className="panel user-form" onSubmit={submit}>
        <input placeholder={t('users.form.username')} value={username} onChange={(event) => setUsername(event.target.value)} required />
        <input
          placeholder={t('users.form.password')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          required
        />
        <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
          <option value="member">{t('users.form.role_member')}</option>
          <option value="admin">{t('users.form.role_admin')}</option>
        </select>
        <button className="primary-button" type="submit">{t('users.form.create')}</button>
      </form>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('users.table.user')}</th>
              <th>{t('users.table.role')}</th>
              <th>{t('users.table.status')}</th>
              <th>{t('users.table.createdAt')}</th>
              <th>{t('users.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.role === "admin" ? t('users.form.role_admin') : t('users.form.role_member')}</td>
                <td>{user.disabledAt ? t('users.table.disabled') : t('users.table.active')}</td>
                <td>{new Intl.DateTimeFormat(i18n.language).format(new Date(user.createdAt))}</td>
                <td>
                  <button disabled={Boolean(user.disabledAt)} onClick={() => disable(user.id)}>{t('users.table.disable')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
