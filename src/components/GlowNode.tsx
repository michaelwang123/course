import React from 'react';

interface GlowNodeProps {
  label: string;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles: Record<'sm' | 'md' | 'lg', React.CSSProperties> = {
  sm: { padding: '0.25rem 0.5rem', fontSize: '0.75rem' },
  md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
  lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
};

// Preserve class names for test compatibility and external CSS overrides
const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function GlowNode({ label, icon, size = 'md' }: GlowNodeProps) {
  const style: React.CSSProperties = {
    borderRadius: '9999px',
    boxShadow: '0 0 8px rgba(0,255,170,0.4)',
    animationName: 'pulse-glow',
    animationDuration: '2s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    willChange: 'box-shadow',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    border: '1px solid rgba(0,255,170,0.3)',
    color: 'var(--color-text, #ffffff)',
    background: 'var(--color-bg-soft, #111827)',
    ...sizeStyles[size],
  };

  return (
    <span className={`glow-node ${sizeClasses[size]}`} style={style}>
      {icon && <span className={`glow-node__icon ${icon}`} aria-hidden="true" />}
      <span className="glow-node__label">{label}</span>
    </span>
  );
}
