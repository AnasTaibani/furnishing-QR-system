// Monochrome ISO-style wash care icons (inline SVG for print fidelity).
// All icons are 64x64 viewBox, black strokes/fills on transparent.
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

export function WashCareIconWash40() {
  return (
    <svg {...base}>
      {/* Wash tub */}
      <path d="M6 24 L58 24 L52 54 Q52 58 48 58 L16 58 Q12 58 12 54 Z" />
      <path d="M6 24 Q14 14 22 24" />
      <text x="32" y="48" textAnchor="middle" fontSize="18" fontFamily="sans-serif" fontWeight="700" fill="currentColor" stroke="none">40</text>
    </svg>
  );
}

export function WashCareIconNoBleach() {
  return (
    <svg {...base}>
      {/* Triangle */}
      <path d="M32 8 L58 56 L6 56 Z" />
      {/* X across */}
      <path d="M14 18 L50 54" />
      <path d="M50 18 L14 54" />
    </svg>
  );
}

export function WashCareIconNoTumble() {
  return (
    <svg {...base}>
      {/* Square */}
      <rect x="6" y="12" width="52" height="40" rx="2" />
      {/* Circle inside */}
      <circle cx="32" cy="32" r="13" />
      {/* X across whole thing */}
      <path d="M10 16 L54 48" />
      <path d="M54 16 L10 48" />
    </svg>
  );
}

export function WashCareIconHangDry() {
  return (
    <svg {...base}>
      {/* Square */}
      <rect x="6" y="12" width="52" height="40" rx="2" />
      {/* Hanging line at top */}
      <path d="M6 12 L32 4 L58 12" />
      {/* Vertical drip line */}
      <path d="M22 14 L22 26" />
    </svg>
  );
}

export function WashCareIconDryClean() {
  return (
    <svg {...base}>
      <circle cx="32" cy="32" r="24" />
      <text x="32" y="40" textAnchor="middle" fontSize="22" fontFamily="serif" fontWeight="700" fill="currentColor" stroke="none">P</text>
    </svg>
  );
}

export function WashCareIconIron2Dots() {
  return (
    <svg {...base}>
      {/* Iron silhouette */}
      <path d="M6 48 L58 48 L52 28 Q44 22 32 22 Q16 22 6 32 Z" />
      <path d="M6 48 L58 48" />
      {/* Two dots */}
      <circle cx="26" cy="38" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="38" cy="38" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

const ICON_MAP = {
  wash_40: WashCareIconWash40,
  no_bleach: WashCareIconNoBleach,
  no_tumble: WashCareIconNoTumble,
  hang_dry: WashCareIconHangDry,
  dry_clean: WashCareIconDryClean,
  iron_2_dots: WashCareIconIron2Dots,
};

export function WashCareIcon({ id, className = '' }) {
  const Comp = ICON_MAP[id];
  if (!Comp) return null;
  return (
    <span className={`inline-block text-black ${className}`}>
      <Comp />
    </span>
  );
}
