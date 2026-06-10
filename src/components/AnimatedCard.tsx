import React from 'react';

interface AnimatedCardProps {
  title: string;
  description: string;
  icon?: string;
  link?: string;
  delay?: number;
}

/** Detect if a URL is external (starts with http/https or //) */
function isExternalLink(url: string): boolean {
  return /^https?:\/\//.test(url) || url.startsWith('//');
}

export default function AnimatedCard({
  title,
  description,
  icon,
  link,
  delay = 0,
}: AnimatedCardProps) {
  const style: React.CSSProperties = {
    animationName: 'fade-in-up',
    animationDuration: '0.6s',
    animationFillMode: 'both',
    animationDelay: `${delay}ms`,
  };

  const className = 'animated-card';

  const content = (
    <>
      {icon && <span className="animated-card__icon">{icon}</span>}
      <h3 className="animated-card__title">{title}</h3>
      <p className="animated-card__description">{description}</p>
    </>
  );

  if (link) {
    const external = isExternalLink(link);
    return (
      <a
        href={link}
        className={className}
        style={style}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}
