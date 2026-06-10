import React, { useRef, useState, useEffect } from 'react';

interface ScrollRevealProps {
  animation?: 'fade-in-up' | 'fade-in' | 'scale-in';
  delay?: number;
  threshold?: number;
  children: React.ReactNode;
}

export default function ScrollReveal({
  animation = 'fade-in-up',
  delay = 0,
  threshold = 0.1,
  children,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Graceful degradation: if IntersectionObserver is not available, show immediately
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Disconnect entirely — we only need one trigger
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);

    // Use disconnect() for cleanup — safer than unobserve when element ref
    // might be stale during unmount race conditions
    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={isVisible ? animation : ''}
      style={{
        opacity: isVisible ? undefined : 0,
        animationDelay: delay ? `${delay}ms` : undefined,
      }}
    >
      {children}
    </div>
  );
}
