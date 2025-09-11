"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import Write from "../components/write";
import Letters from "../components/letters";
import Inbox from "../components/inbox";
import Profile from "../components/profile";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // Track open windows and focus order
  const [windows, setWindows] = useState<string[]>([]); // stack of window IDs

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!user) return null;

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const calculateBackgroundPosition = () => {
    const x = (cursorPosition.x / window.innerWidth) * 100;
    const y = (cursorPosition.y / window.innerHeight) * 100;
    return `${50 - x / 2}% ${50 - y / 2}%`;
  };

  // Window helpers
  const openWindow = (id: string) => {
    setWindows((prev) =>
      prev.includes(id) ? [...prev.filter((w) => w !== id), id] : [...prev, id]
    );
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w !== id));
  };

  const focusWindow = (id: string) => {
    setWindows((prev) => [...prev.filter((w) => w !== id), id]);
  };

  return (
    <div
      className="h-screen w-screen"
      style={{
        backgroundImage: `url('/${isDarkMode ? "backgrounddark" : "backgroundlight"}.jpg')`,
        backgroundSize: "150%",
        backgroundPosition: calculateBackgroundPosition(),
        transition: "background-position 0.1s ease-out",
      }}
    >
      <div className="flex items-center justify-center h-full">
        {/* Retro Computer */}
        <div
          className="relative flex flex-col items-center"
          style={{
            backgroundColor: isDarkMode ? "#2b2b2b" : "#fdf5e6",
            border: `20px solid ${isDarkMode ? "#4a4a4a" : "#e0e0e0"}`,
            borderRadius: "12px",
            boxShadow: isDarkMode
              ? `
                inset -8px -8px 16px rgba(255,255,255,0.1),
                8px 8px 20px rgba(0,0,0,0.6)
              `
              : `
                inset -8px -8px 16px rgba(0,0,0,0.2),
                8px 8px 20px rgba(0,0,0,0.4)
              `,
            padding: "16px",
            transform: "scale(1.4, 1.3)",
          }}
        >
          {/* Screen */}
          <div
            className="relative flex flex-col items-center justify-center gap-4"
            style={{
              width: "600px",
              height: "450px",
              backgroundColor: isDarkMode ? "#001f3f" : "#dff9fb",
              border: "12px solid #111",
              color: isDarkMode ? "#00ff00" : "#000",
              fontSize: "20px",
              fontWeight: "bold",
              textAlign: "center",
              boxShadow: `
                inset -4px -4px 8px rgba(0,0,0,0.4),
                inset 4px 4px 8px rgba(255,255,255,0.2)
              `,
            }}
          >
            <div className="mb-2">love_letters</div>

            {/* Four Icons */}
            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => openWindow("Write")}
                className="p-4 bg-white border rounded shadow hover:bg-gray-100"
              >
                Icon 1
              </button>
              <button
                onClick={() => openWindow("Letters")}
                className="p-4 bg-white border rounded shadow hover:bg-gray-100"
              >
                Icon 2
              </button>
              <button
                onClick={() => openWindow("Inbox")}
                className="p-4 bg-white border rounded shadow hover:bg-gray-100"
              >
                Icon 3
              </button>
              <button
                onClick={() => openWindow("Profile")}
                className="p-4 bg-white border rounded shadow hover:bg-gray-100"
              >
                Icon 4
              </button>
            </div>
          </div>

          {/* Slot below screen (Toggle Button) */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center justify-center mt-4"
            style={{
              width: "160px",
              height: "40px",
              backgroundColor: "#eaeaea",
              border: "2px solid #ccc",
              borderRadius: "4px",
              boxShadow:
                "inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.7)",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#333",
              cursor: "pointer",
            }}
          >
            {isDarkMode ? (
              <>
                Dark <MoonIcon className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                Light <SunIcon className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Render Windows */}
      {windows.includes("Write") && (
        <Write
          isFocused={windows[windows.length - 1] === "Write"}
          onClose={() => closeWindow("Write")}
          onFocus={() => focusWindow("Write")}
        />
      )}
      {windows.includes("Letters") && (
        <Letters
          isFocused={windows[windows.length - 1] === "Letters"}
          onClose={() => closeWindow("Letters")}
          onFocus={() => focusWindow("Letters")}
        />
      )}
      {windows.includes("Inbox") && (
        <Inbox
          isFocused={windows[windows.length - 1] === "Inbox"}
          onClose={() => closeWindow("Inbox")}
          onFocus={() => focusWindow("Inbox")}
        />
      )}
      {windows.includes("Profile") && (
        <Profile
          isFocused={windows[windows.length - 1] === "Profile"}
          onClose={() => closeWindow("Profile")}
          onFocus={() => focusWindow("Profile")}
        />
      )}
    </div>
  );
}
