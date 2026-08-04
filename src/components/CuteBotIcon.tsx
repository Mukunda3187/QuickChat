import React from 'react';

export const CuteBotIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Top Antenna Stem & Orb */}
    <path
      d="M12 2V5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="2" r="1.5" fill="currentColor" />

    {/* Left and Right Side Ears */}
    <rect x="1.5" y="10" width="2" height="5" rx="1" fill="currentColor" />
    <rect x="20.5" y="10" width="2" height="5" rx="1" fill="currentColor" />

    {/* Cute Head Outline */}
    <rect
      x="3.5"
      y="5"
      width="17"
      height="15"
      rx="4.5"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="2"
    />

    {/* Inner Display Screen */}
    <rect
      x="5.5"
      y="7.5"
      width="13"
      height="10"
      rx="3"
      fill="currentColor"
      fillOpacity="0.1"
    />

    {/* Cute Big Eyes */}
    <circle cx="9" cy="11.5" r="1.75" fill="currentColor" />
    <circle cx="15" cy="11.5" r="1.75" fill="currentColor" />

    {/* Eye Glint Highlights */}
    <circle cx="9.6" cy="10.8" r="0.65" fill="white" />
    <circle cx="15.6" cy="10.8" r="0.65" fill="white" />

    {/* Happy Cute Smile */}
    <path
      d="M10 14.5C10.6 15.3 11.3 15.7 12 15.7C12.7 15.7 13.4 15.3 14 14.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />

    {/* Rosy Cheeks */}
    <ellipse cx="7" cy="13.2" rx="0.9" ry="0.5" fill="currentColor" opacity="0.6" />
    <ellipse cx="17" cy="13.2" rx="0.9" ry="0.5" fill="currentColor" opacity="0.6" />
  </svg>
);
