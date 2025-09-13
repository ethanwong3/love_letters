"use client";

import { useEffect, useState } from "react";
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

  // Fetch all received letters
  useEffect(() => {
    if (!token) return;

    const fetchLetters = async () => {
      try {
        const data = await apiFetch<Letter[]>("/letter/received");
        setLetters(data);
      } catch (err) {
        console.error("Failed to fetch letters:", err);
      }
    };

    fetchLetters();
  }, [token]);

  // Open a letter and mark as opened
  const onOpenLetter = async (letter: Letter) => {
    try {
      // Call the backend endpoint that both returns the letter and marks it as opened
      const updatedLetter = await apiFetch<Letter>(`/letter/received/${letter.id}`);
      
      // Update local state
      setLetters((prev) =>
        prev.map((l) => (l.id === updatedLetter.id ? updatedLetter : l))
      );
      setSelectedLetter(updatedLetter);
    } catch (err) {
      console.error("Failed to mark letter as opened:", err);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#F8B7D4] via-[#F3CFE6] to-[#A28CC5] p-8">
      <button
        onClick={() => router.push("/")}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Back to Homepage
      </button>
      <h1 className="text-3xl font-bold text-purple-600 mb-6">Inbox</h1>
      <div className="grid grid-cols-4 gap-4">
        {letters.map((letter) => (
          <LetterIcon
            key={letter.id}
            letter={letter}
            onClick={() => onOpenLetter(letter)}
          />
        ))}
      </div>

      {selectedLetter && (
        <LetterModal
          letter={selectedLetter}
          onClose={() => setSelectedLetter(null)}
        />
      )}
    </div>
  );
}
