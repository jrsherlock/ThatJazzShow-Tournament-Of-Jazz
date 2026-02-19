'use client';

import { useDraggable } from '@dnd-kit/core';
import type { Artist, MediaLink } from '@/lib/types';

interface ArtistCardProps {
  artist: Artist;
  variant?: 'bracket' | 'detail';
  isWinner?: boolean;
  isEliminated?: boolean;
  onSelect?: (artist: Artist) => void;
  matchupKey?: string;
  className?: string;
  style?: React.CSSProperties;
}

function VideoIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
    </svg>
  );
}

function AudioIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
    </svg>
  );
}

function MediaIcon({ link, size = 'sm' }: { link: MediaLink; size?: 'sm' | 'md' }) {
  const Icon = link.type === 'video' ? VideoIcon : AudioIcon;
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-3 h-3';
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${link.title} (${link.source})`}
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center justify-center rounded-full transition-colors ${
        size === 'sm'
          ? 'w-5 h-5 text-accent-muted hover:text-accent hover:bg-accent/10'
          : 'gap-1.5 text-xs px-3 py-1.5 bg-accent-muted/30 border border-accent-muted/50 text-blue-300 hover:bg-accent-muted/50'
      }`}
    >
      <Icon className={sizeClass} />
      {size === 'md' && <span className="truncate max-w-[140px]">{link.title}</span>}
    </a>
  );
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
  matchupKey,
  className = '',
  style,
  ...rest
}: ArtistCardProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect' | 'style'>) {
  const isDraggable = variant === 'bracket' && !!matchupKey;
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    transform: dragTransform,
    isDragging,
  } = useDraggable({
    id: matchupKey ? `drag-${matchupKey}-${artist.id}` : `noop-${artist.id}`,
    disabled: !isDraggable,
    data: { matchupKey, artistId: artist.id, artist },
  });

  if (variant === 'detail') {
    return (
      <div
        className={`flex flex-col items-center gap-3 rounded-xl bg-surface-hover border border-accent/20 p-5 w-full ${className}`}
        style={style}
        {...rest}
      >
        {/* Avatar */}
        {artist.photo_url ? (
          <img
            src={artist.photo_url}
            alt={artist.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-accent/40"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-background border-2 border-accent/40 flex items-center justify-center">
            <span className="text-accent text-xl font-display font-bold">
              {getInitials(artist.name)}
            </span>
          </div>
        )}

        {/* Name */}
        <h3 className="font-display text-xl font-bold text-foreground text-center leading-tight">
          {artist.name}
        </h3>

        {/* Seed badge */}
        <span className="text-xs text-accent/80 bg-accent/10 px-2 py-0.5 rounded-full">
          #{artist.seed} Seed
        </span>

        {/* Instrument & Era */}
        <div className="flex flex-col items-center gap-1 text-sm text-muted">
          {artist.instrument && <span>{artist.instrument}</span>}
          {artist.era && <span className="text-xs text-dim">{artist.era}</span>}
        </div>

        {/* Featured Track */}
        {artist.featured_track_url && (
          <a
            href={artist.featured_track_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-accent-muted/30 border border-accent-muted/50 text-blue-300 hover:bg-accent-muted/50 transition-colors"
          >
            <AudioIcon className="w-3 h-3" />
            {artist.featured_track_title || 'Listen'}
          </a>
        )}

        {/* Media Links */}
        {artist.media && artist.media.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-1">
            {artist.media.map((link, i) => (
              <MediaIcon key={i} link={link} size="md" />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Bracket variant (default)
  const dragStyle: React.CSSProperties = {
    ...style,
    ...(dragTransform
      ? { transform: `translate3d(${dragTransform.x}px, ${dragTransform.y}px, 0)` }
      : {}),
    ...(isDragging ? { opacity: 0.4 } : {}),
  };

  return (
    <div
      ref={isDraggable ? setDragRef : undefined}
      {...(isDraggable ? dragListeners : {})}
      {...(isDraggable ? dragAttributes : {})}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={(e) => {
        if (onSelect) {
          e.stopPropagation();
          onSelect(artist);
        }
      }}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(artist);
        }
      }}
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-md bg-background border
        transition-[color,background-color,border-color,box-shadow,opacity] duration-200
        ${isWinner
          ? 'border-l-[3px] border-l-champion border-t-gold/30 border-r-gold/30 border-b-gold/30 bg-champion/[0.08] text-champion'
          : 'border-transparent hover:border-accent/30 hover:bg-foreground/[0.04]'
        }
        ${isEliminated ? 'opacity-50' : ''}
        ${onSelect ? 'cursor-pointer' : ''}
        ${isDraggable ? 'touch-none' : ''}
        ${className}
      `}
      style={dragStyle}
      {...rest}
    >
      <span className="text-xs text-dim font-mono min-w-[2rem]">
        ({artist.seed})
      </span>
      <span
        className={`text-sm font-medium truncate ${
          isEliminated ? 'line-through text-dim' : isWinner ? 'text-champion' : 'text-foreground'
        } ${onSelect && !isEliminated ? 'group-hover:underline decoration-accent/40 underline-offset-2' : ''}`}
      >
        {artist.name}
      </span>
      {artist.media && artist.media.length > 0 && (
        <span className="flex items-center gap-0.5 ml-auto shrink-0">
          {artist.media.slice(0, 3).map((link, i) => (
            <MediaIcon key={i} link={link} size="sm" />
          ))}
        </span>
      )}
    </div>
  );
}
