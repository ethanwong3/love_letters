"use client";

import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="p-4 bg-gray-900 text-white flex gap-6">
      {user ? (
        <>
          <span>Welcome, {user.name}</span>
          <button
            onClick={logout}
            className="ml-auto bg-red-600 px-3 py-1 rounded"
          >
            Logout
          </button>
        </>
      ) : (
        <></>
      )}
    </header>
  );
}