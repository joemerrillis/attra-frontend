import { useEffect, useState } from 'react';

interface Pin {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export default function AnimatedMap() {
  const [pins, setPins] = useState<Pin[]>([]);

  useEffect(() => {
    // Generate random pins
    const newPins = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }));
    setPins(newPins);
  }, []);

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Animated pins */}
      {pins.map((pin) => (
        <div
          key={pin.id}
          className="absolute w-3 h-3 bg-blue-500 rounded-full animate-pulse"
          style={{
            left: `${pin.x}%`,
            top: `${pin.y}%`,
            animationDelay: `${pin.delay}s`,
          }}
        >
          {/* Ripple effect */}
          <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
        </div>
      ))}
    </div>
  );
}
