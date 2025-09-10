"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null;

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div
      className="h-screen w-screen"
      style={{
        backgroundImage: `url('/${isDarkMode ? "backgrounddark" : "backgroundlight"}.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex items-center justify-center h-full">
        {/* File Explorer Modal */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg w-11/12 max-w-4xl h-3/4 p-6 relative">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              File Explorer
            </h2>
            {/* Light/Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                isDarkMode ? "bg-purple-600" : "bg-yellow-400"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                  isDarkMode ? "translate-x-6" : "translate-x-0"
                }`}
              ></div>
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex flex-col gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-800 dark:text-gray-200">
                This is your file explorer. Add your files here!
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-800 dark:text-gray-200">
                Example file or folder content can go here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}