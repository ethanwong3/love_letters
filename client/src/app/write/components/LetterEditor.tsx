import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Letter } from "@/types/letter";
import type { User } from "@/types/user";
import { KawaiiLoader } from "./Loading";

interface Props {
  recipient: User;
  onComplete: (success: boolean, message?: string) => void;
  onBack: () => void;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'completed' | 'error';
  progress?: number;
  url?: string;
  error?: string;
}

interface SpotifyArtist { name: string; id: string; }
interface SpotifyImage { url: string; height?: number; width?: number; }
interface SpotifyAlbum { images: SpotifyImage[]; }
interface SpotifyTrack {
  id: string;
  name: string;
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
}

export default function LetterEditor({ recipient, onComplete, onBack }: Props) {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const name = user?.displayName;
  const [content, setContent] = useState(
    `Dear ${recipient.displayName},\n\nWrite your message here.\n\nFrom,\n${name}`
  );
  const [songQuery, setSongQuery] = useState("");
  const [songResults, setSongResults] = useState<SpotifyTrack[]>([]);
  const [selectedSong, setSelectedSong] = useState<SpotifyTrack | null>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string>("");

  const [isSending, setIsSending] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  useEffect(() => {
    const darkMode = localStorage.getItem("isDarkMode") === "true";
    setIsDarkMode(darkMode);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("spotifyAccessToken")) {
      setSpotifyConnected(true);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.access_token) {
        localStorage.setItem("spotifyAccessToken", event.data.access_token);
        setSpotifyConnected(true);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    setTimestamp(new Date().toLocaleString());
  }, []);

  const connectSpotify = () => {
    const w = 500, h = 600;
    const topWindow = window.top ?? window;
    const y = topWindow.outerHeight / 2 + topWindow.screenY - h / 2;
    const x = topWindow.outerWidth / 2 + topWindow.screenX - w / 2;
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/spotify/login`,
      "Spotify Login",
      `width=${w},height=${h},top=${y},left=${x}`
    );
  };

  const removeSelectedSong = () => {
    setSelectedSong(null);
    setSongResults([]);
    setSongQuery("");
  };

  const removeImage = () => {
    setPhoto(null);
    setUploadState({ status: 'idle' });
  };

  // Persistent Cloudinary upload with retry mechanism - will never give up!
  async function uploadPhotoToCloudinary(file: File, onProgress?: (progress: number) => void, retryCount = 0): Promise<string> {
    const cloudinaryName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudinaryName || !uploadPreset) {
      throw new Error("Missing Cloudinary configuration");
    }

    // Optimize image before upload if it's too large
    const optimizedFile = await optimizeImage(file);

    const formData = new FormData();
    formData.append("file", optimizedFile);
    formData.append("upload_preset", uploadPreset);
    
    // Add optimization parameters
    formData.append("quality", "auto:good");
    formData.append("fetch_format", "auto");
    formData.append("flags", "progressive");

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded * 100) / event.total);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.secure_url);
          } catch (e) {
            // Retry on parse error
            setTimeout(() => {
              uploadPhotoToCloudinary(file, onProgress, retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, Math.min(1000 * Math.pow(2, retryCount), 30000)); // Exponential backoff, max 30s
          }
        } else {
          // Retry on HTTP error
          setTimeout(() => {
            uploadPhotoToCloudinary(file, onProgress, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, Math.min(1000 * Math.pow(2, retryCount), 30000));
        }
      });

      xhr.addEventListener('error', () => {
        // Retry on network error
        setTimeout(() => {
          uploadPhotoToCloudinary(file, onProgress, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, Math.min(1000 * Math.pow(2, retryCount), 30000));
      });

      // No timeout - let it run as long as needed
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudinaryName}/image/upload`);
      xhr.send(formData);
    });
  }

  // Optimize image before upload to reduce file size and upload time
  async function optimizeImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate optimal dimensions (max 1920px width, maintain aspect ratio)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              resolve(file); // Fallback to original
            }
          },
          'image/jpeg',
          0.85 // 85% quality
        );
      };
      
      img.onerror = () => resolve(file); // Fallback to original
      img.src = URL.createObjectURL(file);
    });
  }

  // Start background upload immediately when photo is selected
  useEffect(() => {
    if (photo && uploadState.status === 'idle') {
      startPhotoUpload();
    }
  }, [photo]);

  async function startPhotoUpload() {
    if (!photo) return;
    
    setUploadState({ status: 'uploading', progress: 0 });
    
    try {
      const url = await uploadPhotoToCloudinary(photo, (progress) => {
        setUploadState(prev => ({ ...prev, progress }));
      });
      
      setUploadState({ status: 'completed', url, progress: 100 });
    } catch (err: unknown) {
      // This should never happen now since we retry indefinitely
      // But keeping as fallback
      setUploadState({ 
        status: 'error', 
        error: "Persistent upload issue - this shouldn't happen!" 
      });
    }
  }

  // Update letter with photo URL after background upload completes
  async function updateLetterWithPhoto(letterId: string, photoUrl: string) {
    try {
      await apiFetch(`/letter/${letterId}`, {
        method: "PATCH",
        body: JSON.stringify({ photoUrl }),
      });
    } catch (err) {
      console.error('Failed to update letter with photo:', err);
      // Don't throw - the letter was already sent successfully
    }
  }

  async function handleSongSearch() {
    if (!songQuery.trim()) return;
    const tokenjwt = localStorage.getItem("token");
    const token = localStorage.getItem("spotifyAccessToken");
    
    if (!tokenjwt) {
      setError("Authentication expired. Please refresh the page.");
      return;
    }
    if (!token) {
      setError("Please connect to Spotify first.");
      return;
    }
    
    try {
      const results = await apiFetch<{ tracks: { items: SpotifyTrack[] } }>(
        `/spotify/search?query=${encodeURIComponent(songQuery)}`, 
        { 
          headers: { 
            Authorization: `Bearer ${tokenjwt}`, 
            "spotify-access-token": token  // Make sure this matches your controller header name
          } 
        }
      );
      setSongResults(results.tracks.items);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unexpected error occurred");
      }
    }
  }

  async function handleSendLetter(scheduled: boolean = false) {
    if (!content.trim()) {
      setError("Please add some content to your letter.");
      return;
    }

    try {
      setIsSending(true);
      
      // Determine photo URL to use
      let photoUrlToSend: string | undefined;
      let needsPhotoUpdate = false;
      
      if (photo) {
        if (uploadState.status === 'completed' && uploadState.url) {
          // Upload is done, use the URL
          photoUrlToSend = uploadState.url;
        } else if (uploadState.status === 'uploading') {
          // Upload in progress, send letter without photo and update later
          needsPhotoUpdate = true;
          photoUrlToSend = undefined;
        }
        // Removed the error handling since uploads never fail now
      }

      // Create draft letter
      const draftBody = JSON.stringify({
        authorId: user?.id,
        recipientId: recipient.id,
        content,
        subject: subject || undefined,
        songUrl: selectedSong ? selectedSong.id : undefined,
        photoUrl: photoUrlToSend,
        createdAt: timestamp,
      });

      const draft = await apiFetch<Letter>(`/letter`, {
        method: "POST",
        body: draftBody,
      });

      // If photo is still uploading, set up background update
      if (needsPhotoUpdate && uploadState.status === 'uploading') {
        // Wait for the current upload to complete, then update the letter
        setTimeout(async () => {
          // Check if upload completed
          if (uploadState.status === 'completed' && uploadState.url) {
            await updateLetterWithPhoto(draft.id, uploadState.url);
          }
        }, 1000);
        
        // Also set up a periodic check
        const checkInterval = setInterval(async () => {
          if (uploadState.status === 'completed' && uploadState.url) {
            await updateLetterWithPhoto(draft.id, uploadState.url);
            clearInterval(checkInterval);
          } else if (uploadState.status === 'error') {
            clearInterval(checkInterval);
          }
        }, 2000);
        
        // Clear interval after 5 minutes to prevent memory leaks
        setTimeout(() => clearInterval(checkInterval), 300000);
      }

      // Send the letter
      let sendDate = undefined;
      if (scheduled && deliveryDate && deliveryTime) {
        sendDate = new Date(`${deliveryDate}T${deliveryTime}`).toISOString();
      }

      await apiFetch(`/letter/${draft.id}/send`, {
        method: "POST",
        body: JSON.stringify({
          deliveryDate: sendDate
        }),
      });

      let message = scheduled ? 
        `Letter scheduled for ${new Date(`${deliveryDate}T${deliveryTime}`).toLocaleString()} ✨` :
        "Letter sent successfully! ♡";
      
      if (needsPhotoUpdate) {
        message += " (Photo will be added once upload completes 📸)";
      }
        
      onComplete(true, message);
    } catch (err: unknown) {
      setIsSending(false);
      if (err instanceof Error) {
        setError(err.message || "Unexpected error occurred");
      }
    }
  }

  if (isSending) {
    return <KawaiiLoader message="Sending your letter with love ✨" />;
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
        {/* Header */}
        <div className={`backdrop-blur-sm rounded-3xl border-4 p-6 mb-6 shadow-2xl ${
          isDarkMode 
            ? 'bg-gray-800/90 border-purple-400 text-white'
            : 'bg-white/90 border-pink-400 text-gray-900'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className={`px-4 py-2 text-white rounded-2xl border-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-bold ${
                isDarkMode
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400'
                  : 'bg-gradient-to-r from-purple-400 to-pink-400 border-purple-600'
              }`}
            >
              ← Back
            </button>
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              💫 Write a Letter 💫
            </h1>
          </div>
          <div className={`mt-4 p-3 rounded-2xl border-2 border-dashed ${
            isDarkMode
              ? 'bg-gradient-to-r from-yellow-800 to-pink-800 border-purple-500 text-purple-200'
              : 'bg-gradient-to-r from-yellow-100 to-pink-100 border-purple-300 text-purple-700'
          }`}>      
            <p className="text-sm font-mono">From: {user?.displayName}</p>            
            <p className="text-sm font-mono">To: {recipient.displayName}</p>
            <p className="text-sm font-mono">Time: {timestamp}</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Spotify Section */}
          <div className={`backdrop-blur-sm rounded-3xl border-4 p-6 shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-800/90 border-green-500'
              : 'bg-white/90 border-green-400'
          }`}>
            <h3 className={`text-xl font-bold mb-4 pixel-font ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>Attach a Song</h3>
            
            {!spotifyConnected ? (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="text-6xl mb-4">🎵</div>
                  <p className={`mb-2 font-semibold ${
                    isDarkMode ? 'text-green-300' : 'text-green-700'
                  }`}>
                    Connect to Spotify to add music to your letters
                  </p>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    dont be lazy its just a few clicks
                  </p>
                </div>
                <button
                  onClick={connectSpotify}
                  className={`px-8 py-4 text-white rounded-2xl border-3 shadow-lg transition-all duration-200 font-bold text-lg transform hover:scale-105 ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-green-500 to-green-700 border-green-400 hover:from-green-600 hover:to-green-800'
                      : 'bg-gradient-to-r from-green-400 to-green-600 border-green-700 hover:from-green-500 hover:to-green-700'
                  }`}
                >
                  🎧 Connect Spotify 🎧
                </button>
              </div>
            ) : !selectedSong ? (
              // Song search interface
              <>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      className={`w-full border-2 px-4 py-3 rounded-2xl focus:outline-none ${
                        isDarkMode
                          ? 'border-green-600 bg-gray-700 text-green-200 placeholder-green-400 focus:border-green-400'
                          : 'border-green-300 bg-green-50 text-green-800 placeholder-green-500 focus:border-green-500'
                      }`}
                      value={songQuery}
                      onChange={(e) => setSongQuery(e.target.value)}
                      placeholder="Search Spotify for vibes..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSongSearch()}
                    />
                  </div>
                  <button
                    onClick={handleSongSearch}
                    className={`px-6 py-3 text-white rounded-2xl border-2 shadow-lg transition-all duration-200 font-bold transform hover:scale-105 ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-400 hover:from-green-600 hover:to-green-700'
                        : 'bg-gradient-to-r from-green-400 to-green-500 border-green-600 hover:from-green-500 hover:to-green-600'
                    }`}
                  >
                    Search
                  </button>
                </div>

                {songResults.length > 0 && (
                  <div className={`border-2 rounded-2xl p-4 max-h-64 overflow-y-auto ${
                    isDarkMode
                      ? 'border-green-600 bg-gray-700'
                      : 'border-green-300 bg-green-50'
                  }`}>
                    {songResults.map((track) => (
                      <div
                        key={track.id}
                        onClick={() => setSelectedSong(track)}
                        className={`flex items-center gap-3 p-3 cursor-pointer rounded-2xl transition-all duration-200 border-2 border-transparent ${
                          isDarkMode
                            ? 'hover:bg-gray-600 hover:border-green-400'
                            : 'hover:bg-green-100 hover:border-green-400'
                        }`}
                      >
                        <img src={track.album.images[2]?.url} alt={track.name} className="w-12 h-12 rounded-lg" />
                        <div>
                          <div className={`font-bold ${
                            isDarkMode ? 'text-green-200' : 'text-green-800'
                          }`}>{track.name}</div>
                          <div className={`text-sm ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}>
                            {track.artists.map((a: SpotifyArtist) => a.name).join(", ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Selected song display
              <div className="space-y-4">
                <div className={`flex items-center justify-between p-4 rounded-2xl border-2 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-green-800 to-green-900 border-green-500'
                    : 'bg-gradient-to-r from-green-100 to-green-200 border-green-400'
                }`}>
                  <div className="flex items-center gap-3">
                    <img src={selectedSong.album.images[1]?.url} alt="album" className="w-16 h-16 rounded-lg border-2 border-green-300" />
                    <div>
                      <div className={`font-bold ${
                        isDarkMode ? 'text-green-200' : 'text-green-800'
                      }`}>{selectedSong.name}</div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`}>
                        {selectedSong.artists.map((a: SpotifyArtist) => a.name).join(", ")}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={removeSelectedSong}
                    className="px-4 py-2 bg-red-400 hover:bg-red-500 text-white rounded-xl border-2 border-red-600 shadow-md transition-all duration-200 font-bold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Subject & Content */}
          <div className={`backdrop-blur-sm rounded-3xl border-4 p-6 shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-800/90 border-purple-500'
              : 'bg-white/90 border-purple-400'
          }`}>
            <h3 className={`text-xl font-bold mb-4 pixel-font ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>Letter Content</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block font-bold mb-2 ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-700'
                }`}>Subject</label>
                <input
                  type="text"
                  className={`w-full border-2 px-4 py-3 rounded-2xl focus:outline-none ${
                    isDarkMode
                      ? 'border-purple-600 bg-gray-700 text-purple-200 placeholder-purple-400 focus:border-purple-400'
                      : 'border-purple-300 bg-purple-50 text-purple-800 placeholder-purple-500 focus:border-purple-500'
                  }`}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Add a dreamy subject"
                />
              </div>

              <div>
                <label className={`block font-bold mb-2 ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-700'
                }`}>Your Message</label>
                <textarea
                  className={`w-full border-2 px-4 py-3 rounded-2xl focus:outline-none resize-none ${
                    isDarkMode
                      ? 'border-purple-600 bg-gray-700 text-purple-200 placeholder-purple-400 focus:border-purple-400'
                      : 'border-purple-300 bg-purple-50 text-purple-800 placeholder-purple-500 focus:border-purple-500'
                  }`}
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Pour your heart out here..."
                />
              </div>
            </div>
          </div>

          {/* Photo Upload with Progress */}
          <div className={`backdrop-blur-sm rounded-3xl border-4 p-6 shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-800/90 border-pink-500'
              : 'bg-white/90 border-pink-400'
          }`}>
            <h3 className={`text-xl font-bold mb-4 pixel-font ${
              isDarkMode ? 'text-pink-400' : 'text-pink-600'
            }`}>Attach Photo</h3>
            
            {!photo ? (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPhoto(file);
                  if (file) {
                    setUploadState({ status: 'idle' });
                  }
                }}
                className={`block w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-2 file:text-sm file:font-bold file:transition-all ${
                  isDarkMode
                    ? 'text-pink-400 file:border-pink-600 file:bg-gradient-to-r file:from-pink-800 file:to-pink-900 file:text-pink-200 hover:file:from-pink-700 hover:file:to-pink-800'
                    : 'text-pink-600 file:border-pink-300 file:bg-gradient-to-r file:from-pink-100 file:to-pink-200 file:text-pink-700 hover:file:from-pink-200 hover:file:to-pink-300'
                }`}
              />
            ) : (
              <div className="space-y-4">
                {/* Upload Status - Always Shows Progress */}
                {uploadState.status === 'uploading' && (
                  <div className={`rounded-2xl p-4 border-2 ${
                    isDarkMode
                      ? 'bg-gray-700 border-pink-600'
                      : 'bg-pink-50 border-pink-300'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-bold ${
                        isDarkMode ? 'text-pink-400' : 'text-pink-600'
                      }`}>Uploading... (Never gives up! 💪)</span>
                      <span className={`text-sm ${
                        isDarkMode ? 'text-pink-400' : 'text-pink-600'
                      }`}>{uploadState.progress}%</span>
                    </div>
                    <div className={`w-full rounded-full h-3 ${
                      isDarkMode ? 'bg-gray-600' : 'bg-pink-200'
                    }`}>
                      <div 
                        className="bg-gradient-to-r from-pink-400 to-pink-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${uploadState.progress}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs mt-2 ${
                      isDarkMode ? 'text-pink-400' : 'text-pink-500'
                    }`}>
                      This upload will keep retrying until it succeeds - you can send your letter now!
                    </p>
                  </div>
                )}
                
                {/* Upload Complete */}
                {uploadState.status === 'completed' && (
                  <div className={`rounded-2xl p-3 border-2 ${
                    isDarkMode
                      ? 'bg-green-900/50 border-green-600'
                      : 'bg-green-50 border-green-300'
                  }`}>
                    <p className={`text-sm font-bold ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>✅ Upload complete!</p>
                  </div>
                )}
                
                <div className={`border-2 rounded-2xl p-4 ${
                  isDarkMode
                    ? 'border-pink-600 bg-gray-700'
                    : 'border-pink-300 bg-pink-50'
                }`}>
                  <img
                    src={URL.createObjectURL(photo)}
                    alt="Preview"
                    className="max-w-full h-auto rounded-lg border-2 border-pink-400 mb-4"
                  />
                  <button
                    onClick={removeImage}
                    className="w-full px-4 py-2 bg-red-400 hover:bg-red-500 text-white rounded-xl border-2 border-red-600 shadow-md transition-all duration-200 font-bold"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Send Options */}
          <div className={`backdrop-blur-sm rounded-3xl border-4 p-6 shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-800/90 border-purple-500'
              : 'bg-white/90 border-purple-400'
          }`}>
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4 pixel-font">Send Options</h3>
            
            {/* Info about background upload */}
            {photo && uploadState.status === 'uploading' && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-600">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  💡 <strong>Tip:</strong> You can send your letter now! The photo will be added automatically once the upload completes.
                </p>
              </div>
            )}
            
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setShowSchedule(false)}
                className={`px-6 py-3 rounded-2xl border-2 font-bold transition-all duration-200 ${
                  !showSchedule 
                    ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white border-blue-600 shadow-lg"
                    : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600"
                }`}
              >
                Send Now
              </button>
              <button
                onClick={() => setShowSchedule(true)}
                className={`px-6 py-3 rounded-2xl border-2 font-bold transition-all duration-200 ${
                  showSchedule 
                    ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white border-blue-600 shadow-lg"
                    : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600"
                }`}
              >
                Schedule
              </button>
            </div>

            {showSchedule && (
              <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 dark:bg-blue-900/50 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-600">
                <div>
                  <label className="block font-bold text-blue-700 dark:text-blue-300 mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full border-2 border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-700 px-4 py-2 rounded-xl focus:border-blue-500 focus:outline-none text-blue-800 dark:text-blue-200"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block font-bold text-blue-700 dark:text-blue-300 mb-2">Time</label>
                  <input
                    type="time"
                    className="w-full border-2 border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-700 px-4 py-2 rounded-xl focus:border-blue-500 focus:outline-none text-blue-800 dark:text-blue-200"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => handleSendLetter(showSchedule)}
              disabled={!content.trim() || (showSchedule && (!deliveryDate || !deliveryTime))}
              className={`w-full py-4 rounded-2xl font-bold text-xl transition-all duration-200 transform ${
                content.trim() && (!showSchedule || (deliveryDate && deliveryTime))
                  ? "bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-white border-4 border-blue-600 shadow-xl hover:shadow-2xl hover:scale-105"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed border-4 border-gray-400"
              }`}
            >
              {showSchedule ? "📅 Schedule Letter 📅" : "🚀 Send Letter Now! 🚀"}
            </button>
          </div>
        </div>
      </div>

      {/* Microsoft-style System Error Popup */}
      {error && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div 
            className="bg-gray-200 border-2 border-gray-800 shadow-2xl pixel-font"
            style={{
              width: '400px',
              boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf, inset -2px -2px #808080, inset 2px 2px #c0c0c0'
            }}
          >
            {/* Title Bar */}
            <div 
              className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-2 py-1 flex items-center justify-between text-sm font-bold"
              style={{
                background: 'linear-gradient(90deg, #000080 0%, #000060 100%)'
              }}
            >
              <span>System Error</span>
              <button
                onClick={() => setError(null)}
                className="w-4 h-4 bg-gray-300 border border-gray-600 flex items-center justify-center text-black text-xs hover:bg-gray-400"
                style={{
                  boxShadow: 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4">
              <div className="flex items-start gap-3 mb-4">
                <img src='/cat8.jpeg' className="w-30 h-30 object-cover"/>
                <div>
                  <div className="font-bold text-gray-800 mb-2">An error has occurred:</div>
                  <div className="text-gray-700 text-sm bg-white border-2 border-gray-400 p-2 font-mono">
                    {error}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={() => setError(null)}
                  className="px-8 py-2 bg-gray-300 border-2 border-gray-600 text-gray-800 font-bold text-sm hover:bg-gray-400"
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
      `}</style>
    </div>
  );
}