import React, { useEffect, useRef } from 'react';

const LyricsDisplay = ({ lyrics, currentTime }) => {
  const containerRef = useRef(null);
  const activeLineRef = useRef(null);

  // Find current line index
  const currentIndex = lyrics.findIndex(
    (line, i) => currentTime >= line.start && currentTime < line.end
  );

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentIndex]);

  if (!lyrics || lyrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        No lyrics available
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto px-4 py-8 space-y-8 scrollbar-hide text-center"
    >
      {lyrics.map((line, index) => {
        const isActive = index === currentIndex;
        const isPast = index < currentIndex;

        return (
          <p
            key={index}
            ref={isActive ? activeLineRef : null}
            className={`transition-all duration-500 text-2xl font-bold leading-relaxed
              ${isActive ? 'text-white scale-110 blur-none' : 'text-slate-600 blur-[1px] scale-95'}
              ${isPast ? 'opacity-50' : 'opacity-100'}
            `}
          >
            {line.text}
          </p>
        );
      })}
    </div>
  );
};

export default LyricsDisplay;
