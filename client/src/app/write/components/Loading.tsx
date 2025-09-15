// Add this component to your project
import { useState, useEffect } from 'react';

interface KawaiiLoaderProps {
  message?: string;
}

function KawaiiLoader({ message = "Uploading your photo..." }: KawaiiLoaderProps) {
  const [dots, setDots] = useState("");
  const [sparkles, setSparkles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Generate random sparkles
    const generateSparkles = () => {
      const newSparkles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 20 + 10,
        delay: Math.random() * 2,
      }));
      setSparkles(newSparkles);
    };

    generateSparkles();
    const sparkleInterval = setInterval(generateSparkles, 3000);
    return () => clearInterval(sparkleInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-repeat animate-pulse" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff69b4' fill-opacity='0.3'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zM10 10h40v40H10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
             }}>
        </div>
      </div>

      {/* Floating sparkles */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="absolute animate-bounce text-yellow-300"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            fontSize: `${sparkle.size}px`,
            animationDelay: `${sparkle.delay}s`,
            animationDuration: '2s'
          }}
        >
          ✨
        </div>
      ))}

      {/* Main loading container */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl border-4 border-pink-400 p-8 text-center shadow-2xl max-w-md mx-4 relative overflow-hidden">
        {/* Kawaii face decoration */}
        <div className="absolute -top-6 -right-6 text-6xl animate-spin" style={{ animationDuration: '4s' }}>
          🌟
        </div>
        <div className="absolute -bottom-4 -left-4 text-4xl animate-bounce">
          💖
        </div>

        {/* Loading spinner - kawaii style */}
        <div className="relative mb-6">
          <div className="w-20 h-20 mx-auto relative">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 border-4 border-pink-200 rounded-full animate-spin border-t-pink-500 border-r-purple-500"></div>
            
            {/* Inner pulsing heart */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-3xl animate-pulse">💝</div>
            </div>
          </div>
        </div>

        {/* Retro text styling */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            (◕‿◕)♡ Processing
          </h2>
          
          <div className="font-mono text-lg text-purple-700 bg-yellow-100 px-4 py-2 rounded-full border-2 border-dashed border-purple-300">
            {message}{dots}
          </div>

          {/* Retro loading bar */}
          <div className="w-full bg-purple-200 rounded-full h-4 border-2 border-purple-400 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-full animate-pulse relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>

          <p className="text-sm text-purple-600 font-medium">
            ˚₊‧꒰ა Making magic happen ໒꒱ ‧₊˚
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 left-4 text-pink-400 animate-ping">💫</div>
        <div className="absolute bottom-8 right-8 text-purple-400 animate-pulse">🎀</div>
      </div>
    </div>
  );
}

export { KawaiiLoader };