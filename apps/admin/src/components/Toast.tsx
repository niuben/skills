import React, { useEffect, useState } from "react";

type ToastItem = { id: number; message: string; type?: "success" | "error" };

let setter: React.Dispatch<React.SetStateAction<ToastItem[]>> | null = null;

export function showToast(message: string, type: "success" | "error" = "success") {
  if (!setter) return;
  setter((prev) => [...prev, { id: Date.now() + Math.floor(Math.random() * 1000), message, type }]);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    setter = setToasts;
    return () => {
      setter = null;
    };
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((p) => p.id !== t.id));
      }, 3500)
    );
    return () => timers.forEach((id) => clearTimeout(id));
  }, [toasts]);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type === "error" ? "toast-error" : "toast-success"}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
