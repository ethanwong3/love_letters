"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import PixelStars from "../../components/ui/pixelStars";
import Modal from "../../components/ui/modal";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({email: "", password: ""});
  const [modalMessage, setModalMessage] = useState("");

  const closeModal = () => setModalMessage("");

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setErrors(prev => ({ ...prev, email: "you left this empty hoe" }));
      return false;
    } else if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: "invalid email format" }));
      return false;
    } else {
      setErrors(prev => ({ ...prev, email: "" }));
      return true;
    }
  }

  const validatePassword = () => {
    if (!password.trim()) {
      setErrors(prev => ({ ...prev, password: "you left this empty hoe" }));
      return false;
    } else {
      setErrors(prev => ({ ...prev, password: "" }));
      return true;
    }
  }

  const validateFields = () => {
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    return isEmailValid && isPasswordValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) return;

    const res = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password: password.trim() }),
    });

    const data = await res.json();
    if (res.ok) {
      login(data.token, data.user);
      router.push("/");
    } else {
      //alert(data.message || "Login failed");
      setModalMessage(data.message || "Login failed");
    }
  };

  return (
    <div className="relative">
      {modalMessage && <Modal message={modalMessage} onClose={closeModal} />}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8B7D4] via-[#F3CFE6] to-[#A28CC5] relative overflow-hidden">
        <PixelStars color="black" />
        <div className="relative">
          <img
            src="/kuromi.jpeg"
            alt="kuromi"
            className="decorative-image kuromi shadow-heavy border-thick border-purple-400 rounded-lg"
          />
          <div className="w-full max-w-md bg-white/90 backdrop-blur-md squared shadow-heavy p-6 border-thick border-purple-400 relative">
            <h2 className="text-4xl font-bold text-center text-purple-600 mb-8 tracking-wide">
              ✧ LOGIN ✧
            </h2>

            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              <div className="w-full">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-3 squared border-thick border-purple-200 focus:outline-none focus:ring-4 focus:ring-pink-300 bg-white/80 text-purple-600 placeholder-purple-400 text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => validateEmail()}
                />
                {errors.email && <p className="text-red-500 text-sm mt-2 ml-2">{errors.email}</p>}
              </div>
              <div className="w-full">
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-3 squared border-thick border-purple-200 focus:outline-none focus:ring-4 focus:ring-pink-300 bg-white/80 text-purple-600 placeholder-purple-400 text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => validatePassword()}
                />
                {errors.password && <p className="text-red-500 text-sm mt-2 ml-2">{errors.password}</p>}
              </div>
              <button
                type="submit"
                className="p-3 squared bg-gradient-to-r from-[#F8B7D4] to-[#A28CC5] text-white font-bold text-base shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200"
                disabled={!email.trim() || !password.trim()}
              >
                ♥ Login ♥
              </button>
            </form>

            <p className="text-center text-base text-purple-500 mt-8">
              Don't have an account?{" "}
              <a href="/register" className="text-pink-400 underline hover:text-pink-600">
                Sign up here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}