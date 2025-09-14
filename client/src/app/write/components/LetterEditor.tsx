import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Letter } from "@/types/letter";
import type { User } from "@/types/user";

interface Props {
  recipient: User;
  onDraft: (letter: Letter) => void;
}

export default function LetterEditor({ recipient, onDraft }: Props) {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState(
    `Dear ${recipient.displayName},\n\nWrite your message here.\n\nFrom,\n${user.displayName}`
  );
  const [songUrl, setSongUrl] = useState("");
  const [songFile, setSongFile] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string>("");

  // set the timestamp when the component mounts
  useEffect(() => {
    const now = new Date();
    setTimestamp(now.toLocaleString());
  }, []);

  // automatically hide error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  async function handleDraft() {
    if (!content.trim()) {
      setError("Content cannot be empty.");
      return;
    }

    // if there are files, use FormData
    let body: FormData | string = JSON.stringify({
      authorId: user.id,
      recipientId: recipient.id,
      content,
      subject: subject || undefined,
      songUrl: songUrl || undefined, // optional textual url
      createdAt: timestamp,
    });

    if (photo || songFile) {
      const fd = new FormData();
      fd.append("authorId", user.id);
      fd.append("recipientId", recipient.id);
      fd.append("content", content);
      if (subject) fd.append("subject", subject);
      if (songUrl) fd.append("songUrl", songUrl); // fallback URL
      if (photo) fd.append("photo", photo);
      if (songFile) fd.append("song", songFile);
      fd.append("createdAt", timestamp);
      body = fd;
    }

    try {
      const draft = await apiFetch<Letter>(`/letter`, {
        method: "POST",
        body: body as any,
      });
      onDraft(draft);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Write Your Letter</h2>

      {/* Timestamp */}
      <div className="text-sm text-gray-500">
        Current Timestamp: {timestamp}
      </div>

      {/* Song URL Input */}
      <div>
        <label className="block font-medium">Song URL (or upload an audio file)</label>
        <input
          type="url"
          className="w-full border px-2 py-1 mb-2"
          value={songUrl}
          onChange={(e) => setSongUrl(e.target.value)}
          placeholder="Add a song URL (optional)"
        />
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setSongFile(e.target.files?.[0] || null)}
        />
        {songFile && <div className="text-sm">{songFile.name}</div>}
      </div>

      {/* Subject Input */}
      <div>
        <label className="block font-medium">Subject</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Add a subject (optional)"
        />
      </div>

      {/* Content Input */}
      <div>
        <label className="block font-medium">Content</label>
        <textarea
          className="w-full border px-2 py-1"
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {/* Photo */}
      <div>
        <label className="block font-medium">Photo</label>
        <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        {photo && <div className="text-sm">{photo.name}</div>}
      </div>

      {/* Preview */}
      {photo && (
        <div className="mt-4">
          <p className="text-sm text-gray-500">Image Preview:</p>
          <img src={URL.createObjectURL(photo)} alt="Preview" className="max-w-full h-auto border rounded" />
        </div>
      )}

      {/* Error Popup */}
      {error && (
        <div
          className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg font-mono text-sm transition-all duration-500 ease-in-out opacity-100"
          style={{
            transform: error ? "translateY(0)" : "translateY(-20px)",
            opacity: error ? 1 : 0,
          }}
        >
          <div className="flex items-center justify-between">
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Save Draft Button */}
      <button
        onClick={handleDraft}
        disabled={!content.trim()}
        className={`px-4 py-2 border ${
          content.trim()
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        Save Draft
      </button>
    </div>
  );
}