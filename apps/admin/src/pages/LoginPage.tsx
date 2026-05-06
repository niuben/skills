import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, setToken } from "../api";

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(username, password);
      if (data.user.role !== "admin") {
        setError("当前账号没有后台权限");
        return;
      }
      setToken(data.token);
      navigate("/", { replace: true });
    } catch (err) {
      setError((err as Error).message || "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <section className="login-hero">
        <span className="eyebrow">Admin Console</span>
        <h1>统一管理企业内部 AI 能力资产</h1>
        <p>审批 Skills、Prompts、Agents，管理成员与系统品牌配置。</p>
      </section>
      <form className="login-panel" onSubmit={submit}>
        <h2>后台登录</h2>
        <label>
          用户名
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
        </label>
        <label>
          密码
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "登录中..." : "登录"}
        </button>
        {error ? <div className="form-error">{error}</div> : null}
      </form>
    </div>
  );
}
