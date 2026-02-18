'use client';

import type { Artist } from '@/lib/types';

interface ArtistCardProps {
  artist: Artist;
  variant?: 'bracket' | 'detail';
  isWinner?: boolean;
  isEliminated?: boolean;
  onSelect?: (artist: Artist) => void;
  className?: string;
  style?: React.CSSProperties;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ArtistCard({
  artist,
  variant = 'bracket',
  isWinner = false,
  isEliminated = false,
  onSelect,
  className = '',
  style,
  ...rest
}: ArtistCardProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect' | 'style'>) {
  if (variant === 'detail') {
    return (
      <div
        className={`flex flex-col items-center gap-3 rounded-xl bg-[#1A1A1A] border border-gold/20 p-5 w-full ${className}`}
        style={style}
        {...rest}
      >
        {/* Avatar */}
        {artist.photo_url ? (
          <img
            src={artist.photo_url}
            alt={artist.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-gold/40"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[#0A0A0A] border-2 border-gold/40 flex items-center justify-center">
            <span className="text-gold text-xl font-display font-bold">
              {getInitials(artist.name)}
            </span>
          </div>
        )}

        {/* Name */}
        <h3 className="font-display text-xl font-bold text-white text-center leading-tight">
          {artist.name}
        </h3>

        {/* Seed badge */}
        <span className="text-xs text-gold/80 bg-gold/10 px-2 py-0.5 rounded-full">
          #{artist.seed} Seed
        </span>

        {/* Instrument & Era */}
        <div className="flex flex-col items-center gap-1 text-sm text-gray-400">
          {artist.instrument && <span>{artist.instrument}</span>}
          {artist.era && <span className="text-xs text-gray-500">{artist.era}</span>}
        </div>

        {/* Featured Track */}
        {artist.featured_track_url && (
          <a
            href={artist.featured_track_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-smoky-blue/30 border border-smoky-blue/50 text-blue-300 hover:bg-smoky-blue/50 transition-colors"
          >
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
            {artist.featured_track_title || 'Listen'}
          </a>
        )}
      </div>
    );
  }

  // Bracket variant (default)
  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={() => onSelect?.(artist)}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(artist);
        }
      }}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200
        bg-[#0A0A0A] border
        ${isWinner
          ? 'border-l-[3px] border-l-gold border-t-gold/30 border-r-gold/30 border-b-gold/30 bg-gold/[0.08] text-gold'
          : 'border-transparent hover:border-gold/40'
        }
        ${isEliminated ? 'opacity-50' : ''}
        ${onSelect ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={style}
      {...rest}
    >
      <span className="text-xs text-gray-500 font-mono min-w-[2rem]">
        ({artist.seed})
      </span>
      <span
        className={`text-sm font-medium truncate ${
          isEliminated ? 'line-through text-gray-500' : isWinner ? 'text-gold' : 'text-white'
        }`}
      >
        {artist.name}
      </span>
    </div>
  );
}
