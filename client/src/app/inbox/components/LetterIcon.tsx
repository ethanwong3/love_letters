"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { User } from "@/types/user";

type Props = {
  letter: any;
  onClick: () => void;
};

export default function LetterIcon({ letter, onClick }: Props) {
  const isOpened = letter.status === "OPENED";
  const [authorDisplayName, setAuthorDisplayName] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      const fetchAuthor = async () => {
        const user = await apiFetch<User>(`/user/${letter.authorId}`);
        setAuthorDisplayName(user.displayName);
      };
      fetchAuthor();
    } catch (err) {
      console.log("Could not fetch author display name:", err);
    }
  }, []);

  return (
    <div
      className="cursor-pointer hover:scale-110 transition-transform duration-200 p-2"
      onClick={onClick}
    >
      {/* Letter Icon */}
      <div className="relative mb-2">
        <img
          src={isOpened ? "/mailopened.png" : "/mail.png"}
          alt="letter icon"
          className="w-16 h-16 mx-auto"
        />
      </div>
      
      {/* Letter Details */}
      <div className="text-center space-y-1">        
        {/* Author Display Name */}
        <p className="text-xs text-purple-600 font-medium truncate">
          From: {authorDisplayName || "Unknown"}
        </p>
        
        {/* Creation Date */}
        <p className="text-xs text-purple-500">
          {new Date(letter.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}