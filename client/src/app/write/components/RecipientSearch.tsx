"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { User } from "@/types/user";
import { useAuth } from "@/context/AuthContext";

interface Props {
  onSelect: (user: User) => void;
}

export default function RecipientSearch({ onSelect }: Props) {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);

  async function handleSearch() {
    if (!query) return;
    const users = await apiFetch<User[]>(`/user/search/${query}`);
    const filteredUsers = users.filter((user) => user.id !== currentUser?.id);
    setResults(filteredUsers);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  function clearInput() {
    setQuery("");
    setResults([]);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Choose a Recipient</h2>
      <div className="flex items-center">
        <div className="relative flex-1">
          <input
            className="w-full border px-2 py-1 pr-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by display name"
          />
          {query && (
            <button
              onClick={clearInput}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              X
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          className="ml-2 px-4 py-1 border bg-blue-500 text-white hover:bg-blue-600"
        >
          Search
        </button>
      </div>
      <ul className="space-y-2">
        {results.map((user) => (
          <li
            key={user.id}
            className="p-2 border hover:bg-gray-100 cursor-pointer"
            onClick={() => onSelect(user)}
          >
            <div className="font-medium">{user.displayName}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}