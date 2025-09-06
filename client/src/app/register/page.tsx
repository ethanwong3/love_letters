"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("http://localhost:4000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName, password }),
    });

    const data = await res.json();
    if (res.ok) {
      login(data.access_token, data.user);
      router.push("/");
    } else {
      alert(data.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-pink-200 to-rose-200">
      <div className="w-full max-w-md bg-white/85 backdrop-blur-md rounded-2xl shadow-2xl p-8 border-4 border-purple-300 relative">
        
        {/* Sanrio Sticker Decoration */}
        <img
          src="/assets/cinnamoroll.png"
          alt="Cinnamoroll Sticker"
          className="absolute -top-12 -right-10 w-24 h-24 drop-shadow-lg"
        />

        <h2 className="text-3xl font-bold text-center text-purple-600 drop-shadow-sm mb-6">
          ✧ Register ✧
        </h2>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            className="p-3 rounded-xl border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/70 shadow-sm"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            className="p-3 rounded-xl border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/70 shadow-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="p-3 rounded-xl border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/70 shadow-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="p-3 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-transform">
            Register ☆
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-pink-600 underline hover:text-purple-600">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}
