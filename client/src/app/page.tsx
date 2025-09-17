"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { SunIcon, MoonIcon, HomeIcon, UserIcon } from "@heroicons/react/24/solid";

// Type definitions
interface User {
  displayName: string;
  email: string;
}

interface OnboardingPopupProps {
  user: User;
  closeOnboarding: () => void;
}

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [screenView, setScreenView] = useState<"home" | "profile">("home");
  const navTargetRef = useRef<string | null>(null);

  const closeOnboarding = () => {
    setShowOnboarding(false);
    try {
      localStorage.setItem("onboardingShown", "true");
    } catch {}
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      const onboardingShown = typeof window !== "undefined" ? localStorage.getItem("onboardingShown") : null;
      if (!onboardingShown) {
        setShowOnboarding(true);
      }
    }
  }, [user, router]);

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" && localStorage.getItem("isDarkMode");
      if (stored !== null) setIsDarkMode(stored === "true");
    } catch {}
  }, []);

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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleNavigate = (path: "/write" | "/inbox") => {
    if (isZooming) return;
    navTargetRef.current = path;
    setIsZooming(true);

    window.setTimeout(() => {
      router.push(path);
    }, 800);
  };

  const screenWidth = 600;
  const screenHeight = 450;

  return (
    <div
      className="h-screen w-screen"
      style={{
        backgroundImage: `url('/${isDarkMode ? "backgrounddark" : "backgroundlight"}.jpg')`,
        backgroundSize: "160%",
        backgroundPosition: calculateBackgroundPosition(),
        transition: "background-position 0.12s ease-out",
      }}
    >
      <div className="flex items-center justify-center h-full">
        {showOnboarding && user.email !== "lynettenhan7@gmail.com" && (
          <OnboardingPopup user={user} closeOnboarding={closeOnboarding} />
        )}

        {/* Enhanced Retro Computer - More 3D and Bulky */}
        <div
          className="relative flex flex-col items-center"
          style={{
            backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5dc",
            border: `28px solid ${isDarkMode ? "#333" : "#d4d4aa"}`,
            borderRadius: 24,
            boxShadow: isDarkMode
              ? `
                inset -12px -12px 24px rgba(255,255,255,0.08),
                inset 12px 12px 24px rgba(0,0,0,0.5),
                -8px -8px 16px rgba(255,255,255,0.05),
                12px 12px 32px rgba(0,0,0,0.7),
                0 0 0 6px ${isDarkMode ? '#2a2a2a' : '#e5e5c0'},
                0 0 0 12px ${isDarkMode ? '#404040' : '#cccc99'}
              `
              : `
                inset -12px -12px 24px rgba(0,0,0,0.15),
                inset 12px 12px 24px rgba(255,255,255,0.8),
                -8px -8px 16px rgba(255,255,255,0.6),
                12px 12px 32px rgba(0,0,0,0.3),
                0 0 0 6px ${isDarkMode ? '#2a2a2a' : '#e5e5c0'},
                0 0 0 12px ${isDarkMode ? '#404040' : '#cccc99'}
              `,
            padding: 24,
            transform: "scale(1.4, 1.3)",
          }}
        >

          {/* Screen Bezel - More Pronounced */}
          <div
            style={{
              padding: 20,
              backgroundColor: isDarkMode ? "#1a1a1a" : "#e8e8d0",
              borderRadius: 16,
              boxShadow: isDarkMode
                ? `
                  inset -6px -6px 12px rgba(255,255,255,0.08),
                  inset 6px 6px 12px rgba(0,0,0,0.6)
                `
                : `
                  inset -6px -6px 12px rgba(0,0,0,0.2),
                  inset 6px 6px 12px rgba(255,255,255,0.8)
                `,
            }}
          >
            {/* Screen */}
            <div
              className="relative flex flex-col items-center justify-center"
              style={{
                width: `${screenWidth}px`,
                height: `${screenHeight}px`,
                backgroundColor: isDarkMode ? "#001122" : "#e6f7ff",
                border: "16px solid #0a0a0a",
                color: isDarkMode ? "#00ff41" : "#003366",
                fontSize: 28,
                fontWeight: "bold",
                textAlign: "center",
                borderRadius: 8,
                boxShadow: `
                  inset -6px -6px 12px rgba(0,0,0,0.8),
                  inset 6px 6px 12px rgba(255,255,255,0.1),
                  0 0 20px rgba(0,0,0,0.5)
                `,
                transformOrigin: "center",
                transform: isZooming ? "scale(10) translateY(-5%)" : "scale(1)",
                transition: "transform 1200ms cubic-bezier(.25,1,.5,1), opacity 1200ms ease",
                zIndex: 20,
                overflow: "hidden",
              }}
            >
              {/* Subtle screen reflection effect */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.05) 100%)',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              />

              {screenView === "home" ? (
                <div
                  className="grid grid-cols-2 gap-x-24 gap-y-8 items-center justify-items-center"
                  style={{ width: "62%", marginTop: 6 }}
                >
                  <IconButton
                    src="/write.png"
                    alt="Write"
                    label="write"
                    onClick={() => handleNavigate("/write")}
                    isDarkMode={isDarkMode}
                  />
                  <IconButton
                    src="/inbox.png"
                    alt="Inbox"
                    label="inbox"
                    onClick={() => handleNavigate("/inbox")}
                    isDarkMode={isDarkMode}
                  />
                </div>
              ) : (
                <ProfileScreen user={user} isDarkMode={isDarkMode} handleLogout={handleLogout} />
              )}
            </div>
          </div>

          {/* Enhanced Control Panel */}
          <div className="flex items-center justify-between mt-6 w-full px-2">
            <div style={{ width: 160 }} />

            {/* Center: Enhanced Toggle Button */}
            <div style={{ display: "flex", justifyContent: "center", width: 200 }}>
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-center"
                style={{
                  width: "180px",
                  height: "48px",
                  borderRadius: "8px",
                  backgroundColor: isDarkMode ? "#0f0f0f" : "#f0f0f0",
                  border: `4px solid ${isDarkMode ? "#1a1a1a" : "#d0d0d0"}`,
                  boxShadow: isDarkMode
                    ? `
                      -2px -2px 4px rgba(255,255,255,0.05),
                      2px 2px 8px rgba(0,0,0,0.4)
                    `
                    : `
                      inset -4px -4px 8px rgba(0,0,0,0.2),
                      inset 4px 4px 8px rgba(255,255,255,0.8),
                      -2px -2px 4px rgba(255,255,255,0.6),
                      2px 2px 8px rgba(0,0,0,0.2)
                    `,
                  color: isDarkMode ? "#999" : "#333",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                  transition: "all 0.15s ease",
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

            {/* Right: Enhanced Circle Buttons */}
            <div className="flex gap-6 items-center justify-end" style={{ width: 160 }}>
              <CircleButton
                ariaLabel="Home"
                onClick={() => setScreenView("home")}
                icon={<HomeIcon className="w-5 h-5" />}
                isDarkMode={isDarkMode}
                active={screenView === "home"}
              />
              <CircleButton
                ariaLabel="Profile"
                onClick={() => setScreenView("profile")}
                icon={<UserIcon className="w-5 h-5" />}
                isDarkMode={isDarkMode}
                active={screenView === "profile"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  src,
  alt,
  label,
  onClick,
  isDarkMode,
}: {
  src: string;
  alt: string;
  label: string;
  onClick: () => void;
  isDarkMode: boolean;
}) {
  const [hover, setHover] = useState(false);

  const wrapperStyle: React.CSSProperties = {
    width: 200,
    height: 200,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 180ms ease, box-shadow 180ms ease, border 180ms ease",
    transform: hover ? "scale(1.05)" : "scale(1)",
    background: "transparent",
    cursor: "pointer",
  };

  const labelStyle: React.CSSProperties = {
    marginTop: 8,
    fontSize: 18,
    fontWeight: 800,
    textShadow: isDarkMode ? "0 2px 0 rgba(0,0,0,0.6)" : "0 1px 0 rgba(255,255,255,0.6)",
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: "transparent", border: "none", padding: 0 }}
      aria-label={label}
    >
      <div style={wrapperStyle}>
        <Image
          src={src}
          alt={alt}
          width={150}
          height={150}
          style={{
            objectFit: "contain",
            display: "block",
            pointerEvents: "none",
          }}
        />
      </div>
      <div style={labelStyle}>{label}</div>
    </button>
  );
}

function CircleButton({
  icon,
  onClick,
  ariaLabel,
  isDarkMode,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  ariaLabel?: string;
  isDarkMode: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: 48,
        height: 48,
        borderRadius: "8px",
        background: isDarkMode ? "#0f0f0f" : "#e8e8e8",
        border: `3px solid ${isDarkMode ? "#1a1a1a" : "#ccc"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: isDarkMode ? "#999" : "#333",
        boxShadow: isDarkMode
          ? `
            -1px -1px 2px rgba(255,255,255,0.05),
            1px 1px 4px rgba(0,0,0,0.3)
          `
          : `
            inset -3px -3px 6px rgba(0,0,0,0.2),
            inset 3px 3px 6px rgba(255,255,255,0.8),
            -1px -1px 2px rgba(255,255,255,0.6),
            1px 1px 4px rgba(0,0,0,0.2)
          `,
        transition: "all 0.15s ease",
      }}
    >
      <div style={{ width: 20, height: 20 }}>{icon}</div>
    </button>
  );
}

function ProfileScreen({
  user,
  isDarkMode,
  handleLogout,
}: {
  user: User;
  isDarkMode: boolean;
  handleLogout: () => void;
}) {
  const panelBg = isDarkMode ? "#1b1d1e" : "#f0f0f0";
  const panelBorder = isDarkMode ? "#4a4d50" : "#888";
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("spotifyAccessToken")) {
      setSpotifyConnected(true);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message:', event.data); // Add this debug line
      if (event.data && (event.data.access_token || event.data.accessToken)) {
        const token = event.data.access_token || event.data.accessToken;
        localStorage.setItem("spotifyAccessToken", token);
        setSpotifyConnected(true);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const connectSpotify = () => {
    const w = 500, h = 600;
    const topWindow = window.top ?? window;
    const y = topWindow.outerHeight / 2 + topWindow.screenY - h / 2;
    const x = topWindow.outerWidth / 2 + topWindow.screenX - w / 2;
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/spotify/login`,
      "Spotify Login",
      `width=${w},height=${h},top=${y},left=${x}`
    );
  };

  const disconnectSpotify = () => {
    localStorage.removeItem("spotifyAccessToken");
    setSpotifyConnected(false);
  };

  return (
    <div
      style={{
        width: "92%",
        height: "92%",
        padding: 10,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        color: isDarkMode ? "#e0e0e0" : "#111",
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          borderBottom: `2px solid ${panelBorder}`,
          paddingBottom: 10,
        }}
      >
        PROFILE
      </div>

      <div
        style={{
          alignSelf: "center",
          background: panelBg,
          border: `2px solid ${panelBorder}`,
          boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
          padding: "12px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: "fit-content",
          minWidth: 260,
          fontSize: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
          <span style={{ fontWeight: 600 }}>name:</span>
          <span>{user.displayName}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
          <span style={{ fontWeight: 600 }}>email:</span>
          <span>{user.email}</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10 }}>
        {spotifyConnected ? (
          <button
            onClick={disconnectSpotify}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              border: `2px solid ${panelBorder}`,
              boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
              background: panelBg,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <Image
              src={isDarkMode ? "/spotifydark.jpeg" : "/spotifylight.jpeg"}
              alt="spotify"
              width={22}
              height={22}
            />
            Connected
          </button>
        ) : (
          <button
            onClick={connectSpotify}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              border: `2px solid ${panelBorder}`,
              boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
              background: panelBg,
              cursor: "pointer",
            }}
          >
            <Image
              src={isDarkMode ? "/spotifydark.jpeg" : "/spotifylight.jpeg"}
              alt="spotify"
              width={22}
              height={22}
            />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Connect</span>
          </button>
        )}

        <button
          onClick={handleLogout}
          style={{
            padding: "6px 18px",
            fontWeight: 700,
            background: isDarkMode
              ? "linear-gradient(180deg, #2d2f31 0%, #111 100%)"
              : "linear-gradient(180deg, #f7b7d3 0%, #c0a6ff 100%)",
            color: isDarkMode ? "#e8ffe9" : "#111",
            border: `2px solid ${panelBorder}`,
            boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
            cursor: "pointer",
            fontSize: 14,
            textTransform: "uppercase",
          }}
        >
          LOGOUT
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 15,
          alignItems: "flex-start",
          background: panelBg,
          border: `2px solid ${panelBorder}`,
          boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
          padding: 15,
        }}
      >
        <Image
          src="/gengar3.jpeg"
          alt="gengar error"
          width={200}
          height={200}
          style={{
            objectFit: "cover",
            border: `2px solid ${panelBorder}`,
          }}
        />
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
          <div
            style={{
              fontWeight: 700,
              marginBottom: 10,
              color: isDarkMode ? "#ff7aa7" : "#a31244",
            }}
          >
            !!! SYSTEM ERROR !!!
          </div>
          <div>
            This part of the app is still undergoing development. Our developers
            may be working hard… or maybe just playing TFT. Either way, please
            try again later!
          </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingPopup({ user, closeOnboarding }: OnboardingPopupProps) {
  return (
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

        <div className="flex p-6 gap-6">
          <div className="flex items-center justify-center">
            <Image
              src="/cat7.jpeg"
              alt="Cat"
              width={160}
              height={160}
              className="object-cover border border-black"
            />
          </div>

          <div className="flex-1 text-sm text-black leading-relaxed">
            <p className="mb-4">
              Hey <strong>{user.displayName}</strong>! <br />
              <br />
              Welcome to <em>love_letters</em>, your online letterbox. I was
              made as a gift for lyn so that she can read all the letters her
              friends and family have written for her.
            </p>
            <p>
              When you close this message, you&apos;ll find icons to write, edit,
              send, and personalise letters with music and photos. Don&apos;t forget
              to send them to the user named
              <em>
                <span className="text-pink-500">lyn</span>
              </em>
              !
            </p>
          </div>
        </div>

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
  );
}