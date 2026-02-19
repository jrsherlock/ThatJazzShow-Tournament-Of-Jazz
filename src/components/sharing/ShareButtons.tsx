'use client';

import { useCallback } from 'react';

interface ShareButtonsProps {
  bracketUrl: string;
  displayName: string;
  className?: string;
}

export function ShareButtons({ bracketUrl, displayName, className = '' }: ShareButtonsProps) {
  const getAbsoluteUrl = useCallback(() => {
    if (typeof window === 'undefined') return bracketUrl;
    return `${window.location.origin}${bracketUrl}`;
  }, [bracketUrl]);

  const handleFacebookShare = useCallback(() => {
    const url = getAbsoluteUrl();
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, 'facebook-share', 'width=580,height=400,menubar=no,toolbar=no');
  }, [getAbsoluteUrl]);

  const handleLinkedInShare = useCallback(() => {
    const url = getAbsoluteUrl();
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(shareUrl, 'linkedin-share', 'width=580,height=400,menubar=no,toolbar=no');
  }, [getAbsoluteUrl]);

  const handleDownloadImage = useCallback(async () => {
    try {
      // Build the OG image URL from the bracket URL
      const ogImagePath = `${bracketUrl}/opengraph-image`;
      const ogImageUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}${ogImagePath}`
          : ogImagePath;

      const response = await fetch(ogImageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `${displayName.replace(/[^a-zA-Z0-9]/g, '_')}_bracket.png`;
      document.body.appendChild(anchor);
      anchor.click();

      // Cleanup
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open the image in a new tab
      const ogImagePath = `${bracketUrl}/opengraph-image`;
      window.open(ogImagePath, '_blank');
    }
  }, [bracketUrl, displayName]);

  return (
    <div className={`rounded-xl bg-surface-hover border border-accent/20 p-5 ${className}`}>
      <p className="text-xs uppercase tracking-widest text-dim mb-4 text-center">
        Share Your Bracket
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {/* Facebook */}
        <button
          onClick={handleFacebookShare}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-lg border border-accent/40 text-accent hover:bg-accent hover:text-white transition-colors duration-200 text-sm font-medium"
          aria-label="Share on Facebook"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>Facebook</span>
        </button>

        {/* LinkedIn */}
        <button
          onClick={handleLinkedInShare}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-lg border border-accent/40 text-accent hover:bg-accent hover:text-white transition-colors duration-200 text-sm font-medium"
          aria-label="Share on LinkedIn"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          <span>LinkedIn</span>
        </button>

        {/* Download for Instagram */}
        <button
          onClick={handleDownloadImage}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-lg border border-accent/40 text-accent hover:bg-accent hover:text-white transition-colors duration-200 text-sm font-medium"
          aria-label="Download image for Instagram"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Download for Instagram</span>
        </button>
      </div>
    </div>
  );
}
