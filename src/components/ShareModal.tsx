import React, { useState } from 'react';
import { Check, Copy, Send, Share2, X } from 'lucide-react';
import { MediaItem, UserRating } from '../types/media';
import { PosterImage } from './PosterImage';

interface ShareModalProps {
  item: MediaItem;
  userRating?: UserRating;
  onClose: () => void;
  onPostToFriendsFeed: (item: MediaItem, stars: number, note: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  item,
  userRating,
  onClose,
  onPostToFriendsFeed,
}) => {
  const [copied, setCopied] = useState(false);
  const [posted, setPosted] = useState(false);
  const [note, setNote] = useState(
    userRating?.review || `Watching ${item.title} (${item.year}) on KinoLite in low-data AV1.`
  );

  const shareText = `${item.title} (${item.year}) — ${
    userRating ? `Rated ${userRating.stars}/5★` : `${item.rating.toFixed(1)}/10`
  } · ${note}`;
  const shareUrl = `${window.location.origin}/?title=${encodeURIComponent(item.id)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `KinoLite · ${item.title}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or unavailable
      }
    }
    handleCopy();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Share ${item.title}`}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border p-5 sm:rounded-2xl sm:p-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Share with Friends</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border"
            style={{ borderColor: 'var(--border-strong)' }}
            aria-label="Close share modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Share Card Preview */}
        <div
          className="mt-4 flex gap-3.5 rounded-xl border p-3"
          style={{
            backgroundColor: 'var(--bg-canvas)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="w-16 shrink-0 overflow-hidden rounded-lg">
            <PosterImage src={item.posterUrl} alt={item.title} title={item.title} />
          </div>
          <div className="min-w-0">
            <p className="font-display truncate text-sm font-semibold">{item.title}</p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              {item.year} · {item.genres.join(' / ')} ·{' '}
              {userRating ? `Your Rating: ${userRating.stars}/5` : `${item.rating.toFixed(1)}/10`}
            </p>
            <p className="mt-1.5 line-clamp-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {note}
            </p>
          </div>
        </div>

        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-3 w-full rounded-lg border px-3 py-2 text-xs"
          style={{
            backgroundColor: 'var(--bg-canvas)',
            borderColor: 'var(--border-strong)',
            color: 'var(--text-primary)',
          }}
        />

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onPostToFriendsFeed(item, userRating?.stars ?? 5, note.trim());
              setPosted(true);
              setTimeout(onClose, 900);
            }}
            className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            {posted ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            <span>{posted ? 'Shared to Friends Feed' : 'Post to Friends Activity Feed'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border text-xs font-medium"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied Link' : 'Copy Invite Link'}</span>
            </button>
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border text-xs font-medium"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share Externally</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
