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
  const [loading, setLoading] = useState(true);

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

  const handleCloseModal = () => {
    setSelectedLetter(null);
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#F8B7D4] via-[#F3CFE6] to-[#A28CC5] p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Back to Homepage
        </button>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-purple-600 mb-2">Inbox</h1>
          <p className="text-purple-700">
            {letters.length} letter{letters.length !== 1 ? 's' : ''} 
            {letters.filter(l => l.status !== 'OPENED').length > 0 && 
              ` • ${letters.filter(l => l.status !== 'OPENED').length} unread`
            }
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl mb-4">✉️</div>
            <p className="text-purple-600 font-semibold">Loading letters...</p>
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-purple-600 mb-2">No letters yet</h2>
            <p className="text-purple-500">Your inbox is empty. Letters from friends will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[70vh] overflow-y-auto p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
            {letters.map((letter) => (
              <LetterIcon
                key={letter.id}
                letter={letter}
                onClick={() => onOpenLetter(letter)}
              />
            ))}
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