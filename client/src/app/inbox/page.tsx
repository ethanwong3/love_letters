"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LetterIcon from "./components/LetterIcon";
import LetterModal from "./components/LetterModal";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
import type { Letter } from "../../types/letter";

export default function InboxPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('isDarkMode') === 'true') {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
  }, []);

  // Theme colors based on profile structure
  const panelBg = isDarkMode ? "#1b1d1e" : "#f0f0f0";
  const panelBorder = isDarkMode ? "#4a4d50" : "#888";

  // Fetch all received letters
  useEffect(() => {
    if (!token) return;

    const fetchLetters = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<Letter[]>("/letter/received");
        setLetters(data);
      } catch (err) {
        console.error("Failed to fetch letters:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLetters();
  }, [token]);

  // Open a letter and mark as opened
  const onOpenLetter = async (letter: Letter) => {
    try {
      const updatedLetter = await apiFetch<Letter>(`/letter/received/${letter.id}`);
      setLetters((prev) =>
        prev.map((l) => (l.id === updatedLetter.id ? updatedLetter : l))
      );
      setSelectedLetter(updatedLetter);
    } catch (err) {
      console.error("Failed to mark letter as opened:", err);
    }
  };

  const handleCloseModal = () => {
    setSelectedLetter(null);
  };

  return (
    <div 
      style={{
        minHeight: "100vh",
        background: isDarkMode
          ? "linear-gradient(135deg, #000000, #001122, #003366)"
          : "linear-gradient(135deg, #ffffff, #e6f7ff, #b3d9ff)",
        padding: "20px",
        color: isDarkMode ? "#e0e0e0" : "#111",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          style={{
            marginBottom: "20px",
            padding: "8px 16px",
            background: panelBg,
            border: `2px solid ${panelBorder}`,
            boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            color: isDarkMode ? "#e0e0e0" : "#111",
          }}
        >
          ← BACK TO HOME
        </button>
        
        {/* Header */}
        <div
          style={{
            fontSize: "24px",
            fontWeight: 700,
            borderBottom: `2px solid ${panelBorder}`,
            paddingBottom: "10px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          INBOX
        </div>

        <div
          style={{
            display: "flex", // Use flexbox
            justifyContent: "center", // Center horizontally
            alignItems: "center", // Center vertically
          }}
        >
          <div
            style={{
              background: panelBg, // Background only for the stats box
              border: `2px solid ${panelBorder}`,
              boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
              padding: "12px 18px",
              marginBottom: "20px",
              fontSize: "14px",
              fontWeight: 600,
              width: "fit-content",
            }}
          >
            {letters.length} LETTER{letters.length !== 1 ? 'S' : ''} 
            {letters.filter(l => l.status !== 'OPENED').length > 0 && 
              ` • ${letters.filter(l => l.status !== 'OPENED').length} UNREAD`
            }
          </div>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              background: panelBg,
              border: `2px solid ${panelBorder}`,
              boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "16px", animation: "spin 2s linear infinite" }}>✉️</div>
            <p style={{ fontWeight: 600 }}>LOADING LETTERS...</p>
          </div>
        ) : letters.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: panelBg,
              border: `2px solid ${panelBorder}`,
              boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
            <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>NO LETTERS YET</div>
            <p style={{ fontSize: "14px", opacity: 0.8 }}>YOUR INBOX IS EMPTY. LETTERS FROM FRIENDS WILL APPEAR HERE.</p>
          </div>
        ) : (
          <div
            style={{
              background: panelBg,
              border: `2px solid ${panelBorder}`,
              boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "16px",
                maxHeight: "70vh",
                overflowY: "auto",
              }}
            >
              {letters.map((letter) => (
                <LetterIcon
                  key={letter.id}
                  letter={letter}
                  onClick={() => onOpenLetter(letter)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedLetter && (
        <LetterModal
          letter={selectedLetter}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}