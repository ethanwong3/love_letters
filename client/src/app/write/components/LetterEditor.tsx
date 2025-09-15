import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Letter } from "@/types/letter";
import type { User } from "@/types/user";
import { set } from "react-hook-form";
import { KawaiiLoader } from "./Loading";

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
  const [songQuery, setSongQuery] = useState("");
  const [songResults, setSongResults] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any | null>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string>("");

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setTimestamp(new Date().toLocaleString());
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  async function uploadPhotoToCloudinary(file: File): Promise<string> {
    // Debug: Check environment variables
    const cloudinaryName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    console.log("🔍 Debug Cloudinary Config:");
    console.log("- NEXT_PUBLIC_CLOUDINARY_NAME:", cloudinaryName);
    console.log("- NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET:", uploadPreset);
    console.log("- File size:", file.size, "bytes");
    console.log("- File type:", file.type);
    
    if (!cloudinaryName) {
      throw new Error("Missing NEXT_PUBLIC_CLOUDINARY_NAME environment variable");
    }
    if (!uploadPreset) {
      throw new Error("Missing NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET environment variable");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryName}/image/upload`;
    console.log("📡 Upload URL:", uploadUrl);

    try {
      const response = await fetch(uploadUrl, {
        method: "POST", 
        body: formData 
      });

      console.log("📊 Response status:", response.status);
      console.log("📊 Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Cloudinary error response:", errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error("❌ Parsed error:", errorJson);
          throw new Error(`Cloudinary upload failed: ${errorJson.error?.message || errorText}`);
        } catch (parseError) {
          throw new Error(`Cloudinary upload failed with status ${response.status}: ${errorText}`);
        }
      }

      const data = await response.json();
      console.log("✅ Upload successful:", data.secure_url);
      return data.secure_url;

    } catch (error) {
      console.error("💥 Upload error:", error);
      throw error;
    }
  }

  async function handleSongSearch() {
    if (!songQuery.trim()) return;
    const tokenjwt = localStorage.getItem("token");
    const token = localStorage.getItem("spotifyAccessToken");
    if (!tokenjwt) {
      setError("Your session has expired");
      return;
    }
    if (!token) {
      setError("Please connect to Spotify first!");
      return;
    }
    try {
      const results = await apiFetch<any>(
        `/spotify/search?query=${encodeURIComponent(songQuery)}`, {
          headers: {
            Authorization: `Bearer ${tokenjwt}`, // Send the JWT token for backend authentication
            "Spotify-Access-Token": token, // Send the Spotify token as a separate header
          },
        }
      );
      setSongResults(results.tracks.items);
    } catch (err: any) {
      console.error("Error during song search:", err);
      setError("Spotify search failed: " + (err.message || "Unexpected error"));
    }
  }

  async function handleDraft() {
    if (!content.trim()) {
      setError("have a heart, add some words to the letter");
      return;
    }

    try {
      let uploadedPhotoUrl = photoUrl;
      if (photo && !photoUrl) {
        setIsUploading(true); // Show loading screen
        uploadedPhotoUrl = await uploadPhotoToCloudinary(photo);
        setPhotoUrl(uploadedPhotoUrl);
        setIsUploading(false); // Hide loading screen
      }

      const body = JSON.stringify({
        authorId: user.id,
        recipientId: recipient.id,
        content,
        subject: subject || undefined,
        songUrl: selectedSong ? selectedSong.id : undefined,
        photoUrl: uploadedPhotoUrl || undefined,
        createdAt: timestamp,
      });

      const draft = await apiFetch<Letter>(`/letter`, {
        method: "POST",
        body,
      });
      onDraft(draft);
    } catch (err: any) {
      setIsUploading(false); // Ensure loading screen is hidden on error
      setError(err.message || "Unexpected error");
    }
  }

  if (isUploading) {
    return <KawaiiLoader message="Uploading your kawaii photo" />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Write Your Letter</h2>

      <div className="text-sm text-gray-500">
        Current Timestamp: {timestamp}
      </div>

      {/* Song Search */}
      <div>
        <label className="block font-medium">Attach a Song</label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            className="flex-1 border px-2 py-1"
            value={songQuery}
            onChange={(e) => setSongQuery(e.target.value)}
            placeholder="Search Spotify..."
          />
          <button
            type="button"
            onClick={handleSongSearch}
            className="px-3 py-1 bg-green-500 text-white border shadow hover:bg-green-600"
          >
            Search
          </button>
        </div>
        {songResults.length > 0 && (
          <div className="border rounded p-2 max-h-48 overflow-y-auto space-y-2">
            {songResults.map((track) => (
              <div
                key={track.id}
                onClick={() => setSelectedSong(track)}
                className={`flex items-center space-x-2 p-2 cursor-pointer ${
                  selectedSong?.id === track.id
                    ? "bg-green-200"
                    : "hover:bg-gray-100"
                }`}
              >
                <img
                  src={track.album.images[2]?.url}
                  alt={track.name}
                  className="w-10 h-10"
                />
                <div>
                  <div className="font-bold">{track.name}</div>
                  <div className="text-sm text-gray-600">
                    {track.artists.map((a: any) => a.name).join(", ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {selectedSong && (
          <div className="mt-2 flex items-center space-x-2 border p-2 bg-gray-50">
            <img
              src={selectedSong.album.images[1]?.url}
              alt="album cover"
              className="w-12 h-12"
            />
            <div>
              <div className="font-bold">{selectedSong.name}</div>
              <div className="text-sm text-gray-600">
                {selectedSong.artists.map((a: any) => a.name).join(", ")}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subject */}
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

      {/* Content */}
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
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0] || null)}
        />
        {photo && <div className="text-sm">{photo.name}</div>}
      </div>

      {photo && (
        <div className="mt-4">
          <p className="text-sm text-gray-500">Image Preview:</p>
          <img
            src={URL.createObjectURL(photo)}
            alt="Preview"
            className="max-w-full h-auto border"
          />
        </div>
      )}

      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 shadow-lg font-mono text-sm">
          <div className="flex items-center justify-between">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="ml-4">
              ✕
            </button>
          </div>
        </div>
      )}

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
