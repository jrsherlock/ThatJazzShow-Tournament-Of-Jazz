'use client';

import { useState, useRef } from 'react';

interface CommentaryInputProps {
  matchupKey: string;
  value: string;
  onChange: (matchupKey: string, value: string) => void;
  maxLength?: number;
  className?: string;
}

export function CommentaryInput({
  matchupKey,
  value,
  onChange,
  maxLength = 280,
  className = '',
}: CommentaryInputProps) {
  const [isExpanded, setIsExpanded] = useState(value.length > 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleExpand() {
    setIsExpanded(true);
    // Focus the textarea after expansion renders
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function handleBlur() {
    if (value.trim().length === 0) {
      setIsExpanded(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(matchupKey, newValue);
    }
  }

  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className={`
          w-full text-left text-sm text-gray-500 hover:text-gold/70
          px-3 py-2 rounded-md border border-dashed border-gray-700
          hover:border-gold/30 transition-colors
          ${className}
        `}
      >
        Add commentary...
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Share your thoughts on this matchup..."
        maxLength={maxLength}
        rows={3}
        className="
          w-full resize-none rounded-md
          bg-[#0A0A0A] border border-gray-700
          focus:border-gold focus:ring-1 focus:ring-gold/30
          text-sm text-gray-200 placeholder-gray-600
          px-3 py-2 outline-none transition-colors
        "
      />
      <div className="flex justify-end mt-1">
        <span
          className={`text-xs ${
            value.length >= maxLength
              ? 'text-red-400'
              : value.length >= maxLength * 0.9
              ? 'text-yellow-500'
              : 'text-gray-600'
          }`}
        >
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
