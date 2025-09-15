"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { SunIcon, MoonIcon, HomeIcon, UserIcon } from "@heroicons/react/24/solid";

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

  // redirect to login if not authenticated and show onboarding if first time
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

  // initialise dark mode from localStorage
  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" && localStorage.getItem("isDarkMode");
      if (stored !== null) setIsDarkMode(stored === "true");
    } catch {}
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

  // screen dimensions
  const screenWidth = 680;
  const screenHeight = 510;

  // handle navigation with zoom animation
  const handleNavigate = (path: "/write" | "/inbox") => {
    if (isZooming) return; // prevent double clicks
    navTargetRef.current = path;
    setIsZooming(true);

    window.setTimeout(() => {
      router.push(path);
    }, 800);
  };

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
        {/* Onboarding popup */}
        {showOnboarding && user.email !== "lynettenhan7@gmail.com" && (
          <OnboardingPopup user={user} closeOnboarding={closeOnboarding} />
        )}

        {/* Retro Computer */}
        <div
          className="relative flex flex-col items-center"
          style={{
            backgroundColor: isDarkMode ? "#2b2b2b" : "#fdf5e6",
            border: `20px solid ${isDarkMode ? "#4a4a4a" : "#e0e0e0"}`,
            borderRadius: 12,
            boxShadow: isDarkMode
              ? `
                inset -8px -8px 16px rgba(255,255,255,0.1),
                8px 8px 20px rgba(0,0,0,0.6)
              `
              : `
                inset -8px -8px 16px rgba(0,0,0,0.2),
                8px 8px 20px rgba(0,0,0,0.4)
              `,
            padding: 16,
            transform: "scale(1.4, 1.3)",
          }}
        >
          {/* Screen */}
          <div
            className="relative flex flex-col items-center justify-center"
            style={{
              width: `${screenWidth}px`,
              height: `${screenHeight}px`,
              backgroundColor: isDarkMode ? "#001f3f" : "#dff9fb",
              border: "12px solid #111",
              color: isDarkMode ? "#00ff00" : "#000",
              fontSize: 28,
              fontWeight: "bold",
              textAlign: "center",
              boxShadow: `
                inset -4px -4px 8px rgba(0,0,0,0.4),
                inset 4px 4px 8px rgba(255,255,255,0.2)
              `,
              transformOrigin: "center",
              // more dramatic zoom when isZooming
              transform: isZooming ? "scale(10) translateY(-5%)" : "scale(1)",
              transition: "transform 1200ms cubic-bezier(.25,1,.5,1), opacity 1200ms ease",
              zIndex: 20,
              overflow: "hidden",
            }}
          >
            {/* Home screen icons (2x1) */}
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

          {/* Bottom Controls: left spacer, center toggle, right small buttons */}
          <div className="flex items-center justify-between mt-4 w-full px-2">
            {/* Left spacer to keep toggle centered */}
            <div style={{ width: 160 }} />

            {/* Center: Light/Dark Toggle */}
            <div style={{ display: "flex", justifyContent: "center", width: 200 }}>
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-center"
                style={{
                  width: "160px",
                  height: "40px",
                  borderRadius: "4px",
                  backgroundColor: isDarkMode ? "#1c1c1c" : "#eaeaea",
                  border: `2px solid ${isDarkMode ? "#1c1c1c" : "#ccc"}`,
                  boxShadow: isDarkMode
                    ? "inset -2px -2px 6px rgba(255,255,255,0.1), inset 2px 2px 6px rgba(0,0,0,0.8)"
                    : "inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.7)",
                  color: isDarkMode ? "#a6a6a6" : "#333",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
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

            {/* Right: Home & Profile — retro, not glossy */}
            <div className="flex gap-5 items-center justify-end" style={{ width: 160 }}>
              <CircleButton
                ariaLabel="Home"
                onClick={() => {
                  setScreenView("home");
                }}
                icon={<HomeIcon className="w-5 h-5" />}
                isDarkMode={isDarkMode}
              />
              <CircleButton
                ariaLabel="Profile"
                onClick={() => {
                  setScreenView("profile");
                }}
                icon={<UserIcon className="w-5 h-5" />}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- ICON BUTTON (image-based, bigger, hover effects) ---------- */
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

  const imgStyle: React.CSSProperties = {
    width: 150,
    height: 150,
    objectFit: "contain",
    display: "block",
    pointerEvents: "none",
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
        <img src={src} alt={alt} style={imgStyle} />
      </div>
      <div style={labelStyle}>{label}</div>
    </button>
  );
}

/* ---------- SMALL RETRO CIRCLE BUTTON ---------- */
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
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: 40,
        height: 40,
        borderRadius: "4px", 
        background: isDarkMode
          ? "#1c1c1c"
          : "#e3e3e3",
        border: `2px solid ${isDarkMode ? "#1c1c1c" : "#ccc"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: isDarkMode ? "#a6a6a6" : "#333",

        boxShadow: isDarkMode
          ? "inset -2px -2px 6px rgba(255,255,255,0.1), inset 2px 2px 6px rgba(0,0,0,0.8)"
          : "inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.7)",
      }}
    >
      <div style={{ width: 20, height: 20 }}>{icon}</div>
    </button>
  );
}


/* ---------- PROFILE SCREEN ---------- */
function ProfileScreen({
  user,
  isDarkMode,
  handleLogout,
}: {
  user: any;
  isDarkMode: boolean;
  handleLogout: () => void;
}) {
  const panelBg = isDarkMode ? "#1b1d1e" : "#f0f0f0";
  const panelBorder = isDarkMode ? "#4a4d50" : "#888";
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("Received message:", event.data);
      if (event.data && event.data.access_token) {
        console.log("Storing Spotify access token:", event.data.access_token);
        localStorage.setItem("spotifyAccessToken", event.data.access_token);
        setSpotifyConnected(true);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const connectSpotify = () => {
    console.log("Connecting to Spotify...");
    const w = 500,
      h = 600;
    const topWindow = window.top ?? window;
    const y = topWindow.outerHeight / 2 + topWindow.screenY - h / 2;
    const x = topWindow.outerWidth / 2 + topWindow.screenX - w / 2;
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/spotify/login`,
      "Spotify Login",
      `width=${w},height=${h},top=${y},left=${x}`
    );
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
      {/* Header */}
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

      {/* Info card */}
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <span style={{ fontWeight: 600 }}>name:</span>
          <span>{user.displayName}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <span style={{ fontWeight: 600 }}>email:</span>
          <span>{user.email}</span>
        </div>
      </div>

      {/* Actions row: Spotify + Logout */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 20,
          marginTop: 10,
        }}
      >
        {/* Spotify Button */}
        {spotifyConnected ? (
          <div
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
            <img
              src={isDarkMode ? "/spotifydark.jpeg" : "/spotifylight.jpeg"}
              alt="spotify"
              style={{ width: 22, height: 22 }}
            />
            Connected
          </div>
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
            <img
              src={isDarkMode ? "/spotifydark.jpeg" : "/spotifylight.jpeg"}
              alt="spotify"
              style={{ width: 22, height: 22 }}
            />
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              Connect
            </span>
          </button>
        )}

        {/* Logout Button */}
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

      {/* Under Development System Error */}
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
        <img
          src="/gengar3.jpeg"
          alt="gengar error"
          style={{
            width: 200,
            height: 200,
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

/* ---------- ONBOARDING POPUP ---------- */
function OnboardingPopup({ user, closeOnboarding }: any) {
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
              Welcome to <em>love_letters</em>, your online letterbox. I was
              made as a gift for lyn so that she can read all the letters her
              friends and family have written for her.
            </p>
            <p>
              When you close this message, you’ll find icons to write, edit,
              send, and personalise letters with music and photos. Don’t forget
              to send them to the user named{" "}
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
  );
}
