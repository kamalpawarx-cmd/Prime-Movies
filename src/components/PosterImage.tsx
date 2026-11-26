import React, { useState } from 'react';
import { Film } from 'lucide-react';

interface PosterImageProps {
  src?: string;
  alt: string;
  title: string;
  className?: string;
  aspectClass?: string;
  priority?: boolean;
}

export const PosterImage: React.FC<PosterImageProps> = ({
  src,
  alt,
  title,
  className = '',
  aspectClass = 'aspect-[3/4]',
  priority = false,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`${aspectClass} ${className} relative flex flex-col items-center justify-center overflow-hidden p-4 text-center`}
        style={{
          background:
            'linear-gradient(155deg, var(--bg-elevated) 0%, var(--bg-surface) 60%, var(--bg-canvas) 100%)',
        }}
        role="img"
        aria-label={alt}
      >
        <Film className="mb-2 h-6 w-6 opacity-50" style={{ color: 'var(--accent)' }} />
        <span
          className="font-display line-clamp-2 text-sm font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${aspectClass} ${className} relative overflow-hidden`}
      style={{ backgroundColor: 'var(--bg-elevated)' }}
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover transition-transform duration-300 ease-out"
      />
    </div>
  );
};
