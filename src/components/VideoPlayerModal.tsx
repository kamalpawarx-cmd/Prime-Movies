import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Check,
  Download,
  ExternalLink,
  Gauge,
  Globe,
  ListVideo,
  Maximize2,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Share2,
  Star,
  Subtitles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  QUALITY_PROFILES,
  STANDARD_H264_MB_PER_HOUR,
  SUBTITLE_TRACKS,
} from '../data/catalog';
import {
  AddonSource,
  Episode,
  LinkedSite,
  MediaItem,
  QualityTierId,
} from '../types/media';
import { getBlobFromStore } from '../utils/mediaStorage';

interface VideoPlayerModalProps {
  item: MediaItem;
  episode?: Episode;
  initialTimeSec?: number;
  offlineBlobKey?: string;
  defaultQuality: QualityTierId;
  preferredAudioLang: string;
  preferredSubtitleLang: string;
  dualSubtitles: boolean;
  availableLanguages: string[];
  addons: AddonSource[];
  linkedSites: LinkedSite[];
  isWatchlisted: boolean;
  userStars?: number;
  onClose: () => void;
  onProgressUpdate: (mediaId: string, timeSec: number, durationSec: number, episodeId?: string) => void;
  onDataConsumed: (mbUsed: number, mbSaved: number) => void;
  onSelectEpisode: (episode: Episode) => void;
  onToggleWatchlist: (item: MediaItem) => void;
  onDownload: (item: MediaItem, qualityId: QualityTierId, episode?: Episode) => void;
  onQuickRate: (item: MediaItem, stars: number) => void;
  onShare: (item: MediaItem) => void;
  onChangePreferredLanguages: (audioLang: string, subtitleLang: string) => void;
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  item,
  episode,
  initialTimeSec = 0,
  offlineBlobKey,
  defaultQuality,
  preferredAudioLang,
  preferredSubtitleLang,
  dualSubtitles,
  availableLanguages,
  addons,
  linkedSites,
  isWatchlisted,
  userStars = 0,
  onClose,
  onProgressUpdate,
  onDataConsumed,
  onSelectEpisode,
  onToggleWatchlist,
  onDownload,
  onQuickRate,
  onShare,
  onChangePreferredLanguages,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [resolvedSrc, setResolvedSrc] = useState<string>(episode?.streamUrl || item.streamUrl);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(Boolean(offlineBlobKey));
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.9);
  const [currentTime, setCurrentTime] = useState<number>(initialTimeSec);
  const [duration, setDuration] = useState<number>(0);
  const [qualityId, setQualityId] = useState<QualityTierId>(defaultQuality);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [audioLang, setAudioLang] = useState<string>(preferredAudioLang);
  const [subtitleLang, setSubtitleLang] = useState<string>(preferredSubtitleLang);
  const [showDualSub, setShowDualSub] = useState<boolean>(dualSubtitles);
  const [activePanel, setActivePanel] = useState<'none' | 'quality' | 'sources' | 'episodes' | 'subtitles'>('none');
  const [sessionMb, setSessionMb] = useState<number>(0);
  const [sessionSavedMb, setSessionSavedMb] = useState<number>(0);
  const [selectedSourceLabel, setSelectedSourceLabel] = useState<string>(
    offlineBlobKey
      ? 'Offline Local Cache'
      : item.isUserUpload
        ? 'Your Uploaded File'
        : item.sourceProviderName || 'KinoLite AV1 Direct'
  );
  const [streamError, setStreamError] = useState<string | null>(null);
  const [hoverStar, setHoverStar] = useState<number>(0);

  const activeQuality = useMemo(
    () => QUALITY_PROFILES.find((q) => q.id === qualityId) ?? QUALITY_PROFILES[1],
    [qualityId]
  );

  // Build available playback sources (built-in + enabled add-ons + linked sites)
  const sourceOptions = useMemo(() => {
    const baseStream = episode?.streamUrl || item.streamUrl;
    const options: Array<{ id: string; label: string; meta: string; url: string; externalUrl?: string }> = [
      {
        id: 'primary',
        label: item.isUserUpload ? 'Local Uploaded File' : item.sourceProviderName || 'KinoLite AV1 Direct',
        meta: `${activeQuality.codec} · ${activeQuality.mbPerHour} MB/hr`,
        url: baseStream,
      },
    ];

    addons
      .filter((a) => a.enabled && a.categories.includes(item.category))
      .forEach((addon) => {
        options.push({
          id: addon.id,
          label: `${addon.name} (Add-on)`,
          meta: addon.codecSpecialty,
          url: baseStream,
        });
      });

    linkedSites
      .filter((s) => s.linked && s.supportsDirectStream)
      .forEach((site) => {
        options.push({
          id: site.id,
          label: `${site.name} (Linked Site)`,
          meta: `${site.baseUrl.replace(/^https?:\/\//, '')} · Low-Data Bridge`,
          url: baseStream,
          externalUrl: `${site.baseUrl.replace(/\/$/, '')}/search?q=${encodeURIComponent(item.title)}`,
        });
      });

    return options;
  }, [addons, linkedSites, item, episode, activeQuality]);

  // Resolve IndexedDB blob for offline downloads or user uploads
  useEffect(() => {
    let revokeUrl: string | null = null;
    let cancelled = false;

    async function loadSource() {
      setStreamError(null);

      if (offlineBlobKey) {
        const blob = await getBlobFromStore('downloads', offlineBlobKey);
        if (!cancelled && blob) {
          revokeUrl = URL.createObjectURL(blob);
          setResolvedSrc(revokeUrl);
          setIsOfflineMode(true);
          setSelectedSourceLabel('Offline Local Cache (0 MB network)');
          return;
        }
      }

      if (item.isUserUpload && item.streamUrl.startsWith('idb-upload:')) {
        const key = item.streamUrl.replace('idb-upload:', '');
        const blob = await getBlobFromStore('uploads', key);
        if (!cancelled && blob) {
          revokeUrl = URL.createObjectURL(blob);
          setResolvedSrc(revokeUrl);
          setIsOfflineMode(true);
          setSelectedSourceLabel('Local Uploaded File (0 MB network)');
          return;
        }
      }

      if (!cancelled) {
        setIsOfflineMode(false);
        setResolvedSrc(episode?.streamUrl || item.streamUrl);
      }
    }

    loadSource();
    return () => {
      cancelled = true;
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
  }, [offlineBlobKey, item, episode]);

  // Keyboard shortcuts (Space, Left/Right, Esc, M, F)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' && videoRef.current) {
        e.preventDefault();
        if (videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      }
      if (e.key === 'ArrowRight' && videoRef.current) {
        videoRef.current.currentTime = Math.min(
          videoRef.current.duration || 0,
          videoRef.current.currentTime + 10
        );
      }
      if (e.key === 'ArrowLeft' && videoRef.current) {
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Real-time low-data bandwidth metering while playing
  useEffect(() => {
    if (!isPlaying || isOfflineMode) return;
    const interval = window.setInterval(() => {
      const mbPerSec = activeQuality.mbPerHour / 3600;
      const standardPerSec = STANDARD_H264_MB_PER_HOUR / 3600;
      const savedPerSec = Math.max(0, standardPerSec - mbPerSec);
      setSessionMb((prev) => prev + mbPerSec);
      setSessionSavedMb((prev) => prev + savedPerSec);
      onDataConsumed(mbPerSec, savedPerSec);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPlaying, isOfflineMode, activeQuality, onDataConsumed]);

  // Apply playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Active subtitle cue (with dual subtitle support and custom-language fallback)
  const activeSubtitle = useMemo(() => {
    if (subtitleLang === 'Off') return { primary: '', secondary: '' };
    const loopTime = currentTime % 50;
    const cues = SUBTITLE_TRACKS[subtitleLang];
    const englishCues = SUBTITLE_TRACKS.English;
    const engMatch = englishCues.find((c) => loopTime >= c.start && loopTime <= c.end)?.text ?? '';

    if (cues) {
      const match = cues.find((c) => loopTime >= c.start && loopTime <= c.end)?.text ?? '';
      return {
        primary: match,
        secondary: showDualSub && subtitleLang !== 'English' ? engMatch : '',
      };
    }

    return {
      primary: engMatch ? `[${subtitleLang}] ${engMatch}` : '',
      secondary: showDualSub ? engMatch : '',
    };
  }, [subtitleLang, showDualSub, currentTime]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  const seekBy = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  };

  const togglePiP = async () => {
    const v = videoRef.current;
    if (!v || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await v.requestPictureInPicture();
      }
    } catch {
      // PiP not allowed in this viewport
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`Playing ${item.title}`}
      ref={containerRef}
    >
      {/* Top Cinema Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-black/70 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display truncate text-base font-semibold text-white sm:text-lg">
              {item.title}
              {episode ? ` · S${episode.season}E${episode.number} ${episode.title}` : ''}
            </h2>
          </div>
          <p className="font-mono-tabular truncate text-xs text-white/65">
            {selectedSourceLabel} · Audio: {audioLang} · Sub: {subtitleLang} ·{' '}
            {activeQuality.label} ·{' '}
            {isOfflineMode
              ? 'Offline · 0.0 MB data'
              : `${sessionMb.toFixed(1)} MB used · ${sessionSavedMb.toFixed(1)} MB saved`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleWatchlist(item)}
            className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-white/90 transition-colors hover:bg-white/10 whitespace-nowrap shrink-0"
          >
            {isWatchlisted ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            <span className="hidden sm:inline">{isWatchlisted ? 'In Watchlist' : 'Watchlist'}</span>
          </button>

          {!isOfflineMode && (
            <button
              type="button"
              onClick={() => onDownload(item, qualityId, episode)}
              className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-white/90 transition-colors hover:bg-white/10 whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Save Offline</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onShare(item)}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-white/15 text-white/90 transition-colors hover:bg-white/10"
            aria-label="Share title with friends"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close player"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Video Stage */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={resolvedSrc}
          poster={item.backdropUrl || item.posterUrl}
          preload="metadata"
          autoPlay
          playsInline
          muted={isMuted}
          loop={isOfflineMode}
          onClick={togglePlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setDuration(v.duration || 0);
            if (initialTimeSec > 3 && initialTimeSec < (v.duration || 0) - 5) {
              v.currentTime = initialTimeSec;
            }
            v.volume = volume;
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            setCurrentTime(v.currentTime);
            if (Math.floor(v.currentTime) % 5 === 0) {
              onProgressUpdate(item.id, v.currentTime, v.duration || item.durationMin * 60, episode?.id);
            }
          }}
          onError={() => {
            setStreamError(
              'Stream source timed out or blocked by remote host. Try switching playback source below or saving offline.'
            );
            setIsPlaying(false);
          }}
          className="max-h-full w-full max-w-6xl cursor-pointer object-contain"
        />

        {/* Subtitle Overlay */}
        {activeSubtitle.primary && (
          <div className="pointer-events-none absolute bottom-8 left-1/2 max-w-2xl -translate-x-1/2 space-y-1 px-4 text-center">
            <span className="inline-block rounded-md bg-black/82 px-3.5 py-1.5 text-sm leading-relaxed font-medium text-white sm:text-base">
              {activeSubtitle.primary}
            </span>
            {activeSubtitle.secondary && (
              <div>
                <span className="inline-block rounded-md bg-black/70 px-3 py-1 text-xs text-white/80">
                  {activeSubtitle.secondary}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Stream Error Fallback */}
        {streamError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center">
            <p className="max-w-md text-sm text-white/85">{streamError}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setActivePanel('sources')}
                className="rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                Switch Source
              </button>
              <button
                type="button"
                onClick={() => {
                  setStreamError(null);
                  videoRef.current?.load();
                  videoRef.current?.play().catch(() => {});
                }}
                className="rounded-lg border border-white/20 px-4 py-2 text-xs font-medium text-white whitespace-nowrap"
              >
                Retry Stream
              </button>
            </div>
          </div>
        )}

        {/* Side / Overlay Settings Popover Panels */}
        {activePanel !== 'none' && (
          <div className="absolute right-4 bottom-4 z-20 max-h-[75%] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-white/15 bg-neutral-950/95 p-4 shadow-2xl backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-white">
                {activePanel === 'quality' && 'Data Saver & Quality'}
                {activePanel === 'sources' && 'Playback Sources'}
                {activePanel === 'episodes' && 'Episodes'}
                {activePanel === 'subtitles' && 'Audio, Subtitles & Speed'}
              </h3>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="rounded p-1 text-white/60 hover:text-white"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {activePanel === 'quality' && (
              <div className="space-y-2">
                {QUALITY_PROFILES.map((q) => {
                  const selected = q.id === qualityId;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setQualityId(q.id);
                        setActivePanel('none');
                      }}
                      className={`w-full rounded-lg border p-2.5 text-left transition-colors ${
                        selected
                          ? 'border-amber-400/70 bg-white/10'
                          : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-white">
                        <span>{q.label}</span>
                        <span className="font-mono-tabular text-white/75">{q.mbPerHour} MB/hr</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-white/60">
                        {q.codec} · Saves {q.savingsPercent}% vs H.264
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {activePanel === 'sources' && (
              <div className="space-y-2">
                {sourceOptions.map((src) => (
                  <div
                    key={src.id}
                    className="rounded-lg border border-white/10 p-2.5 transition-colors hover:bg-white/5"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setResolvedSrc(src.url);
                        setSelectedSourceLabel(src.label);
                        setStreamError(null);
                        setActivePanel('none');
                      }}
                      className="w-full text-left"
                    >
                      <div className="text-xs font-semibold text-white">{src.label}</div>
                      <div className="mt-0.5 text-[11px] text-white/60">{src.meta}</div>
                    </button>
                    {src.externalUrl && (
                      <a
                        href={src.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 hover:underline"
                      >
                        Open on linked site
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activePanel === 'episodes' && item.episodes && (
              <div className="space-y-2">
                {item.episodes.map((ep) => {
                  const isCurrent = episode?.id === ep.id;
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => {
                        onSelectEpisode(ep);
                        setActivePanel('none');
                      }}
                      className={`w-full rounded-lg border p-2.5 text-left transition-colors ${
                        isCurrent
                          ? 'border-amber-400/70 bg-white/10'
                          : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-white">
                        <span className="truncate">
                          E{ep.number}. {ep.title}
                        </span>
                        <span className="font-mono-tabular ml-2 shrink-0 text-white/60">
                          {ep.durationMin}m
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-white/60">{ep.synopsis}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {activePanel === 'subtitles' && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">
                    Audio Track Language
                  </label>
                  <select
                    value={audioLang}
                    onChange={(e) => {
                      setAudioLang(e.target.value);
                      onChangePreferredLanguages(e.target.value, subtitleLang);
                    }}
                    className="min-h-[38px] w-full rounded-lg border border-white/15 bg-black px-2.5 text-xs text-white"
                  >
                    <option value="Original Audio">Original Audio</option>
                    {availableLanguages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">
                    Subtitle Language
                  </label>
                  <select
                    value={subtitleLang}
                    onChange={(e) => {
                      setSubtitleLang(e.target.value);
                      onChangePreferredLanguages(audioLang, e.target.value);
                    }}
                    className="min-h-[38px] w-full rounded-lg border border-white/15 bg-black px-2.5 text-xs text-white"
                  >
                    <option value="Off">Off</option>
                    {availableLanguages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex cursor-pointer items-center justify-between text-xs text-white/80">
                  <span>Dual Subtitles (+ English)</span>
                  <input
                    type="checkbox"
                    checked={showDualSub}
                    onChange={(e) => setShowDualSub(e.target.checked)}
                    className="h-4 w-4 accent-amber-400"
                  />
                </label>

                <div>
                  <p className="mb-2 text-xs font-medium text-white/70">Playback Speed</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setPlaybackRate(rate)}
                        className={`font-mono-tabular rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                          playbackRate === rate
                            ? 'border-amber-400/70 bg-white/10 text-white'
                            : 'border-white/10 text-white/70 hover:bg-white/5'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls Dock */}
      <div className="border-t border-white/10 bg-black/85 px-4 pt-2.5 pb-4 sm:px-6">
        {/* Scrubber */}
        <div className="mb-2.5 flex items-center gap-3">
          <span className="font-mono-tabular w-11 text-right text-xs text-white/70">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={Math.min(currentTime, duration || 100)}
            onChange={(e) => {
              const next = Number(e.target.value);
              setCurrentTime(next);
              if (videoRef.current) videoRef.current.currentTime = next;
            }}
            aria-label="Seek video"
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-amber-400"
          />
          <span className="font-mono-tabular w-11 text-xs text-white/70">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Playback Left */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={togglePlay}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white text-black transition-transform active:scale-95"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
            </button>

            <button
              type="button"
              onClick={() => seekBy(-10)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => seekBy(10)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Forward 10 seconds"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            <div className="hidden items-center gap-2 pl-2 sm:flex">
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVolume(val);
                  setIsMuted(val === 0);
                  if (videoRef.current) videoRef.current.volume = val;
                }}
                aria-label="Volume"
                className="h-1 w-20 cursor-pointer accent-amber-400"
              />
            </div>

            {/* Quick Star Rating inline */}
            <div className="ml-2 hidden items-center gap-1 border-l border-white/15 pl-3 lg:flex">
              <span className="mr-1 text-xs text-white/60">Rate:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverStar(star)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => onQuickRate(item, star)}
                  className="p-1 text-amber-400 transition-transform hover:scale-110"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className={`h-4 w-4 ${
                      star <= (hoverStar || userStars) ? 'fill-amber-400 text-amber-400' : 'text-white/35'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Utility Right */}
          <div className="flex items-center gap-1.5">
            {item.episodes && item.episodes.length > 0 && (
              <button
                type="button"
                onClick={() => setActivePanel(activePanel === 'episodes' ? 'none' : 'episodes')}
                className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-white/90 hover:bg-white/10 whitespace-nowrap shrink-0"
              >
                <ListVideo className="h-4 w-4" />
                <span>Episodes</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActivePanel(activePanel === 'sources' ? 'none' : 'sources')}
              className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-white/90 hover:bg-white/10 whitespace-nowrap shrink-0"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Source</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePanel(activePanel === 'quality' ? 'none' : 'quality')}
              className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-white/90 hover:bg-white/10 whitespace-nowrap shrink-0"
            >
              <Gauge className="h-4 w-4" />
              <span className="font-mono-tabular">{activeQuality.resolution}</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePanel(activePanel === 'subtitles' ? 'none' : 'subtitles')}
              className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-white/90 hover:bg-white/10 whitespace-nowrap shrink-0"
              aria-label="Audio, subtitles, and playback speed"
            >
              <Subtitles className="h-4 w-4" />
              <span className="hidden md:inline">{subtitleLang === 'Off' ? 'Audio' : subtitleLang}</span>
            </button>

            <button
              type="button"
              onClick={togglePiP}
              className="hidden min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-white/15 text-white/90 hover:bg-white/10 sm:flex"
              aria-label="Picture in Picture"
            >
              <PictureInPicture2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-white/15 text-white/90 hover:bg-white/10"
              aria-label="Toggle fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
