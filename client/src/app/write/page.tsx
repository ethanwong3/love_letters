"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Write() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("isDarkMode");
      setIsDarkMode(stored === "true");
    } catch {
      setIsDarkMode(false);
    }
  }, []);

  const bg = isDarkMode ? "#001f3f" : "#dff9fb";
  const text = isDarkMode ? "#00ff00" : "#000";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        color: text,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 36,
      }}
    >
      <div style={{ width: "100%", maxWidth: 1000, padding: "0 20px" }}>
        <button
          onClick={() => router.push("/")}
          style={{
            background: "rgba(255,255,255,0.95)",
            border: "2px solid #111",
            padding: "8px 14px",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          ← Back
        </button>

        {/* Page is intentionally minimal for now */}
      </div>
    </div>
  );
}
