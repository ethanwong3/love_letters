"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import PopupWrite from "../components/write";
import PopupLetters from "../components/letters";
import PopupInbox from "../components/inbox";
import PopupProfile from "../components/profile";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Popups state
  const [openPopups, setOpenPopups] = useState<string[]>([]);
  const [focusedPopup, setFocusedPopup] = useState<string | null>(null);

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

  // Open a popup and set focus
  const handleOpenPopup = (popup: string) => {
    if (!openPopups.includes(popup)) {
      setOpenPopups((prev) => [...prev, popup]);
    }
    setFocusedPopup(popup);
  };

  // Close a popup
  const handleClosePopup = (popup: string) => {
    setOpenPopups((prev) => prev.filter((p) => p !== popup));
    if (focusedPopup === popup) {
      setFocusedPopup(null);
    }
  };

  // Shift focus when clicking on a popup
  const handleFocusPopup = (popup: string) => {
    setFocusedPopup(popup);
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
            className="relative flex items-center justify-center"
            style={{
              width: "600px",
              height: "450px",
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
            }}
          >
            {/* App icons */}
            <div className="flex gap-6">
              <button onClick={() => handleOpenPopup("write")}>📝</button>
              <button onClick={() => handleOpenPopup("letters")}>📂</button>
              <button onClick={() => handleOpenPopup("inbox")}>📬</button>
              <button onClick={() => handleOpenPopup("profile")}>👤</button>
            </div>

            {/* Popups */}
            {openPopups.includes("write") && (
              <PopupWrite
                isFocused={focusedPopup === "write"}
                onClose={() => handleClosePopup("write")}
                onFocus={() => handleFocusPopup("write")}
              />
            )}
            {openPopups.includes("letters") && (
              <PopupLetters
                isFocused={focusedPopup === "letters"}
                onClose={() => handleClosePopup("letters")}
                onFocus={() => handleFocusPopup("letters")}
              />
            )}
            {openPopups.includes("inbox") && (
              <PopupInbox
                isFocused={focusedPopup === "inbox"}
                onClose={() => handleClosePopup("inbox")}
                onFocus={() => handleFocusPopup("inbox")}
              />
            )}
            {openPopups.includes("profile") && (
              <PopupProfile
                isFocused={focusedPopup === "profile"}
                onClose={() => handleClosePopup("profile")}
                onFocus={() => handleFocusPopup("profile")}
              />
            )}
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
