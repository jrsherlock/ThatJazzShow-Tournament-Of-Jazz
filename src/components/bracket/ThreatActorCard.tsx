'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { ThreatActor, MediaLink } from '@/lib/types';

interface ThreatActorCardProps {
  actor: ThreatActor;
  variant?: 'bracket' | 'detail';
  isWinner?: boolean;
  isEliminated?: boolean;
  onSelect?: (actor: ThreatActor) => void;
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
          : 'gap-1.5 text-xs px-3 py-1.5 bg-accent-muted/30 border border-accent-muted/50 text-accent dark:text-blue-300 hover:bg-accent-muted/50'
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

/** Check if string contains non-ASCII chars (emoji flags, pictographs, etc.) */
function isEmojiFlag(str: string): boolean {
  return !/^[\x20-\x7E]*$/.test(str);
}

export function ThreatActorCard({
  actor,
  variant = 'bracket',
  isWinner = false,
  isEliminated = false,
  onSelect,
  matchupKey,
  className = '',
  style,
  ...rest
}: ThreatActorCardProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect' | 'style'>) {
  const [imgError, setImgError] = useState(false);
  const hasFlag = !!(actor.country_flag && isEmojiFlag(actor.country_flag));
  const showPhoto = !!(actor.photo_url && !imgError);

  const isDraggable = variant === 'bracket' && !!matchupKey;
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    transform: dragTransform,
    isDragging,
  } = useDraggable({
    id: matchupKey ? `drag-${matchupKey}-${actor.id}` : `noop-${actor.id}`,
    disabled: !isDraggable,
    data: { matchupKey, actorId: actor.id, actor },
  });

  if (variant === 'detail') {
    return (
      <div
        className={`flex flex-col items-center gap-3 rounded-xl bg-surface-hover border border-accent/20 p-5 w-full ${className}`}
        style={style}
        {...rest}
      >
        {/* Avatar / Flag */}
        {showPhoto ? (
          <div className="w-36 h-36 rounded-lg overflow-hidden flex items-center justify-center"
            style={{
              background: 'rgba(52, 177, 228, 0.04)',
              border: '1px solid rgba(52, 177, 228, 0.15)',
            }}
          >
            <img
              src={actor.photo_url!}
              alt={actor.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        ) : hasFlag ? (
          <div
            className="w-36 h-36 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(52, 177, 228, 0.04)',
              border: '1px solid rgba(52, 177, 228, 0.15)',
            }}
          >
            <span className="text-7xl leading-none">{actor.country_flag}</span>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-background border-2 border-accent/40 flex items-center justify-center">
            <span className="text-accent text-xl font-display font-bold">
              {getInitials(actor.name)}
            </span>
          </div>
        )}

        {/* Name */}
        <h3 className="font-display text-xl font-bold text-foreground text-center leading-tight">
          {actor.name}
        </h3>

        {/* Seed badge */}
        <span className="text-xs text-accent/80 bg-accent/10 px-2 py-0.5 rounded-full">
          #{actor.seed} Seed
        </span>

        {/* Affiliation / Origin */}
        <div className="flex flex-col items-center gap-1 text-sm text-muted">
          {actor.affiliation && <span>{actor.affiliation}</span>}
          {actor.country_flag && !isEmojiFlag(actor.country_flag) && (
            <span className="text-xs text-dim">{actor.country_flag}</span>
          )}
        </div>

        {/* Intel Report */}
        {actor.intel_report_url && (
          <a
            href={actor.intel_report_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-accent-muted/30 border border-accent-muted/50 text-accent dark:text-blue-300 hover:bg-accent-muted/50 transition-colors"
          >
            <AudioIcon className="w-3 h-3" />
            {actor.notable_operations || 'View Intel'}
          </a>
        )}

        {/* Media Links */}
        {actor.media && actor.media.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-1">
            {actor.media.map((link, i) => (
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
          onSelect(actor);
        }
      }}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(actor);
        }
      }}
      className={`
        actor-bracket-card group flex items-center gap-2 px-3 py-2 rounded-md bg-background border
        transition-[color,background-color,border-color,box-shadow,opacity] duration-200
        ${isWinner
          ? 'is-winner border-l-[3px] border-l-champion border-t-champion/30 border-r-champion/30 border-b-champion/30 bg-champion/[0.08] text-champion'
          : 'border-transparent hover:border-accent-light/30 hover:bg-accent-light/[0.04]'
        }
        ${isEliminated ? 'is-eliminated opacity-40' : ''}
        ${onSelect ? 'cursor-pointer' : ''}
        ${isDraggable ? 'touch-none' : ''}
        ${className}
      `}
      style={dragStyle}
      {...rest}
    >
      <span className="text-[11px] text-accent-light/50 font-mono min-w-[2rem] shrink-0 tabular-nums">
        {actor.seed}
      </span>
      {showPhoto ? (
        <img
          src={actor.photo_url!}
          alt=""
          className="w-6 h-6 rounded-full object-cover shrink-0"
          onError={() => setImgError(true)}
        />
      ) : hasFlag ? (
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-sm leading-none"
          style={{
            background: 'rgba(52, 177, 228, 0.08)',
            border: '1px solid rgba(52, 177, 228, 0.15)',
          }}
          title={actor.affiliation ?? undefined}
        >
          {actor.country_flag}
        </span>
      ) : (
        <span className="w-6 h-6 rounded-full bg-surface-hover flex items-center justify-center shrink-0">
          <span className="text-[9px] font-bold text-muted">{getInitials(actor.name)}</span>
        </span>
      )}
      <span
        className={`text-sm font-semibold truncate tracking-wide ${
          isEliminated ? 'line-through text-dim/60' : isWinner ? 'text-champion' : 'text-foreground/90'
        } ${onSelect && !isEliminated ? 'group-hover:text-accent-light transition-colors' : ''}`}
      >
        {actor.name}
      </span>
      {actor.media && actor.media.length > 0 && (
        <span className="flex items-center gap-0.5 ml-auto shrink-0">
          {actor.media.slice(0, 3).map((link, i) => (
            <MediaIcon key={i} link={link} size="sm" />
          ))}
        </span>
      )}
    </div>
  );
}
