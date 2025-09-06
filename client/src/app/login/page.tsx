"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      login(data.access_token, data.user);
      router.push("/");
    } else {
      alert(data.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border-4 border-pink-300 relative">
        
        {/* Sanrio Sticker Decoration */}
        <img
          src="/assets/hello-kitty.png"
          alt="Hello Kitty Sticker"
          className="absolute -top-10 -left-10 w-20 h-20 drop-shadow-lg"
        />

        <h2 className="text-3xl font-bold text-center text-pink-600 drop-shadow-sm mb-6">
          ✧ Login ✧
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="p-3 rounded-full border-2 border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white/70"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="p-3 rounded-full border-2 border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white/70"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="p-3 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-transform">
            Login ❤
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Don’t have an account?{" "}
          <a href="/register" className="text-purple-600 underline hover:text-pink-600">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}
