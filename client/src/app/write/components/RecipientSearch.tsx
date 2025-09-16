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
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    const darkMode = localStorage.getItem("isDarkMode") === "true";
    setIsDarkMode(darkMode);
  }, []);

  useEffect(() => {
    if (successMessage) {
      setShowSuccessPopup(true);
    }
  }, [successMessage]);

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

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

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
        {/* Header */}
        <div className={`backdrop-blur-sm rounded-3xl border-4 p-6 mb-6 shadow-2xl ${
          isDarkMode 
            ? 'bg-gray-800/90 border-purple-400 text-white'
            : 'bg-white/90 border-pink-400 text-gray-900'
        }`}>
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={onBack}
              className={`px-4 py-2 text-white rounded-2xl border-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-bold ${
                isDarkMode
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400'
                  : 'bg-gradient-to-r from-purple-400 to-pink-400 border-purple-600'
              }`}
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
        <div className={`backdrop-blur-sm rounded-3xl border-4 p-6 mb-6 shadow-2xl ${
          isDarkMode 
            ? 'bg-gray-800/90 border-blue-500'
            : 'bg-white/90 border-blue-400'
        }`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <input
                className={`w-full border-3 px-6 py-4 pr-12 rounded-2xl focus:outline-none text-lg font-medium ${
                  isDarkMode
                    ? 'border-blue-600 bg-gray-700 text-blue-200 placeholder-blue-400 focus:border-blue-400'
                    : 'border-blue-300 bg-blue-50 text-blue-800 placeholder-blue-500 focus:border-blue-500'
                }`}
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
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-xl font-bold transition-colors duration-200 ${
                    isDarkMode
                      ? 'text-blue-400 hover:text-blue-200'
                      : 'text-blue-500 hover:text-blue-700'
                  }`}
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
                  : isDarkMode
                    ? "bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed"
                    : "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
              }`}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Loading State */}
          {isSearching && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin text-4xl mb-4">🌀</div>
              <p className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                Searching for friends...
              </p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && !isSearching && (
            <div className="space-y-3">
              <h3 className={`text-xl font-bold pixel-font mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                Found {results.length} user{results.length !== 1 ? 's' : ''} 👥
              </h3>
              {results.map((user) => (
                <div
                  key={user.id}
                  className={`group p-4 border-3 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-102 hover:shadow-lg ${
                    isDarkMode
                      ? 'border-blue-700 bg-gradient-to-r from-blue-900 to-purple-900 hover:from-blue-800 hover:to-purple-800'
                      : 'border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100'
                  }`}
                  onClick={() => onSelect(user)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-bold text-xl transition-colors ${
                        isDarkMode
                          ? 'text-blue-200 group-hover:text-purple-300'
                          : 'text-blue-800 group-hover:text-purple-600'
                      }`}>
                        {user.displayName}
                      </div>
                      <div className={`text-sm font-medium ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>
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
              <p className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                No friends found with "{query}"
              </p>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                Try a different search term or check the spelling
              </p>
            </div>
          )}

          {/* Empty State */}
          {!query && results.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                Wanna write?
              </p>
              <p className={isDarkMode ? 'text-blue-300' : 'text-blue-500'}>
                Type a name above to start searching for your friends
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Success Popup - Windows Style */}
      {showSuccessPopup && successMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div 
            className="bg-gray-200 border-2 border-gray-800 shadow-2xl pixel-font"
            style={{
              width: '450px',
              boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf, inset -2px -2px #808080, inset 2px 2px #c0c0c0'
            }}
          >
            {/* Title Bar */}
            <div 
              className="text-white px-2 py-1 flex items-center justify-between text-sm font-bold"
              style={{
                background: 'linear-gradient(90deg, #008000 0%, #006000 100%)'
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 border border-green-700 flex items-center justify-center text-xs">✓</div>
                <span>System Notice</span>
              </div>
              <button
                onClick={closeSuccessPopup}
                className="w-4 h-4 bg-gray-300 border border-gray-600 flex items-center justify-center text-black text-xs hover:bg-gray-400"
                style={{
                  boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-green-100 border-2 border-green-400 rounded flex items-center justify-center flex-shrink-0">
                  <img
                    src='/kirby2.jpeg'
                    className="w-30 h-30 object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-800 mb-3 text-base">Operation Successful!</div>
                  <div className="text-gray-700 text-sm bg-white border-2 border-gray-400 p-3 font-mono leading-relaxed">
                    {successMessage}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={closeSuccessPopup}
                  className="px-12 py-3 bg-gray-300 border-2 border-gray-600 text-gray-800 font-bold text-sm hover:bg-gray-400 transition-colors"
                  style={{
                    boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf, inset -2px -2px #808080, inset 2px 2px #c0c0c0'
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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