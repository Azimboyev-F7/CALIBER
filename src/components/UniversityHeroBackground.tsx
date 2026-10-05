import React, { useEffect, useState } from 'react';
import stanfordImg from '../assets/universities/stanford.jpg';
import mitImg from '../assets/universities/mit.jpg';

interface UniversitySlide {
  id: string;
  name: string;
  image: string;
  alt: string;
}

const UNIVERSITIES: UniversitySlide[] = [
  {
    id: 'stanford',
    name: 'Stanford University',
    image: stanfordImg,
    alt: 'Aerial campus view of Stanford University Hoover Tower and Quad',
  },
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology',
    image: mitImg,
    alt: 'Historic Neoclassical Great Dome and Building 10 at MIT',
  },
];

export const UniversityHeroBackground: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % UNIVERSITIES.length);
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* University Photos with Crossfade and Subtle Zoom */}
      {UNIVERSITIES.map((univ, index) => {
        const isActive = index === activeIndex;
        return (
          <div
            key={univ.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1500 ease-in-out ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={univ.image}
              alt={univ.alt}
              className={`w-full h-full object-cover object-center transform transition-transform duration-[9000ms] ease-out ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
              style={{
                filter: 'brightness(0.82) contrast(1.1) saturate(0.9)',
              }}
            />
          </div>
        );
      })}

      {/* Dimming & Landing Page Theme Color Wash */}
      {/* 1. Deep landing page color wash (#06020E) */}
      <div className="absolute inset-0 bg-[#06020E]/45 mix-blend-multiply pointer-events-none" />

      {/* 2. Brand Indigo/Purple thematic atmospheric tint */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#06020E]/75 via-indigo-950/30 to-[#06020E]/75 pointer-events-none" />

      {/* 3. Radial vignette: clear central focal area, soft dark perimeter */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, transparent 25%, rgba(6, 2, 14, 0.5) 65%, #06020E 95%)',
        }}
      />

      {/* 4. Smooth vertical fade into the page background at top and bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06020E]/80 via-transparent to-[#06020E] pointer-events-none" />
    </div>
  );
};
