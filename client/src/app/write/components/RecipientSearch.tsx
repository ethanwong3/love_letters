"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { User } from "@/types/user";

interface Props {
  onSelect: (user: User) => void;
}

export default function RecipientSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);

  async function handleSearch() {
    if (!query) return;
    const users = await apiFetch<User[]>(`/user/search/${query}`);
    setResults(users);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Choose a Recipient</h2>
      <div className="flex gap-2">
        <input
          className="flex-1 border px-2 py-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by display name"
        />
        <button
          onClick={handleSearch}
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          Search
        </button>
      </div>

      <ul className="divide-y">
        {results.map((u) => (
          <li
            key={u.id}
            className="p-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => onSelect(u)}
          >
            <div className="font-medium">{u.displayName}</div>
            <div className="text-sm text-gray-500">{u.email}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
