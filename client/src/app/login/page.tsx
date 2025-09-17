"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import PixelStars from "../../components/ui/pixelStars";
import Modal from "../../components/ui/modal";
import LoadingOverlay from "../../components/ui/loading";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({email: "", password: ""});
  const [modalMessage, setModalMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

    // 🐛 DEBUG: Environment and URL checking
    console.log('🔍 LOGIN DEBUG INFO:');
    console.log('  - NEXT_PUBLIC_API_URL from env:', process.env.NEXT_PUBLIC_API_URL);
    console.log('  - Full login URL:', `${process.env.NEXT_PUBLIC_API_URL}/auth/login`);
    console.log('  - Email:', email.trim());
    console.log('  - Password provided:', !!password.trim());
    console.log('  - Current timestamp:', new Date().toISOString());
    console.log('  - User agent:', navigator.userAgent);
    console.log('  - Current origin:', window.location.origin);

    // Check if API URL is undefined
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.error('❌ NEXT_PUBLIC_API_URL is undefined!');
      setModalMessage('Configuration error: API URL not set. Check environment variables.');
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Making fetch request...');
      
      const requestBody = { 
        email: email.trim(), 
        password: password.trim() 
      };
      
      console.log('  - Request body:', requestBody);
      console.log('  - Request headers: Content-Type: application/json');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response received:');
      console.log('  - Status:', res.status);
      console.log('  - Status Text:', res.statusText);
      console.log('  - Headers:', Object.fromEntries(res.headers.entries()));
      console.log('  - OK:', res.ok);

      let data;
      try {
        const responseText = await res.text();
        console.log('  - Raw response text:', responseText);
        
        if (responseText) {
          data = JSON.parse(responseText);
          console.log('  - Parsed response data:', data);
        } else {
          console.log('  - Empty response body');
          data = {};
        }
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:');
        console.error('  - Parse error:', (parseError as Error).message);
        console.error('  - Response might not be JSON');
        data = { message: 'Invalid response from server' };
      }

      if (res.ok) {
        console.log('✅ Login successful!');
        console.log('  - Token received:', !!data.token);
        console.log('  - User data:', data.user);
        
        login(data.token, data.user);
        router.push("/");
      } else {
        console.log('❌ Login failed:');
        console.log('  - Error message:', data.message);
        setModalMessage(data.message || "Login failed");
      }

    } catch (fetchError) {
      console.error('❌ FETCH ERROR OCCURRED:');
      console.error('  - Error name:', (fetchError as Error).name);
      console.error('  - Error message:', (fetchError as Error).message);
      console.error('  - Error stack:', (fetchError as Error).stack);
      console.error('  - Error type:', typeof fetchError);
      
      // Check for specific error types
      if ((fetchError as Error).name === 'TypeError' && (fetchError as Error).message.includes('Failed to fetch')) {
        console.error('🌐 This is likely a network/CORS error:');
        console.error('  - Check if backend is running');
        console.error('  - Check CORS configuration');
        console.error('  - Check if API URL is correct');
        setModalMessage('Network error: Cannot connect to server. Check your internet connection and try again.');
      } else {
        setModalMessage(`Connection error: ${(fetchError as Error).message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {loading && (
        <LoadingOverlay imageSrc="/cat2.jpeg" message="Summoning the server spirits..." />
      )}
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
              Don&apos;t have an account?
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