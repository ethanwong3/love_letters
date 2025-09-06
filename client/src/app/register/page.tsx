"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import PixelStars from "../../components/ui/pixelStars";

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#B3D9F7] via-[#F3CFE6] to-[#F8B7D4] relative overflow-hidden">
      <PixelStars color="white" />
      <div className="relative">
        <img
          src="/cinnamonroll.jpeg"
          alt="Cinnamon Roll"
          className="decorative-image cinnamon-roll shadow-heavy border-thick border-blue-400 rounded-lg"
        />
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md squared shadow-heavy p-6 border-thick border-blue-400 relative">
          <h2 className="text-4xl font-bold text-center text-blue-600 mb-8 tracking-wide">
            ✧ REGISTER ✧
          </h2>

          <form onSubmit={handleRegister} className="flex flex-col gap-6">
            <input
              type="text"
              placeholder="Display Name"
              className="p-3 squared border-thick border-blue-200 focus:outline-none focus:ring-4 focus:ring-pink-300 bg-white/80 text-blue-600 placeholder-blue-400 text-base"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              className="p-3 squared border-thick border-blue-200 focus:outline-none focus:ring-4 focus:ring-pink-300 bg-white/80 text-blue-600 placeholder-blue-400 text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="p-3 squared border-thick border-blue-200 focus:outline-none focus:ring-4 focus:ring-pink-300 bg-white/80 text-blue-600 placeholder-blue-400 text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              className="p-3 squared bg-gradient-to-r from-[#B3D9F7] to-[#F8B7D4] text-white font-bold text-base shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200"
            >
              ♥ Register ♥
            </button>
          </form>

          <p className="text-center text-base text-blue-500 mt-8">
            Already have an account?{" "}
            <a href="/login" className="text-pink-400 underline hover:text-pink-600">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}