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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
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

  function validateSpotifyUrl(url: string): boolean {
    const regex = /^https:\/\/open\.spotify\.com\/track\/.+$/;
    return regex.test(url);
  }

  async function uploadPhotoToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");

    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("smth wrong w the photo bro");
    }

    const data = await response.json();
    return data.secure_url; 
  }

  async function handleDraft() {
    if (!content.trim()) {
      setError("have a heart, add some words to the letter");
      return;
    }

    // ensure songurl is spotify link
    if (songUrl && !validateSpotifyUrl(songUrl)) {
      setError("use spotify boomer");
      return;
    }

    try {
      let uploadedPhotoUrl = photoUrl;
      if (photo && !photoUrl) {
        uploadedPhotoUrl = await uploadPhotoToCloudinary(photo);
        setPhotoUrl(uploadedPhotoUrl);
      }
      const body = JSON.stringify({
        authorId: user.id,
        recipientId: recipient.id,
        content,
        subject: subject || undefined,
        songUrl: songUrl || undefined,
        photoUrl: uploadedPhotoUrl || undefined,
        createdAt: timestamp,
      });
      const draft = await apiFetch<Letter>(`/letter`, {
        method: "POST",
        body,
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