"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showOnboarding, setShowOnboarding] = useState(true);
  const closeOnboarding = () => setShowOnboarding(false);

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

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const calculateBackgroundPosition = () => {
    const x = (cursorPosition.x / window.innerWidth) * 100;
    const y = (cursorPosition.y / window.innerHeight) * 100;
    return `${50 - x / 2}% ${50 - y / 2}%`;
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
        {/* Onboarding Popup */}
        {showOnboarding && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{
              backdropFilter: "blur(8px)",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
            }}
            onClick={closeOnboarding}
          >
            <div
              className="retro-modal w-11/12 max-w-lg p-6 relative"
              style={{
                backgroundColor: "#000",
                border: "8px solid #333",
                boxShadow: `
                  inset -6px -6px 12px rgba(0, 0, 0, 0.8),
                  6px 6px 16px rgba(0, 0, 0, 0.6),
                  -6px -6px 12px rgba(255, 255, 255, 0.2)
                `,
                borderRadius: "12px",
                transform: "scale(1.05)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 text-lg font-bold text-gray-700 hover:text-red-500"
                onClick={closeOnboarding}
              >
                X
              </button>
              <p className="text-lg leading-relaxed text-center">
                Hey
                <span className="rainbow-text">{user.displayName}</span>, welcome
                to <strong>love_letters</strong>, your online letterbox. I was
                made as a gift for lyn so that she can read all the letters that her friends and family have written to her.
                When you close this message, you will find that the icons
                displayed let you write, edit, send, and personalise letters
                with music and photos. Don't forget to send them to{" "}
                <span className="rainbow-text">lyn</span>!
              </p>
            </div>
          </div>
        )}

        {/* Retro Computer */}
        <div
          className="relative flex flex-col items-center"
          style={{
            backgroundColor: "#fdf5e6", // Off-white yellowish retro color
            border: "20px solid #e0e0e0",
            borderRadius: "12px",
            boxShadow: `
              inset -8px -8px 16px rgba(0,0,0,0.2),
              8px 8px 20px rgba(0,0,0,0.4)
            `,
            padding: "16px",
            transform: "scale(1.4, 1.3)", // Scaled larger
          }}
        >
          {/* Screen */}
          <div
            className="flex items-center justify-center"
            style={{
              width: "600px",
              height: "450px",
              backgroundColor: isDarkMode ? "#001f3f" : "#dff9fb", // Dark blue for dark mode, light blue for light mode
              border: "12px solid #111",
              color: isDarkMode ? "#00ff00" : "#000",
              fontSize: "28px",
              fontWeight: "bold",
              textAlign: "center",
              boxShadow: `
                inset -4px -4px 8px rgba(0,0,0,0.4),
                inset 4px 4px 8px rgba(255,255,255,0.2)
              `,
            }}
          >
            {/* Content inside the screen */}
            {isDarkMode ? "Y2K Dark Mode" : "Y2K Light Mode"}
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

      <style jsx>{`
        .rainbow-text {
          font-weight: bold;
          background: linear-gradient(
            90deg,
            red,
            orange,
            yellow,
            green,
            blue,
            indigo,
            violet
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: rainbow 3s linear infinite;
        }

        @keyframes rainbow {
          0% {
            background-position: 0%;
          }
          100% {
            background-position: 100%;
          }
        }
      `}</style>
    </div>
  );
}