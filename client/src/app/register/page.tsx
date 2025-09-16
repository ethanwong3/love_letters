"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import PixelStars from "../../components/ui/pixelStars";
import Modal from "../../components/ui/modal";

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState({email: "", displayName: "", password: "", passwordConfirm: ""});
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

  const validateDisplayName = () => {
    if (!displayName.trim()) {
      setErrors(prev => ({ ...prev, displayName: "you left this empty hoe" }));
      return false;
      return;
    } else {
      setErrors(prev => ({ ...prev, displayName: "" }));
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
  
  const validatePasswordConfirm = () => {
    if (!passwordConfirm.trim()) {
      setErrors(prev => ({ ...prev, passwordConfirm: "you left this empty hoe" }));
      return false;
    } else if (passwordConfirm !== password) {
      setErrors(prev => ({ ...prev, passwordConfirm: "erm, passwords don't match" }));
      return false;
    } else {
      setErrors(prev => ({ ...prev, passwordConfirm: "" }));
      return true;
    }
  }

  const validateFields = () => {
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isDisplayNameValid = validateDisplayName();
    const isPasswordConfirmValid = validatePasswordConfirm();
    return isEmailValid && isPasswordValid && isDisplayNameValid && isPasswordConfirmValid;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName, password }),
    });

    const data = await res.json();
    if (res.ok) {
      login(data.token, data.user);
      router.push("/");
    } else {
      //alert(data.message || "Registration failed");
      setModalMessage(data.message || "Registration failed");
    }
  };

  return (
    <div>
      {modalMessage && <Modal message={modalMessage} onClose={closeModal} />}
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
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Display Name"
                  className="w-full p-3 squared border-thick border-blue-200 focus:outline-none focus:ring-4 focus:ring-pink-300 bg-white/80 text-blue-600 placeholder-blue-400 text-base"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={() => validateDisplayName()}
                />
                {errors.displayName && <p className="text-red-500 text-sm mt-2 ml-2">{errors.displayName}</p>}
              </div>
              <div className="w-full">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-3 squared border-thick border-blue-200 focus:outline-none focus:ring-4 focus:ring-pink-300 bg-white/80 text-blue-600 placeholder-blue-400 text-base"
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
                  className="w-full p-3 squared border-thick border-blue-200 focus:outline-none focus:ring-4 focus:ring-pink-300 bg-white/80 text-blue-600 placeholder-blue-400 text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => validatePassword()}
                />
                {errors.password && <p className="text-red-500 text-sm mt-2 ml-2">{errors.password}</p>}
              </div>
              <div className="w-full">
                <input
                  type="password"
                  placeholder="Confirm your password"
                  className="w-full p-3 squared border-thick border-blue-200 focus:outline-none focus:ring-4 focus:ring-pink-300 bg-white/80 text-blue-600 placeholder-blue-400 text-base"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  onBlur={() => validatePasswordConfirm()}
                />
                {errors.passwordConfirm && <p className="text-red-500 text-sm mt-2 ml-2">{errors.passwordConfirm}</p>}
              </div>
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
    </div>
  );
}