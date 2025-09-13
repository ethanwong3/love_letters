"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login"); // redirect to login page after logout
  };

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#F8B7D4] via-[#F3CFE6] to-[#A28CC5] p-8">
      <h1 className="text-3xl font-bold text-purple-600 mb-6">
        Profile
      </h1>
      <div className="bg-white/90 p-6 rounded-lg shadow-lg border-thick border-purple-400 w-full max-w-md flex flex-col items-center gap-4">
        <p className="text-purple-700 font-semibold">Name: {user.displayName}</p>
        <p className="text-purple-700 font-semibold">Email: {user.email}</p>
        
        <button
          onClick={handleLogout}
          className="mt-4 p-3 bg-gradient-to-r from-[#F8B7D4] to-[#A28CC5] text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
