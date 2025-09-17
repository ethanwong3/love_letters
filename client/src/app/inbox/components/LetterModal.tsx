"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { apiFetch } from "@/lib/api";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

// Type definitions
interface Letter {
  songUrl?: string;
  photoUrl?: string;
  subject?: string;
  createdAt: string;
  finishedAt?: string;
  content: string;
}

interface Props {
  letter: Letter;
  onClose: () => void;
}

interface SpotifyTrackInfo {
  id: string;
  name: string;
  preview_url?: string;
  external_urls: {
    spotify: string;
  };
  album: {
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  artists: Array<{
    name: string;
  }>;
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  getCurrentState: () => Promise<SpotifyPlayerState | null>;
  addListener: (event: string, callback: (data: SpotifyEventData) => void) => void;
  removeListener: (event: string, callback?: (data: SpotifyEventData) => void) => void;
}

interface SpotifyPlayerState {
  paused: boolean;
  position: number;
  duration: number;
}

interface SpotifyEventData {
  message?: string;
  device_id?: string;
  paused?: boolean;
  position?: number;
  duration?: number;
}

interface SpotifyUserProfile {
  product: string;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
    spotifyPlayerInstance?: SpotifyPlayer;
  }
}

export default function LetterModal({ letter, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trackInfo, setTrackInfo] = useState<SpotifyTrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [playerReady, setPlayerReady] = useState(false);
  const [hasPremium, setHasPremium] = useState<boolean | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Timer for Spotify player position updates
  useEffect(() => {
    if (!hasPremium || !player || !playerReady || !isPlaying) return;

    const interval = setInterval(async () => {
      try {
        const state = await player.getCurrentState();
        if (state && !state.paused) {
          const position = Math.floor(state.position / 1000);
          const trackDuration = Math.floor(state.duration / 1000);
          
          setCurrentTime(position);
          
          // Handle end of track
          if (position >= trackDuration - 1) {
            setIsPlaying(false);
            setCurrentTime(0);
            player.pause().catch(console.error);
          }
        }
      } catch (error) {
        console.error('Error getting player state:', error);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [hasPremium, player, playerReady, isPlaying]);

  const cleanup = useCallback(async () => {
    console.log("Cleaning up LetterModal...");
    
    // Stop HTML5 audio
    const currentAudio = audioRef.current;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = "";
    }
    
    // Stop Spotify player but don't disconnect (reuse it)
    if (player) {
      try {
        await player.pause();
      } catch (error) {
        console.error("Error stopping Spotify player:", error);
      }
    }
    
    setIsPlaying(false);
    setCurrentTime(0);
  }, [player]);

  // Enhanced onClose to include cleanup
  const handleClose = useCallback(async () => {
    await cleanup();
    onClose();
  }, [cleanup, onClose]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        // Call cleanup synchronously, then close
        const currentAudio = audioRef.current;
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
          currentAudio.src = "";
        }
        
        if (player) {
          player.pause().catch(console.error);
        }
        
        setIsPlaying(false);
        setCurrentTime(0);
        onClose();
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [player, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Use a separate cleanup for unmount that doesn't need to be async
      const currentAudio = audioRef.current;
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.src = "";
      }
      
      if (player) {
        player.pause().catch(console.error);
      }
    };
  }, [player]);

  const checkPremiumAndInitialize = useCallback(async () => {
    if (isInitializing) return;
    
    const spotifyToken = localStorage.getItem("spotifyAccessToken");
    
    if (!spotifyToken) {
      setError("Spotify access token not found. Please reconnect to Spotify.");
      return;
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${spotifyToken}` }
      });

      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }

      const userProfile: SpotifyUserProfile = await response.json();
      
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
  }, [isInitializing]);

  const initializePlayer = useCallback(async () => {
    if (isInitializing) return;
    setIsInitializing(true);

    // Check if we already have a global player instance
    if (window.spotifyPlayerInstance) {
      console.log('Using existing Spotify player instance');
      setPlayer(window.spotifyPlayerInstance);
      setPlayerReady(true);
      setIsInitializing(false);
      return;
    }

    if (!window.Spotify || !window.Spotify.Player) {
      setError("Spotify Web Playback SDK not available");
      setIsInitializing(false);
      return;
    }

    const spotifyToken = localStorage.getItem("spotifyAccessToken");
    
    if (!spotifyToken) {
      setError("Spotify access token not found");
      setIsInitializing(false);
      return;
    }

    try {
      const spotifyPlayer = new window.Spotify.Player({
        name: `Love Letter Player`,
        getOAuthToken: (cb: (token: string) => void) => {
          const currentToken = localStorage.getItem("spotifyAccessToken");
          if (currentToken) {
            cb(currentToken);
          }
        },
        volume: volume
      });

      // Store globally to prevent multiple instances
      window.spotifyPlayerInstance = spotifyPlayer;

      spotifyPlayer.addListener('initialization_error', ({ message }: SpotifyEventData) => {
        console.error('Initialization error:', message);
        setError(`Failed to initialize: ${message}`);
        setIsInitializing(false);
      });

      spotifyPlayer.addListener('authentication_error', ({ message }: SpotifyEventData) => {
        console.error('Authentication error:', message);
        setError('Authentication failed. Please reconnect to Spotify.');
        setIsInitializing(false);
      });

      spotifyPlayer.addListener('account_error', ({ message }: SpotifyEventData) => {
        console.error('Account error:', message);
        setError(`Account error: ${message}`);
        setIsInitializing(false);
      });

      spotifyPlayer.addListener('playback_error', ({ message }: SpotifyEventData) => {
        console.error('Playback error:', message);
        // Don't set error for "no list loaded" - this is expected initially
        if (!message?.includes('no list was loaded')) {
          setError(`Playback failed: ${message}`);
        }
      });

      // Fixed player state listener
      spotifyPlayer.addListener('player_state_changed', (state: SpotifyEventData) => {
        if (!state) {
          console.log('Player state is null');
          setIsPlaying(false);
          return;
        }

        console.log('Player state changed:', state);
        const paused = state.paused ?? true;
        const position = Math.floor((state.position ?? 0) / 1000);
        const trackDuration = Math.floor((state.duration ?? 0) / 1000);
        
        setIsPlaying(!paused);
        setCurrentTime(position);
        setDuration(trackDuration);
        
        // Handle end of track
        if (position >= trackDuration - 1 && !paused) {
          setIsPlaying(false);
          setCurrentTime(0);
          spotifyPlayer.pause().catch(console.error);
        }
      });

      spotifyPlayer.addListener('ready', ({ device_id }: SpotifyEventData) => {
        console.log('Player ready with Device ID:', device_id);
        setDeviceId(device_id || "");
        setPlayerReady(true);
        setError(null);
        setIsInitializing(false);
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }: SpotifyEventData) => {
        console.log('Device ID has gone offline:', device_id);
        setPlayerReady(false);
      });

      const connectWithTimeout = () => {
        return Promise.race([
          spotifyPlayer.connect(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 10000)
          )
        ]);
      };

      try {
        const success = await connectWithTimeout();
        
        if (success) {
          console.log('Successfully connected to Spotify!');
          setPlayer(spotifyPlayer);
        } else {
          throw new Error('Failed to connect to Spotify');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage === 'Connection timeout') {
          console.warn('Spotify connection timed out, falling back to preview mode');
          setHasPremium(false);
          setIsInitializing(false);
          return;
        }
        throw error;
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error initializing player:', error);
      setError('Failed to connect to Spotify. Using preview mode.');
      setHasPremium(false);
      setIsInitializing(false);
    }
  }, [volume, isInitializing]);

  const loadSpotifySDK = useCallback(() => {
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
  }, [checkPremiumAndInitialize]);

  // Check if SDK is already loaded
  useEffect(() => {
    if (window.Spotify && window.Spotify.Player) {
      setSdkLoaded(true);
      checkPremiumAndInitialize();
    } else {
      loadSpotifySDK();
    }

    return () => {
      // Don't disconnect on unmount - keep player alive for reuse
    };
  }, [checkPremiumAndInitialize, loadSpotifySDK]);

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

          const data: SpotifyTrackInfo = await apiFetch(`/spotify/song?id=${letter.songUrl}`, {
            headers: {
              "Spotify-Access-Token": spotifyToken,
            },
          });
          setTrackInfo(data);
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load song information";
          console.error("Failed to fetch track info:", err);
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTrackInfo();
  }, [letter.songUrl]);

  // Fixed audio event listeners for preview mode
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || hasPremium) return;

    let timeUpdateInterval: NodeJS.Timeout;

    const updateTime = () => {
      if (!audio.paused && !audio.ended) {
        setCurrentTime(Math.floor(audio.currentTime));
        
        // Check if we're near the end
        if (audio.currentTime >= audio.duration - 0.1) {
          setIsPlaying(false);
          setCurrentTime(0);
          audio.currentTime = 0;
          audio.pause();
        }
      }
    };
    
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(Math.floor(audio.duration));
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
      // Use interval for more reliable time updates
      timeUpdateInterval = setInterval(updateTime, 100);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
      }
    };
    
    const handleLoadedData = () => {
      updateDuration();
    };

    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("canplaythrough", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", updateTime);

    return () => {
      if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
      }
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("canplaythrough", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [trackInfo, hasPremium]);

  const playSpotifyTrack = async () => {
    if (!player || !deviceId || !trackInfo || !hasPremium) return;

    const spotifyToken = localStorage.getItem("spotifyAccessToken");
    
    try {
      // First, ensure the device is active
      await fetch(`https://api.spotify.com/v1/me/player`, {
        method: 'PUT',
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${spotifyToken}`
        },
      });

      // Small delay to ensure device transfer
      await new Promise(resolve => setTimeout(resolve, 500));

      // Now play the track
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
        const errorData: { error?: { message?: string } } = await response.json();
        throw new Error(errorData.error?.message || 'Failed to play track');
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error playing track:', error);
      setError('Failed to play track. Try selecting this device in your Spotify app first.');
    }
  };

  const togglePlay = async () => {
    if (hasPremium && playerReady) {
      if (!isPlaying) {
        // Resume playback at current position
        if (currentTime > 0) {
          await player?.resume();
        } else {
          await playSpotifyTrack();
        }
      } else {
        await player?.pause();
      }
    } else if (!hasPremium && audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
          // Don't reset currentTime when pausing
        } else {
          // Resume from current position (HTML5 audio automatically maintains position)
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

  // Fixed seek handler
  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    
    if (hasPremium && player && playerReady) {
      await player.seek(newTime * 1000); // Spotify expects milliseconds
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
    if (isInitializing) return "Initializing Spotify player...";
    if (!playerReady) return "Connecting to Spotify player...";
    return "Ready to play full songs!";
  };

  const getPlayerStatusColor = () => {
    if (hasPremium === null || !sdkLoaded || isInitializing || (hasPremium && !playerReady)) return "bg-blue-100 border-blue-400 text-blue-800";
    if (!hasPremium) return "bg-yellow-100 border-yellow-400 text-yellow-800";
    return "bg-green-100 border-green-400 text-green-800";
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white border-10 border-black p-4 max-w-5xl w-full mx-4 max-h-[90vh] h-full overflow-hidden shadow-2xl relative flex flex-col"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-red-500 hover:bg-red-600 text-white font-bold text-xl border-2 border-black shadow-lg transition-all hover:scale-110"
          style={{ borderRadius: "50%" }}
        >
          ×
        </button>

        {/* Top Row - Subject and Writing Time */}
        <div className="flex-shrink-0 mb-4">
          <p className="mb-2">
            Subject: {letter.subject || "No subject"}
          </p>
          <p>
            Writing Time: {new Date(letter.createdAt).toLocaleString()} → {letter.finishedAt
              ? new Date(letter.finishedAt).toLocaleString()
              : "Not finished"}
          </p>
        </div>

        {/* Middle Row - Music Player and Photo */}
        <div className="flex-shrink-0 mb-4">
          <div className="flex gap-4 items-start">
            {/* Music Player */}
            {letter.songUrl && (
              <div className="flex-1">
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
                    className="bg-gradient-to-r from-cyan-200 to-pink-200 border-4 border-black p-2 shadow-lg relative overflow-hidden"
                    style={{ borderRadius: "15px" }}
                  >
                    <div className={`${getPlayerStatusColor()} border-2 p-2 rounded-lg text-xs mb-2`}>
                      🎵 {getPlayerStatus()}
                    </div>

                    <div className="flex items-center space-x-2 mb-2">
                      <div className="relative">
                        <img
                          src={trackInfo.album.images[1]?.url || trackInfo.album.images[0]?.url}
                          alt="album cover"
                          width={80}
                          height={80}
                          className="border-3 border-black shadow-lg object-cover"
                          style={{ borderRadius: "10px", width: "80px", height: "80px" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" style={{ borderRadius: "10px" }}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-lg text-purple-800 mb-1 drop-shadow truncate">
                          🎵 {trackInfo.name}
                        </div>
                        <div className="text-sm text-purple-600 font-semibold truncate overflow-hidden">
                          👤 {trackInfo.artists
                            .slice(0, 2) // Limit to the first 2 artists
                            .map((a) => a.name)
                            .join(", ")}
                          {trackInfo.artists.length > 2 && " ..."} {/* Add ellipsis if there are more artists */}
                        </div>
                      </div>
                    </div>

                    {!hasPremium && trackInfo.preview_url && (
                      <audio
                        ref={audioRef}
                        src={trackInfo.preview_url}
                        style={{ display: 'none' }}
                        preload="metadata"
                      />
                    )}

                    {(hasPremium || trackInfo.preview_url) ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center space-x-4">
                          <button
                            onClick={skipBackward}
                            className="w-10 h-10 bg-purple-500 hover:bg-purple-600 text-white border-2 border-black shadow-lg transition-all hover:scale-110"
                            style={{ borderRadius: "50%" }}
                          >
                            <SkipBack className="w-5 h-5 mx-auto" />
                          </button>
                          
                          <button
                            onClick={togglePlay}
                            disabled={!!(hasPremium && (!playerReady || isInitializing))}
                            className="w-15 h-15 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white border-3 border-black shadow-xl transition-all hover:scale-110"
                            style={{ borderRadius: "50%" }}
                          >
                            {isPlaying ? <Pause className="w-7 h-7 mx-auto" /> : <Play className="w-7 h-7 mx-auto" />}
                          </button>
                          
                          <button
                            onClick={skipForward}
                            className="w-10 h-10 bg-purple-500 hover:bg-purple-600 text-white border-2 border-black shadow-lg transition-all hover:scale-110"
                            style={{ borderRadius: "50%" }}
                          >
                            <SkipForward className="w-5 h-5 mx-auto" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            disabled={!!(hasPremium && (!playerReady || isInitializing))}
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

            {/* Photo - Sized to match player height without warping */}
            {letter.photoUrl && (
              <div className="flex-shrink-0">
                <img
                  src={letter.photoUrl}
                  alt="letter photo"
                  className="border-4 border-black shadow-xl object-contain"
                  style={{ 
                    borderRadius: "15px",
                    maxHeight: letter.songUrl ? "350px" : "300px", // Adjust based on whether player exists
                    maxWidth: "300px",
                    width: "300px",
                    height: letter.songUrl ? "350px" : "300px"
                  }}
                />
              </div>

            )}
          </div>
        </div>

        {/* Bottom Row - Letter Content (Scrollable) */}
        <div 
          className="flex-1 p-4 bg-yellow-100 border-4 border-black overflow-y-auto min-h-0"
          style={{ borderRadius: "12px" }}
        >
          <p className="whitespace-pre-wrap text-purple-900 leading-relaxed font-medium">
            {letter.content}
          </p>
        </div>
      </div>
    </div>
  );
}