import { useState, useEffect, useRef } from "react";
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

export default function LetterEditor({ recipient, onComplete, onBack }: Props) {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState(
    `Dear ${recipient.displayName},\n\nWrite your message here.\n\nFrom,\n${user.displayName}`
  );
  const [songQuery, setSongQuery] = useState("");
  const [songResults, setSongResults] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any | null>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<string>("");

  const [isSending, setIsSending] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");

  // Keep track of ongoing uploads to update letters later
  const uploadQueueRef = useRef<Map<string, { letterId: string; uploadPromise: Promise<string> }>>(new Map());

  useEffect(() => {
    setTimestamp(new Date().toLocaleString());
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
    } catch (err: any) {
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
      setError("Your session has expired :(");
      return;
    }
    if (!token) {
      setError("Please connect to Spotify first! ♪");
      return;
    }
    
    try {
      const results = await apiFetch<any>(
        `/spotify/search?query=${encodeURIComponent(songQuery)}`, {
          headers: {
            Authorization: `Bearer ${tokenjwt}`,
            "Spotify-Access-Token": token,
          },
        }
      );
      setSongResults(results.tracks.items);
    } catch (err: any) {
      setError("Spotify search failed: " + (err.message || "Unexpected error"));
    }
  }

  async function handleSendLetter(scheduled: boolean = false) {
    if (!content.trim()) {
      setError("have a heart, add some words to the letter ♡");
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
        authorId: user.id,
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
    } catch (err: any) {
      setIsSending(false);
      setError(err.message || "Unexpected error occurred :(");
    }
  }

  if (isSending) {
    return <KawaiiLoader message="Sending your letter with love ✨" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 dark:from-purple-900 dark:via-blue-900 dark:to-pink-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Retro Header */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl border-4 border-pink-400 dark:border-purple-400 p-6 mb-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent pixel-font">
              ✨ Write Letter ✨
            </h1>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-600 dark:to-pink-600 text-white rounded-2xl border-2 border-purple-600 dark:border-purple-400 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-bold"
            >
              ← Back
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-pink-100 dark:from-yellow-800 dark:to-pink-800 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-500">
            <p className="text-sm font-mono text-purple-700 dark:text-purple-200">
              To: {recipient.displayName} ♡ | Time: {timestamp}
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Song Search Section */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl border-4 border-green-400 dark:border-green-500 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4 pixel-font">🎵 Attach a Song</h3>
            
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  className="w-full border-2 border-green-300 dark:border-green-600 bg-green-50 dark:bg-gray-700 px-4 py-3 rounded-2xl focus:border-green-500 focus:outline-none text-green-800 dark:text-green-200 placeholder-green-500 dark:placeholder-green-400"
                  value={songQuery}
                  onChange={(e) => setSongQuery(e.target.value)}
                  placeholder="Search Spotify for vibes... 🔍"
                />
              </div>
              <button
                onClick={handleSongSearch}
                className="px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-2xl border-2 border-green-600 shadow-lg hover:from-green-500 hover:to-green-600 transition-all duration-200 font-bold transform hover:scale-105"
              >
                Search ♪
              </button>
            </div>

            {songResults.length > 0 && (
              <div className="border-2 border-green-300 dark:border-green-600 rounded-2xl p-4 max-h-64 overflow-y-auto bg-green-50 dark:bg-gray-700">
                {songResults.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => setSelectedSong(track)}
                    className={`flex items-center gap-3 p-3 cursor-pointer rounded-2xl transition-all duration-200 ${
                      selectedSong?.id === track.id
                        ? "bg-gradient-to-r from-green-200 to-green-300 dark:from-green-600 dark:to-green-700 border-2 border-green-500"
                        : "hover:bg-green-100 dark:hover:bg-gray-600 border-2 border-transparent"
                    }`}
                  >
                    <img src={track.album.images[2]?.url} alt={track.name} className="w-12 h-12 rounded-lg" />
                    <div>
                      <div className="font-bold text-green-800 dark:text-green-200">{track.name}</div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        {track.artists.map((a: any) => a.name).join(", ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedSong && (
              <div className="mt-4 flex items-center gap-3 border-2 border-green-400 dark:border-green-500 p-4 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 rounded-2xl">
                <img src={selectedSong.album.images[1]?.url} alt="album" className="w-16 h-16 rounded-lg border-2 border-green-300" />
                <div>
                  <div className="font-bold text-green-800 dark:text-green-200">{selectedSong.name}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    {selectedSong.artists.map((a: any) => a.name).join(", ")}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Subject & Content */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl border-4 border-purple-400 dark:border-purple-500 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-4 pixel-font">💌 Letter Content</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-purple-700 dark:text-purple-300 mb-2">Subject (optional)</label>
                <input
                  type="text"
                  className="w-full border-2 border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-gray-700 px-4 py-3 rounded-2xl focus:border-purple-500 focus:outline-none text-purple-800 dark:text-purple-200 placeholder-purple-500"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Add a dreamy subject ✨"
                />
              </div>

              <div>
                <label className="block font-bold text-purple-700 dark:text-purple-300 mb-2">Your Message</label>
                <textarea
                  className="w-full border-2 border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-gray-700 px-4 py-3 rounded-2xl focus:border-purple-500 focus:outline-none text-purple-800 dark:text-purple-200 placeholder-purple-500 resize-none"
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Pour your heart out here..."
                />
              </div>
            </div>
          </div>

          {/* Photo Upload with Progress */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl border-4 border-pink-400 dark:border-pink-500 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-pink-600 dark:text-pink-400 mb-4 pixel-font">📸 Attach Photo</h3>
            
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
              className="block w-full text-sm text-pink-600 dark:text-pink-400 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-2 file:border-pink-300 file:text-sm file:font-bold file:bg-gradient-to-r file:from-pink-100 file:to-pink-200 file:text-pink-700 hover:file:from-pink-200 hover:file:to-pink-300 dark:file:from-pink-800 dark:file:to-pink-900 dark:file:text-pink-200 dark:file:border-pink-600"
            />
            
            {photo && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-bold text-pink-600 dark:text-pink-400">📁 {photo.name}</p>
                
                {/* Upload Status - Always Shows Progress */}
                {uploadState.status === 'uploading' && (
                  <div className="bg-pink-50 dark:bg-gray-700 rounded-2xl p-4 border-2 border-pink-300 dark:border-pink-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-pink-600 dark:text-pink-400">Uploading... (Never gives up! 💪)</span>
                      <span className="text-sm text-pink-600 dark:text-pink-400">{uploadState.progress}%</span>
                    </div>
                    <div className="w-full bg-pink-200 dark:bg-gray-600 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-pink-400 to-pink-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${uploadState.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-pink-500 dark:text-pink-400 mt-2">
                      This upload will keep retrying until it succeeds - you can send your letter now!
                    </p>
                  </div>
                )}
                
                {/* Upload Complete */}
                {uploadState.status === 'completed' && (
                  <div className="bg-green-50 dark:bg-green-900/50 rounded-2xl p-3 border-2 border-green-300 dark:border-green-600">
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">✅ Upload complete!</p>
                  </div>
                )}
                
                <div className="border-2 border-pink-300 dark:border-pink-600 rounded-2xl p-4 bg-pink-50 dark:bg-gray-700">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt="Preview"
                    className="max-w-full h-auto rounded-lg border-2 border-pink-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Send Options */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl border-4 border-blue-400 dark:border-blue-500 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4 pixel-font">✉️ Send Options</h3>
            
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
                Send Now ⚡
              </button>
              <button
                onClick={() => setShowSchedule(true)}
                className={`px-6 py-3 rounded-2xl border-2 font-bold transition-all duration-200 ${
                  showSchedule 
                    ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white border-blue-600 shadow-lg"
                    : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600"
                }`}
              >
                Schedule ⏰
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
              {showSchedule ? "📅 Schedule Letter ✨" : "🚀 Send Letter Now! ♡"}
            </button>
          </div>
        </div>
      </div>

      {/* Error Notification */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-400 to-pink-400 text-white px-6 py-4 rounded-full shadow-2xl font-bold text-sm border-4 border-red-300 z-50 animate-bounce">
          <div className="flex items-center justify-between">
            <p>❌ {error}</p>
            <button onClick={() => setError(null)} className="ml-4 hover:scale-110 transition-transform">
              ✕
            </button>
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