"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { User } from "@/types/user";
import type { Letter } from "@/types/letter";

interface Props {
  recipient: User;
  onDraft: (letter: Letter) => void;
}

export default function LetterEditor({ recipient, onDraft }: Props) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [songUrl, setSongUrl] = useState("");

  async function handleDraft() {
    const draft = await apiFetch<Letter>(`/letter`, {
      method: "POST",
      body: JSON.stringify({
        recipientId: recipient.id,
        subject,
        content,
        songUrl,
      }),
    });
    onDraft(draft);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Write to {recipient.displayName}</h2>

      <input
        className="w-full border px-2 py-1"
        placeholder="Subject (optional)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <textarea
        className="w-full border px-2 py-1 h-40"
        placeholder="Your message..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <input
        className="w-full border px-2 py-1"
        placeholder="Song URL (optional)"
        value={songUrl}
        onChange={(e) => setSongUrl(e.target.value)}
      />

      <button
        onClick={handleDraft}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Save Draft & Continue
      </button>
    </div>
  );
}
