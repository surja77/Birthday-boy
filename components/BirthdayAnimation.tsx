import React, { useEffect, useState } from 'react';

interface BirthdayAnimationProps {
  images: string[];
  onComplete: () => void;
}

const BirthdayAnimation: React.FC<BirthdayAnimationProps> = ({ images, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (images.length === 0) return;

    // Image rotation timer
    const imageInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000); // Change image every 3 seconds

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          clearInterval(imageInterval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(imageInterval);
      clearInterval(countdownInterval);
    };
  }, [images, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900 via-pink-800 to-red-900"></div>
      </div>

      {/* Main Image */}
      <div className="relative w-full max-w-lg aspect-square p-4">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`Birthday ${idx}`}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out ${
              idx === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          />
        ))}
      </div>

      {/* Overlay Text */}
      <div className="absolute bottom-20 text-center z-10 animate-bounce">
        <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500 drop-shadow-lg">
          HAPPY BIRTHDAY!
        </h1>
      </div>

      {/* Progress */}
      <div className="absolute top-8 right-8 z-10">
        <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center text-white font-bold text-xl bg-black/50 backdrop-blur">
          {timeLeft}
        </div>
      </div>

      {/* Confetti effect (simulated with CSS for simplicity) */}
      <div className="absolute inset-0 pointer-events-none">
         {/* Could implement canvas confetti here for better effect, but keeping it simple for code volume */}
      </div>
    </div>
  );
};

export default BirthdayAnimation;
