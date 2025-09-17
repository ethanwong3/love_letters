"use client";

import { motion } from "framer-motion";

type Props = {
  imageSrc: string;
  message?: string;
};

export default function LoadingOverlay({ imageSrc, message }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#F8B7D4] via-[#F3CFE6] to-[#A28CC5] backdrop-blur-md">
      <motion.img
        src={imageSrc}
        alt="loading mascot"
        className="w-32 h-32 mb-6 drop-shadow-[0_0_10px_rgba(255,0,255,0.8)] border-thick border-pink-400 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
      />
      <p className="text-center text-purple-700 font-bold text-xl tracking-widest drop-shadow-[0_0_5px_#fff]">
        {message ||
          "Waking up the backend... (free servers need a lil stretch ✧)"}  
      </p>
      <p className="mt-3 text-pink-500 font-mono text-sm opacity-80">
        Please hold on, cutie ♡
      </p>
    </div>
  );
}
