"use client";

import React from "react";

type Props = {
  letter: any;
  onClick: () => void;
};

export default function LetterIcon({ letter, onClick }: Props) {
  const isOpened = letter.status === "OPENED";
  return (
    <div
      className="cursor-pointer hover:scale-110 transition-transform duration-200"
      onClick={onClick}
    >
      <img
        src={isOpened ? "/mailopened.png" : "/mail.png"}
        alt="letter icon"
        className="w-16 h-16"
      />
    </div>
  );
}
