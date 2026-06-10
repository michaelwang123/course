import React from 'react';

interface FlowLineProps {
  width?: number;
  height?: number;
  color?: string;
  speed?: number;
}

export default function FlowLine({
  width = 200,
  height = 4,
  color = 'rgba(0,255,170,0.4)',
  speed = 1.5,
}: FlowLineProps) {
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      style={{ display: 'inline-block', overflow: 'visible' }}
    >
      <line
        x1="0"
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke={color}
        strokeWidth={height}
        strokeDasharray="8 6"
        strokeLinecap="round"
        style={{
          animation: `dash-flow ${speed}s linear infinite`,
        }}
      />
    </svg>
  );
}
