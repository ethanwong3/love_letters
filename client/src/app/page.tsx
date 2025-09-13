"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const navTargetRef = useRef<string | null>(null);

  const closeOnboarding = () => {
    setShowOnboarding(false)
    localStorage.setItem("onboardingShown", "true");
  };

  // redirect to login if not authenticated and show onboarding if first time
  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      const onboardingShown = localStorage.getItem("onboardingShown");
      if (!onboardingShown) {
        setShowOnboarding(true);
      }
    }
  }, [user, router]);

  // initialise dark mode from localStorage
  useEffect(() => {
    const stored = typeof window !== "undefined" && localStorage.getItem("isDarkMode");
    if (stored !== null) setIsDarkMode(stored === "true");
  }, []);

  // track cursor position for background parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!user) return null;

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      // persist choice so routed pages can read it
      try {
        localStorage.setItem("isDarkMode", String(next));
      } catch {}
      return next;
    });
  };

  const calculateBackgroundPosition = () => {
    const x = (cursorPosition.x / window.innerWidth) * 100;
    const y = (cursorPosition.y / window.innerHeight) * 100;
    return `${50 - x / 2}% ${50 - y / 2}%`;
  };

  // handle navigation with zoom animation
  const handleNavigate = (path: "/write" | "/letters" | "/inbox" | "/profile") => {
    // guard: if already zooming, ignore
    if (isZooming) return;

    navTargetRef.current = path;
    setIsZooming(true);

    // duration must match CSS transition below (400ms)
    window.setTimeout(() => {
      router.push(path);
    }, 800);
  };

  // screen styles
  const screenWidth = 600;
  const screenHeight = 450;
  const popupWidth = Math.round(screenWidth * 0.8); // 80% (used previously)
  const popupHeight = Math.round(screenHeight * 0.8);

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
        {/* Onboarding Popup (unchanged) */}
        {showOnboarding && user.email !== "lynettenhan7@gmail.com" && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{
              backdropFilter: "blur(8px)",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
            }}
            onClick={closeOnboarding}
          >
            <div
              className="retro-popup w-11/12 max-w-xl"
              style={{
                backgroundColor: "#c0c0c0",
                border: "2px solid #000",
                boxShadow: "6px 6px 0px rgba(0,0,0,0.6)",
                fontFamily: "Tahoma, Verdana, sans-serif",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Title Bar */}
              <div
                className="flex justify-between items-center px-2 py-1"
                style={{
                  backgroundColor: "#000080",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                <span>System Notice</span>
                <button
                  onClick={closeOnboarding}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "red";
                    e.currentTarget.style.borderColor = "red";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#c0c0c0";
                    e.currentTarget.style.borderColor = "#fff";
                    e.currentTarget.style.color = "#000";
                  }}
                  style={{
                    backgroundColor: "#c0c0c0",
                    border: "2px outset #fff",
                    width: "20px",
                    height: "20px",
                    lineHeight: "16px",
                    fontWeight: "bold",
                    color: "#000",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div className="flex p-6 gap-6">
                {/* Cat Image */}
                <div className="flex items-center justify-center">
                  <img
                    src="/cat7.jpeg"
                    alt="Cat"
                    className="w-40 h-40 object-cover border border-black"
                  />
                </div>

                {/* Text */}
                <div className="flex-1 text-sm text-black leading-relaxed">
                  <p className="mb-4">
                    Hey <strong>{user.displayName}</strong>! <br />
                    <br />
                    Welcome to <em>love_letters</em>, your online letterbox. I
                    was made as a gift for lyn so that she can read all the
                    letters her friends and family have written for her.
                  </p>
                  <p>
                    When you close this message, you’ll find icons to write,
                    edit, send, and personalise letters with music and photos.
                    Don’t forget to send them to the user named{" "}
                    <em>
                      <span className="text-pink-500">lyn</span>
                    </em>
                    !
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-center p-4 pt-0">
                <button
                  onClick={closeOnboarding}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#a9a9a9";
                    e.currentTarget.style.borderColor = "#ddd";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#c0c0c0";
                    e.currentTarget.style.borderColor = "#fff";
                  }}
                  style={{
                    backgroundColor: "#c0c0c0",
                    border: "2px outset #fff",
                    padding: "4px 16px",
                    fontWeight: "bold",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

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
            // apply a zooming transform when isZooming === true; transition duration matches setTimeout
            className="relative flex flex-col items-center justify-center"
            style={{
              width: `${screenWidth}px`,
              height: `${screenHeight}px`,
              backgroundColor: isDarkMode ? "#001f3f" : "#dff9fb",
              border: "12px solid #111",
              color: isDarkMode ? "#00ff00" : "#000",
              fontSize: "28px",
              fontWeight: "bold",
              textAlign: "center",
              boxShadow: `
                inset -4px -4px 8px rgba(0,0,0,0.4),
                inset 4px 4px 8px rgba(255,255,255,0.2)
              `,
              // animation transform + transition
              transformOrigin: "center",
              transform: isZooming ? "scale(6) translateY(-6%)" : "scale(1)",
              transition: "transform 1200ms cubic-bezier(.25,1,.5,1), opacity 1200ms ease",
              zIndex: 20,
              overflow: "hidden",
            }}
          >
            {/* Header title */}
            <div style={{ marginBottom: 8 }}>love_letters</div>

            {/* Icon grid: 2x2 */}
            <div
              className="grid grid-cols-2 gap-6 items-center justify-items-center"
              style={{ width: "70%", marginTop: 8 }}
            >
              <IconButton
                label="Write"
                emoji="📝"
                onClick={() => handleNavigate("/write")}
                isDarkMode={isDarkMode}
              />
              <IconButton
                label="Letters"
                emoji="📂"
                onClick={() => handleNavigate("/letters")}
                isDarkMode={isDarkMode}
              />
              <IconButton
                label="Inbox"
                emoji="📬"
                onClick={() => handleNavigate("/inbox")}
                isDarkMode={isDarkMode}
              />
              <IconButton
                label="Profile"
                emoji="👤"
                onClick={() => handleNavigate("/profile")}
                isDarkMode={isDarkMode}
              />
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
    </div>
  );
}

/* Small IconButton component used in the grid */
function IconButton({
  label,
  emoji,
  onClick,
  isDarkMode
}: {
  label: string;
  emoji: string;
  onClick: () => void;
  isDarkMode: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center"
      style={{
        width: 120,
        height: 120,
        borderRadius: 12,
        background: isDarkMode ? '#333': "rgba(255,255,255,0.92)",
        border: "2px solid rgba(0,0,0,0.12)",
        boxShadow: "4px 4px 10px rgba(0,0,0,0.15)",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
    </button>
  );
}
