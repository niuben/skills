import React, { useState } from 'react';
import { login } from '../api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login(username, password);
      localStorage.setItem('token', res.token);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="login-layout">
      <div className="login-left">
        <div className="login-brand">
          <img src="/logo.svg" alt="SkillOS" className="login-logo" />
          <h1 className="login-brand-title">SkillOS</h1>
          <p className="login-brand-desc">让技能流动起来，赋能每一个创造者。</p>
        </div>
      </div>
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">登录 SkillOS</h2>
          <form className="login-form" onSubmit={handleSubmit} autoComplete="on">
            <label className="login-label">
              用户名
              <input
                className="login-input"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
              />
            </label>
            <label className="login-label">
              密码
              <input
                className="login-input"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
            <button className="login-btn" type="submit">登录</button>
            {error && <div className="login-error">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
