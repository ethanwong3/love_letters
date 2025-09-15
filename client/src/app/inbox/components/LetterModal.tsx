"use client";
import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

type Props = {
  letter: any;
  onClose: () => void;
};

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

export default function LetterModal({ letter, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trackInfo, setTrackInfo] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [playerReady, setPlayerReady] = useState(false);
  const [hasPremium, setHasPremium] = useState<boolean | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 3;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume; // Set volume programmatically
    }
  }, [volume]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  // Check if SDK is already loaded
  useEffect(() => {
    if (window.Spotify && window.Spotify.Player) {
      setSdkLoaded(true);
      checkPremiumAndInitialize();
    } else {
      loadSpotifySDK();
    }

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, []);

  const loadSpotifySDK = () => {
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
    if (existingScript) {
      if (window.Spotify && window.Spotify.Player) {
        setSdkLoaded(true);
        checkPremiumAndInitialize();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Spotify SDK script loaded');
    };
    
    script.onerror = () => {
      setError('Failed to load Spotify Web Playback SDK');
    };
    
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('Spotify Web Playback SDK is ready');
      setSdkLoaded(true);
      checkPremiumAndInitialize();
    };
  };

  const checkPremiumAndInitialize = async () => {
    const spotifyToken = localStorage.getItem("spotifyAccessToken");
    
    if (!spotifyToken) {
      setError("Spotify access token not found. Please reconnect to Spotify.");
      return;
    }

    try {
      // Check if user has premium
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${spotifyToken}` }
      });

      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }

      const userProfile = await response.json();
      
      if (userProfile.product !== 'premium') {
        setHasPremium(false);
        console.log('User does not have Spotify Premium, using preview mode');
      } else {
        setHasPremium(true);
        console.log('User has Spotify Premium, initializing player');
        await initializePlayer();
      }
    } catch (err) {
      console.error("Error checking Spotify premium status:", err);
      setHasPremium(false);
      setError("Failed to verify Spotify premium status. Using preview mode.");
    }
  };

  const initializePlayer = async () => {
    if (!window.Spotify || !window.Spotify.Player) {
      setError("Spotify Web Playback SDK not available");
      return;
    }

    const spotifyToken = localStorage.getItem("spotifyAccessToken");
    
    if (!spotifyToken) {
      setError("Spotify access token not found");
      return;
    }

    try {
      const spotifyPlayer = new window.Spotify.Player({
        name: `Love Letter Player ${Date.now()}`, // Unique name to avoid conflicts
        getOAuthToken: (cb: (token: string) => void) => {
          cb(spotifyToken);
        },
        volume: volume
      });

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }: any) => {
        console.error('Initialization error:', message);
        setError(`Failed to initialize: ${message}`);
        setConnectionAttempts(prev => prev + 1);
      });

      spotifyPlayer.addListener('authentication_error', ({ message }: any) => {
        console.error('Authentication error:', message);
        setError('Authentication failed. Please reconnect to Spotify.');
      });

      spotifyPlayer.addListener('account_error', ({ message }: any) => {
        console.error('Account error:', message);
        setError(`Account error: ${message}`);
      });

      spotifyPlayer.addListener('playback_error', ({ message }: any) => {
        console.error('Playback error:', message);
        setError(`Playback failed: ${message}`);
      });

      // Playback status updates
      spotifyPlayer.addListener('player_state_changed', (state: any) => {
        if (!state) {
          console.log('Player state is null');
          return;
        }

        console.log('Player state changed:', state);
        setIsPlaying(!state.paused);
        setCurrentTime(state.position / 1000);
        setDuration(state.duration / 1000);
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }: any) => {
        console.log('Player ready with Device ID:', device_id);
        setDeviceId(device_id);
        setPlayerReady(true);
        setError(null); // Clear any previous errors
      });

      // Not ready
      spotifyPlayer.addListener('not_ready', ({ device_id }: any) => {
        console.log('Device ID has gone offline:', device_id);
        setPlayerReady(false);
      });

      // Connect to the player with timeout
      const connectWithTimeout = () => {
        return Promise.race([
          spotifyPlayer.connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 10000)
          )
        ]);
      };

      const success = await connectWithTimeout();
      
      if (success) {
        console.log('Successfully connected to Spotify!');
        setPlayer(spotifyPlayer);
      } else {
        throw new Error('Failed to connect to Spotify');
      }

    } catch (error: any) {
      console.error('Error initializing player:', error);
      setConnectionAttempts(prev => prev + 1);
      
      if (connectionAttempts < maxConnectionAttempts) {
        setError(`Connection attempt ${connectionAttempts + 1}/${maxConnectionAttempts} failed. Retrying...`);
        // Retry after delay
        setTimeout(() => {
          initializePlayer();
        }, 2000);
      } else {
        setError('Failed to connect to Spotify after multiple attempts. Using preview mode.');
        setHasPremium(false);
      }
    }
  };

  // Fetch track info
  useEffect(() => {
    const fetchTrackInfo = async () => {
      if (letter.songUrl) {
        setLoading(true);
        setError(null);
        try {
          const spotifyToken = localStorage.getItem("spotifyAccessToken");
          
          if (!spotifyToken) {
            throw new Error("Spotify access token not found. Please reconnect to Spotify.");
          }

          const data = await apiFetch(`/spotify/song?id=${letter.songUrl}`, {
            headers: {
              "Spotify-Access-Token": spotifyToken,
            },
          });
          setTrackInfo(data);
        } catch (err: any) {
          console.error("Failed to fetch track info:", err);
          setError(err.message || "Failed to load song information");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTrackInfo();
  }, [letter.songUrl]);

  // Audio event listeners for preview mode
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || hasPremium) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [trackInfo, hasPremium]);

  const playSpotifyTrack = async () => {
    if (!player || !deviceId || !trackInfo || !hasPremium) return;

    const spotifyToken = localStorage.getItem("spotifyAccessToken");
    
    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          uris: [`spotify:track:${trackInfo.id}`]
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${spotifyToken}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to play track');
      }

    } catch (error: any) {
      console.error('Error playing track:', error);
      setError('Failed to play track. Make sure this device is selected in your Spotify app.');
    }
  };

  const togglePlay = async () => {
    if (hasPremium && playerReady) {
      // Premium mode with Web Playback SDK
      if (!isPlaying) {
        await playSpotifyTrack();
      } else {
        await player.pause();
      }
    } else if (!hasPremium && audioRef.current) {
      // Preview mode with HTML audio
      try {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          await audioRef.current.play();
        }
      } catch (error) {
        console.error('Error playing preview:', error);
        setError('Failed to play audio preview');
      }
    }
  };

  const skipForward = async () => {
    if (hasPremium && player && playerReady) {
      const state = await player.getCurrentState();
      if (state) {
        await player.seek(Math.min(state.position + 10000, state.duration));
      }
    } else if (!hasPremium && audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    }
  };

  const skipBackward = async () => {
    if (hasPremium && player && playerReady) {
      const state = await player.getCurrentState();
      if (state) {
        await player.seek(Math.max(state.position - 10000, 0));
      }
    } else if (!hasPremium && audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);
    if (hasPremium && player && playerReady) {
      await player.setVolume(newVolume);
    } else if (!hasPremium && audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    
    if (hasPremium && player && playerReady) {
      await player.seek(newTime * 1000);
    } else if (!hasPremium && audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getPlayerStatus = () => {
    if (hasPremium === null) return "Checking Spotify premium status...";
    if (!hasPremium) return "Playing 30-second preview (Spotify Premium required for full songs)";
    if (!sdkLoaded) return "Loading Spotify Web Playback SDK...";
    if (!playerReady) return "Connecting to Spotify player...";
    return "Ready to play full songs!";
  };

  const getPlayerStatusColor = () => {
    if (hasPremium === null || !sdkLoaded || (hasPremium && !playerReady)) return "bg-blue-100 border-blue-400 text-blue-800";
    if (!hasPremium) return "bg-yellow-100 border-yellow-400 text-yellow-800";
    return "bg-green-100 border-green-400 text-green-800";
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/90 to-pink-900/90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-gradient-to-br from-pink-100 to-purple-100 border-4 border-black p-6 max-w-2xl w-full mx-4 shadow-2xl relative overflow-hidden"
        style={{
          borderRadius: "20px",
          boxShadow: "0 0 30px rgba(255, 20, 147, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.3)",
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-4 w-8 h-8 bg-yellow-300 rounded-full opacity-70 animate-pulse"></div>
          <div className="absolute top-8 right-8 w-6 h-6 bg-cyan-300 rotate-45 opacity-60 animate-bounce"></div>
          <div className="absolute bottom-4 left-8 w-4 h-4 bg-pink-400 rounded-full opacity-80"></div>
          <div className="absolute bottom-8 right-4 w-10 h-10 border-4 border-green-400 rounded-full opacity-50"></div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-red-500 hover:bg-red-600 text-white font-bold text-xl border-2 border-black shadow-lg transition-all hover:scale-110"
          style={{ borderRadius: "50%" }}
        >
          ×
        </button>

        {/* Retro Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 drop-shadow-lg">
            ✉️ {letter.subject || "No subject"} ✨
          </h2>
          <div className="text-sm space-y-1">
            <p className="text-purple-700 font-semibold">
              📅 Created: {new Date(letter.createdAt).toLocaleString()}
            </p>
            <p className="text-purple-700 font-semibold">
              ✅ Finished:{" "}
              {letter.finishedAt
                ? new Date(letter.finishedAt).toLocaleString()
                : "Not finished"}
            </p>
          </div>
        </div>

        {/* Custom Music Player */}
        {letter.songUrl && (
          <div className="mb-6">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin text-4xl">🎵</div>
                <p className="text-purple-600 font-semibold mt-2">Loading song...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border-2 border-red-400 p-4 rounded-lg text-red-700 text-center mb-4">
                ❌ {error}
              </div>
            )}

            {trackInfo && !loading && (
              <div 
                className="bg-gradient-to-r from-cyan-200 to-pink-200 border-4 border-black p-4 shadow-lg relative overflow-hidden"
                style={{ borderRadius: "15px" }}
              >
                {/* Player decorative elements */}
                <div className="absolute top-2 right-2 w-4 h-4 bg-red-400 rounded-full animate-pulse"></div>
                <div className="absolute bottom-2 left-2 w-3 h-3 bg-green-400 rounded-full"></div>

                {/* Player Status */}
                <div className={`${getPlayerStatusColor()} border-2 p-2 rounded-lg text-xs mb-4`}>
                  🎵 {getPlayerStatus()}
                </div>

                {/* Album and Track Info */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative">
                    <img
                      src={trackInfo.album.images[1]?.url || trackInfo.album.images[0]?.url}
                      alt="album cover"
                      className="w-20 h-20 border-3 border-black shadow-lg"
                      style={{ borderRadius: "10px" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" style={{ borderRadius: "10px" }}></div>
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-lg text-purple-800 mb-1 drop-shadow">
                      🎵 {trackInfo.name}
                    </div>
                    <div className="text-sm text-purple-600 font-semibold">
                      👤 {trackInfo.artists.map((a: any) => a.name).join(", ")}
                    </div>
                    <div className="text-xs text-purple-500 mt-1">
                      💿 {trackInfo.album.name}
                    </div>
                  </div>
                </div>

                {/* Audio element for preview playback */}
                {!hasPremium && trackInfo.preview_url && (
                  <audio
                    ref={audioRef}
                    src={trackInfo.preview_url}
                    style={{ display: 'none' }}
                  />
                )}

                {/* Player Controls */}
                {(hasPremium || trackInfo.preview_url) ? (
                  <div className="space-y-3">
                    {/* Control Buttons */}
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={skipBackward}
                        className="w-12 h-12 bg-purple-500 hover:bg-purple-600 text-white border-2 border-black shadow-lg transition-all hover:scale-110"
                        style={{ borderRadius: "50%" }}
                      >
                        <SkipBack className="w-5 h-5 mx-auto" />
                      </button>
                      
                      <button
                        onClick={togglePlay}
                        disabled={!!(hasPremium && !playerReady)}
                        className="w-16 h-16 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white border-3 border-black shadow-xl transition-all hover:scale-110 animate-pulse"
                        style={{ borderRadius: "50%" }}
                      >
                        {isPlaying ? <Pause className="w-7 h-7 mx-auto" /> : <Play className="w-7 h-7 mx-auto ml-1" />}
                      </button>
                      
                      <button
                        onClick={skipForward}
                        className="w-12 h-12 bg-purple-500 hover:bg-purple-600 text-white border-2 border-black shadow-lg transition-all hover:scale-110"
                        style={{ borderRadius: "50%" }}
                      >
                        <SkipForward className="w-5 h-5 mx-auto" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        disabled={!!(hasPremium && !playerReady)}
                        className="w-full h-3 bg-gradient-to-r from-pink-300 to-purple-300 rounded-lg appearance-none cursor-pointer border-2 border-black disabled:opacity-50"
                        style={{
                          background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${(currentTime / (duration || 1)) * 100}%, #d8b4fe ${(currentTime / (duration || 1)) * 100}%, #d8b4fe 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-purple-700 font-semibold">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center space-x-2">
                      <Volume2 className="w-4 h-4 text-purple-700" />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-gradient-to-r from-cyan-300 to-pink-300 rounded-lg appearance-none cursor-pointer border-2 border-black"
                      />
                      <span className="text-xs text-purple-700 font-semibold w-8">{Math.round(volume * 100)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-purple-700 font-semibold mb-2">🚫 No preview available for this track</p>
                    <a
                      href={trackInfo.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold border-2 border-black shadow-lg transition-all hover:scale-105"
                      style={{ borderRadius: "10px" }}
                    >
                      🎧 Listen on Spotify
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Letter Content */}
        <div 
          className="mb-4 p-4 bg-gradient-to-br from-yellow-100 to-pink-100 border-2 border-purple-400 shadow-inner"
          style={{ borderRadius: "12px" }}
        >
          <p className="whitespace-pre-wrap text-purple-900 leading-relaxed font-medium">
            {letter.content}
          </p>
        </div>

        {/* Photo */}
        {letter.photoUrl && (
          <div className="text-center">
            <img
              src={letter.photoUrl}
              alt="letter photo"
              className="max-w-full border-4 border-black shadow-xl mx-auto"
              style={{ borderRadius: "15px" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}