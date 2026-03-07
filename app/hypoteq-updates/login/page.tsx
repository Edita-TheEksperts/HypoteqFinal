"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import Image from "next/image";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push("/hypoteq-updates");
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#132219] font-sfpro px-2">
      <div className="w-full max-w-md flex flex-col items-center mb-8">
        <Image src="/images/HYPOTEQ_layout_logo_white.png" alt="Hypoteq Logo" width={180} height={40} className="mb-6" priority />
        <h2 className="text-3xl sm:text-4xl font-bold text-[#CAF476] mb-2 text-center tracking-tight">Admin Login</h2>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-card p-6 sm:p-8 flex flex-col gap-5 items-center">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border border-[#132219]/30 focus:border-[#CAF476] p-3 rounded w-full text-[#132219] placeholder:text-[#132219]/40 outline-none transition"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border border-[#132219]/30 focus:border-[#CAF476] p-3 rounded w-full text-[#132219] placeholder:text-[#132219]/40 outline-none transition"
          required
        />
        {error && <div className="text-red-600 w-full text-center text-sm">{error}</div>}
        <button type="submit" className="w-full bg-[#CAF476] hover:bg-[#d6ff8a] text-[#132219] font-semibold p-3 rounded-full shadow transition text-lg">Login</button>
      </form>
      <style jsx global>{`
        body { background: #132219 !important; }
      `}</style>
    </div>
  );
}
