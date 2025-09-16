import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { User } from "@/types/user";
import { useAuth } from "@/context/AuthContext";

interface Props {
  onSelect: (user: User) => void;
  onBack: () => void;
  successMessage?: string;
}

export default function RecipientSearch({ onSelect, onBack, successMessage }: Props) {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchTriggered, setIsSearchTriggered] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const darkMode = localStorage.getItem("isDarkMode") === "true";
    setIsDarkMode(darkMode);
  }, []);

  async function handleSearch() {
    if (!query.trim()) return;
    setIsSearchTriggered(true);
    setIsSearching(true);
    try {
      const users = await apiFetch<User[]>(`/user/search/${encodeURIComponent(query)}`);
      const filteredUsers = users.filter((user) => user.id !== currentUser?.id);
      setResults(filteredUsers);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  function clearInput() {
    setQuery("");
    setResults([]);
    setIsSearchTriggered(false);
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: isDarkMode
          ? "linear-gradient(135deg, #000000, #001122, #003366)"
          : "linear-gradient(135deg, #ffffff, #e6f7ff, #b3d9ff)",
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-gradient-to-r from-green-400 to-blue-400 text-white p-6 rounded-3xl border-4 border-green-500 shadow-2xl animate-pulse">
            <div className="flex items-center justify-center space-x-3">
              <div className="text-3xl animate-bounce">✨</div>
              <p className="text-xl font-bold text-center">{successMessage}</p>
              <div className="text-3xl animate-bounce" style={{animationDelay: '0.5s'}}>💌</div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl border-4 border-pink-400 dark:border-purple-400 p-6 mb-6 shadow-2xl">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-600 dark:to-pink-600 text-white rounded-2xl border-2 border-purple-600 dark:border-purple-400 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-bold"
            >
              ← Home
            </button>

            {/* Heading */}
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              💫 Choose Recipient 💫
            </h1>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl border-4 border-blue-400 dark:border-blue-500 p-6 mb-6 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <input
                className="w-full border-3 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-gray-700 px-6 py-4 pr-12 rounded-2xl focus:border-blue-500 focus:outline-none text-blue-800 dark:text-blue-200 placeholder-blue-500 dark:placeholder-blue-400 text-lg font-medium"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setIsSearchTriggered(false);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search by username..."
                disabled={isSearching}
              />
              {query && (
                <button
                  onClick={clearInput}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 text-xl font-bold transition-colors duration-200"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
              className={`px-8 py-4 rounded-2xl border-3 font-bold text-lg transition-all duration-200 transform ${
                query.trim() && !isSearching
                  ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white border-blue-600 shadow-lg hover:shadow-xl hover:scale-105"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border-gray-400 cursor-not-allowed"
              }`}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Loading State */}
          {isSearching && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin text-4xl mb-4">🌀</div>
              <p className="text-blue-600 dark:text-blue-400 font-bold">Searching for friends...</p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && !isSearching && (
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 pixel-font mb-4">
                Found {results.length} user{results.length !== 1 ? 's' : ''} 👥
              </h3>
              {results.map((user) => (
                <div
                  key={user.id}
                  className="group p-4 border-3 border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-800 dark:hover:to-purple-800 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-102 hover:shadow-lg"
                  onClick={() => onSelect(user)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xl text-blue-800 dark:text-blue-200 group-hover:text-purple-600 dark:group-hover:text-purple-300">
                        {user.displayName}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {results.length === 0 && isSearchTriggered && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😢</div>
              <p className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">
                No friends found with "{query}"
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Try a different search term or check the spelling
              </p>
            </div>
          )}

          {/* Empty State */}
          {!query && results.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                Wanna write?
              </p>
              <p className="text-blue-500 dark:text-blue-300">
                Type a name above to start searching for your friends
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .pixel-font {
          font-family: 'Courier New', monospace;
          text-shadow: 2px 2px 0px rgba(0,0,0,0.1);
        }
        .border-3 {
          border-width: 3px;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}