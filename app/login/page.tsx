"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./login.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = useMemo(() => searchParams.get("next") || "/admin", [searchParams]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Không đăng nhập được.");
        return;
      }

      router.replace(nextUrl);
      router.refresh();
    } catch {
      setMessage("Không kết nối được máy chủ.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <form className={styles.loginBox} onSubmit={submit}>
        <p className={styles.eyebrow}>Factory TV Notice</p>
        <h1>Đăng nhập hệ thống</h1>
        <p className={styles.note}>Tài khoản Admin dùng để quản trị. Tài khoản TV dùng cho trình duyệt Smart TV.</p>

        <label>
          Tên đăng nhập
          <input value={username} autoComplete="username" onChange={(event) => setUsername(event.target.value)} />
        </label>

        <label>
          Mật khẩu
          <input type="password" value={password} autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} />
        </label>

        {message ? <div className={styles.error}>{message}</div> : null}

        <button type="submit" disabled={isLoading}>{isLoading ? "Đang đăng nhập..." : "Đăng nhập"}</button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <LoginForm />
    </Suspense>
  );
}

