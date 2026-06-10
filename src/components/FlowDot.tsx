import React from 'react';

// Extend CSSProperties to allow custom CSS variables without type assertion
declare module 'react' {
  interface CSSProperties {
    '--dot-distance'?: string;
    '--dot-duration'?: string;
  }
}

interface FlowDotProps {
  color?: string;
  size?: number;
  distance?: number;
  duration?: number;
  direction?: 'ltr' | 'rtl';
}

export default function FlowDot({
  color = '#00ffaa',
  size = 6,
  distance = 160,
  duration = 2,
  direction = 'ltr',
}: FlowDotProps) {
  const dotDistance = direction === 'rtl' ? -distance : distance;

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: color,
        '--dot-distance': `${dotDistance}px`,
        '--dot-duration': `${duration}s`,
        animation: `dot-move var(--dot-duration) linear infinite`,
      }}
    />
  );
}
