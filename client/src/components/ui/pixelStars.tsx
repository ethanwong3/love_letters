import React, { useEffect, useState } from "react";

interface PixelStarsProps {
  color: "black" | "white";
}

export default function PixelStars({ color }: PixelStarsProps) {
  const [stars, setStars] = useState<{ top: string; left: string }[]>([]);

  useEffect(() => {
    const generateStars = () => {
      const newStars = Array.from({ length: 50 }, () => ({
        top: `${Math.random() * 100}vh`,
        left: `${Math.random() * 100}vw`,
      }));
      setStars(newStars);
    };

    generateStars();
    const interval = setInterval(generateStars, 1500); // Regenerate stars every 1.5s
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {stars.map((star, index) => (
        <div
          key={index}
          className={`pixel-star ${color}`}
          style={{ top: star.top, left: star.left }}
        />
      ))}
    </>
  );
}