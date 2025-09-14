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
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [timestamp, setTimestamp] = useState<string>("");
  const imageUrl = photo ? URL.createObjectURL(photo) : null;

  // Set the timestamp when the component mounts
  useEffect(() => {
    const now = new Date();
    setTimestamp(now.toLocaleString());
  }, []);

  // Automatically hide error after 3 seconds
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

    let body: any = {
      authorId: user.id,
      recipientId: recipient.id,
      content,
      status: "DRAFT",
    };

    // Add optional fields only if they are not null or empty
    if (subject) body.subject = subject;
    if (songUrl) body.songUrl = songUrl;
    if (photo) {
      const formData = new FormData();
      formData.append("photo", photo);
      Object.keys(body).forEach((key) => formData.append(key, body[key]));
      body = formData;
    }

    try {
      const draft = await apiFetch<Letter>(`/letter`, {
        method: "POST",
        body: photo ? body : JSON.stringify(body),
      });
      setCreatedAt(new Date(draft.createdAt));
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
        <label className="block font-medium">Song URL</label>
        <input
          type="url"
          className="w-full border px-2 py-1"
          value={songUrl}
          onChange={(e) => setSongUrl(e.target.value)}
          placeholder="Add a song URL (optional)"
        />
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

{/* Photo Upload */}
<div>
  <label className="block font-medium">Photo</label>
  <div className="flex items-center space-x-2">
    {/* Hidden File Input */}
    <input
      type="file"
      accept="image/*"
      id="photo-upload"
      className="hidden"
      onChange={(e) => setPhoto(e.target.files?.[0] || null)}
    />
    {/* Custom Button */}
    <button
      type="button"
      onClick={() => document.getElementById("photo-upload")?.click()}
      className="px-4 py-2 border bg-blue-500 text-white hover:bg-blue-600 rounded"
    >
      Choose File
    </button>
    {/* Display Selected File Name */}
    {photo && (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700">{photo.name}</span>
        <button
          onClick={() => setPhoto(null)}
          className="text-sm text-red-500 hover:underline"
        >
          Remove Photo
        </button>
      </div>
    )}
  </div>
</div>

      {/* Image Preview */}
      {imageUrl && (
        <div className="mt-4">
          <p className="text-sm text-gray-500">Image Preview:</p>
          <img
            src={imageUrl}
            alt="Preview"
            className="max-w-full h-auto border rounded"
          />
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