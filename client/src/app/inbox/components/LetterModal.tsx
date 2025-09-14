"use client";
import React, { useState, useEffect, useRef } from "react";

type Props = {
  letter: any;
  onClose: () => void;
};

export default function LetterModal({ letter, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [trackInfo, setTrackInfo] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  // TODO: Fetch track info from Spotify API if songUrl is present
  // add playback controls, manipulate track metadata, wavesurfer?
  {/*useEffect(() => {
    const fetchTrackInfo = async () => {
      if (letter.songUrl) {
        const trackId = letter.songUrl.split("/track/")[1];
        const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: {
            Authorization: `Bearer ${process.env.SPOTIFY_ACCESS_TOKEN}`, // Replace with your token
          },
        });
        const data = await response.json();
        setTrackInfo(data);
      }
    };

    fetchTrackInfo();
  }, [letter.songUrl]);*/}

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold">×</button>

        <h2 className="text-2xl font-bold mb-2">{letter.subject || "No subject"}</h2>
        <p className="text-gray-600 text-sm mb-2">Created: {new Date(letter.createdAt).toLocaleString()}</p>
        <p className="text-gray-600 text-sm mb-2">Finished: {letter.finishedAt ? new Date(letter.finishedAt).toLocaleString() : "Not finished"}</p>
        <p className="mb-4 whitespace-pre-wrap">{letter.content}</p>

        {letter.songUrl && (
          <div className="w-full mb-4">
            {/*{trackInfo && (
              <div className="mb-4">
                <h3 className="text-lg font-bold">{trackInfo.name}</h3>
                <p className="text-sm text-gray-600">By {trackInfo.artists.map((artist) => artist.name).join(", ")}</p>
                <p className="text-sm text-gray-600">Album: {trackInfo.album.name}</p>
                <img src={trackInfo.album.images[0].url} alt="Album cover" className="w-32 h-32 rounded-md mt-2" />
              </div>
            )}*/}
            <iframe
              src={`https://open.spotify.com/embed/track/${letter.songUrl.split('/track/')[1]}`}
              width="100%"
              height="80"
              frameBorder="0"
              allow="encrypted-media"
              allowFullScreen
              title="Spotify Player"
            ></iframe>
          </div>
        )}

        {letter.photoUrl && (
          <img src={letter.photoUrl} alt="letter photo" className="w-full rounded-md mb-2" />
        )}
      </div>
    </div>
  );
}
