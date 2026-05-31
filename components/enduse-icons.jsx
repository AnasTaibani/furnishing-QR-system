// Simple monochrome icons for end-use categories.
import React from 'react';

const base = {
  width: '100%',
  height: '100%',
  viewBox: '0 0 64 64',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 3,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  xmlns: 'http://www.w3.org/2000/svg',
};

export function EndUseIconSofas() {
  return (
    <svg {...base}>
      <path d="M6 32 Q6 24 14 24 L50 24 Q58 24 58 32 L58 48 L6 48 Z" />
      <path d="M6 32 L6 44" />
      <path d="M58 32 L58 44" />
      <path d="M14 24 L14 36" />
      <path d="M50 24 L50 36" />
      <path d="M14 48 L14 54" />
      <path d="M50 48 L50 54" />
    </svg>
  );
}

export function EndUseIconCurtains() {
  return (
    <svg {...base}>
      <path d="M6 8 L58 8" />
      <path d="M14 8 Q10 30 18 52 L18 56" />
      <path d="M26 8 Q22 30 30 52 L30 56" />
      <path d="M38 8 Q34 30 42 52 L42 56" />
      <path d="M50 8 Q46 30 54 52 L54 56" />
    </svg>
  );
}

export function EndUseIconBlinds() {
  return (
    <svg {...base}>
      <rect x="8" y="8" width="48" height="48" rx="2" />
      <path d="M8 18 L56 18" />
      <path d="M8 28 L56 28" />
      <path d="M8 38 L56 38" />
      <path d="M8 48 L56 48" />
    </svg>
  );
}

export function EndUseIconCushions() {
  return (
    <svg {...base}>
      <path d="M14 14 Q8 8 14 14 Q24 14 32 12 Q40 14 50 14 Q56 8 50 14 Q56 24 54 32 Q56 40 50 50 Q56 56 50 50 Q40 50 32 52 Q24 50 14 50 Q8 56 14 50 Q8 40 10 32 Q8 24 14 14 Z" />
    </svg>
  );
}

const MAP = {
  sofas: EndUseIconSofas,
  curtains: EndUseIconCurtains,
  blinds: EndUseIconBlinds,
  cushions: EndUseIconCushions,
};

export function EndUseIcon({ id, className = '' }) {
  const Comp = MAP[id];
  if (!Comp) return null;
  return (
    <span className={`inline-block text-black ${className}`}>
      <Comp />
    </span>
  );
}
