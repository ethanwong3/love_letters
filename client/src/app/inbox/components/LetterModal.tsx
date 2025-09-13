"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  letter: any;
  onClose: () => void;
};

export default function LetterModal({ letter, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-2">
          {letter.subject || "No subject"}
        </h2>
        <p className="text-gray-600 text-sm mb-2">
          Created: {new Date(letter.createdAt).toLocaleString()}
        </p>
        <p className="text-gray-600 text-sm mb-2">
          Finished:{" "}
          {letter.finishedAt
            ? new Date(letter.finishedAt).toLocaleString()
            : "Not finished"}
        </p>
        <p className="mb-4">{letter.content}</p>
        {letter.songUrl && (
          <audio
            ref={audioRef}
            src={letter.songUrl}
            controls
            autoPlay
            className="w-full mb-4"
          />
        )}
        {letter.photoUrl && (
          <img
            src={letter.photoUrl}
            alt="letter photo"
            className="w-full rounded-md"
          />
        )}
      </div>
    </div>
  );
}
