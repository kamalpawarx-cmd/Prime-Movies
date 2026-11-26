import React, { useEffect, useState } from 'react';
import {
  Download,
  Gauge,
  HardDrive,
  Play,
  Trash2,
  Wifi,
} from 'lucide-react';
import { QUALITY_PROFILES } from '../data/catalog';
import {
  DataSaverSettings,
  DownloadItem,
  QualityTierId,
} from '../types/media';
import { estimateStorageUsage } from '../utils/mediaStorage';
import { PosterImage } from './PosterImage';

interface DownloadsViewProps {
  downloads: DownloadItem[];
  dataSaver: DataSaverSettings;
  onUpdateDataSaver: (patch: Partial<DataSaverSettings>) => void;
  onPlayOffline: (dl: DownloadItem) => void;
  onDeleteDownload: (dlId: string) => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  downloads,
  dataSaver,
  onUpdateDataSaver,
  onPlayOffline,
  onDeleteDownload,
}) => {
  const [storage, setStorage] = useState<{ usedMb: number; quotaMb: number }>({
    usedMb: 0,
    quotaMb: 2048,
  });

  useEffect(() => {
    estimateStorageUsage().then(setStorage);
  }, [downloads.length]);

  const completedDownloads = downloads.filter((d) => d.status === 'completed');
  const activeDownloads = downloads.filter((d) => d.status !== 'completed');
  const totalEstimatedMb = completedDownloads.reduce((sum, d) => sum + d.estimatedMb, 0);

  return (
    <section className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end" style={{ borderColor: 'var(--border-hairline)' }}>
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Offline Vault &amp; Data Saver Engine
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Downloads &amp; Low-Data Control
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Watch saved movies, web series, and anime offline with zero mobile data usage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-mono-tabular">
            Offline titles: <strong style={{ color: 'var(--text-primary)' }}>{completedDownloads.length}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">
            Data saved this session:{' '}
            <strong style={{ color: 'var(--accent)' }}>
              {dataSaver.sessionMbSaved.toFixed(1)} MB
            </strong>
          </span>
        </div>
      </div>

      {/* Data Saver & Storage Controls Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <div
          className="rounded-xl border p-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Gauge className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <span>Default Stream Quality</span>
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            Lower data consumption with AV1 &amp; HEVC perceptual encoding.
          </p>
          <select
            value={dataSaver.defaultQuality}
            onChange={(e) =>
              onUpdateDataSaver({ defaultQuality: e.target.value as QualityTierId })
            }
            aria-label="Default streaming quality"
            className="mt-3 min-h-[42px] w-full rounded-lg border px-3 text-xs font-medium"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)',
            }}
          >
            {QUALITY_PROFILES.map((q) => (
              <option key={q.id} value={q.id}>
                {q.label} — {q.mbPerHour} MB/hr (Saves {q.savingsPercent}%)
              </option>
            ))}
          </select>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <HardDrive className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <span>Offline Storage</span>
          </div>
          <p className="font-mono-tabular mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {totalEstimatedMb} MB catalogued · {storage.usedMb} MB browser cache used
          </p>
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.max(4, (totalEstimatedMb / Math.max(512, storage.quotaMb)) * 100))}%`,
                backgroundColor: 'var(--accent)',
              }}
            />
          </div>
          <p className="font-mono-tabular mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Session used: {dataSaver.sessionMbUsed.toFixed(1)} MB · Saved vs H.264:{' '}
            {dataSaver.sessionMbSaved.toFixed(1)} MB
          </p>
        </div>

        <div
          className="space-y-2.5 rounded-xl border p-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Wifi className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <span>Network Preferences</span>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-2 text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>Download on Wi-Fi only</span>
            <input
              type="checkbox"
              checked={dataSaver.wifiOnlyDownloads}
              onChange={(e) => onUpdateDataSaver({ wifiOnlyDownloads: e.target.checked })}
              className="h-4 w-4 accent-amber-500"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-2 text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>Auto-delete watched downloads</span>
            <input
              type="checkbox"
              checked={dataSaver.autoDeleteWatchedDownloads}
              onChange={(e) =>
                onUpdateDataSaver({ autoDeleteWatchedDownloads: e.target.checked })
              }
              className="h-4 w-4 accent-amber-500"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-2 text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>Lite poster preload (Save data)</span>
            <input
              type="checkbox"
              checked={dataSaver.preloadThumbnailsOnly}
              onChange={(e) =>
                onUpdateDataSaver({ preloadThumbnailsOnly: e.target.checked })
              }
              className="h-4 w-4 accent-amber-500"
            />
          </label>
        </div>
      </div>

      {/* Active Downloads Queue */}
      {activeDownloads.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-base font-semibold">
            Downloading ({activeDownloads.length})
          </h2>
          {activeDownloads.map((dl) => (
            <div
              key={dl.id}
              className="flex items-center gap-4 rounded-xl border p-3.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <div className="w-12 shrink-0 overflow-hidden rounded-md">
                <PosterImage src={dl.posterUrl} alt={dl.title} title={dl.title} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {dl.title}
                  {dl.episodeLabel ? ` · ${dl.episodeLabel}` : ''}
                </p>
                <p className="font-mono-tabular mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {dl.qualityLabel} ({dl.codec}) · {dl.progress}% of ~{dl.estimatedMb} MB
                </p>
                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${dl.progress}%`, backgroundColor: 'var(--accent)' }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDeleteDownload(dl.id)}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border"
                style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}
                aria-label={`Cancel download ${dl.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Completed Offline Library */}
      <div className="space-y-3">
        <h2 className="font-display text-base font-semibold">
          Ready for Offline Viewing ({completedDownloads.length})
        </h2>

        {completedDownloads.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl border px-6 py-14 text-center"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <Download className="mb-3 h-7 w-7 opacity-45" />
            <p className="font-display text-base font-semibold">No offline downloads yet</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Open any movie, web series episode, or anime and tap Download to store a compact AV1 copy inside KinoLite for offline viewing.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {completedDownloads.map((dl) => (
              <div
                key={dl.id}
                className="flex items-center gap-4 rounded-xl border p-3.5"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div className="w-16 shrink-0 overflow-hidden rounded-lg">
                  <PosterImage src={dl.posterUrl} alt={dl.title} title={dl.title} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-display truncate text-sm font-semibold">{dl.title}</p>
                  {dl.episodeLabel && (
                    <p className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {dl.episodeLabel}
                    </p>
                  )}
                  <p className="font-mono-tabular mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {dl.qualityLabel} · ~{dl.estimatedMb} MB · Offline Ready
                  </p>

                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPlayOffline(dl)}
                      className="flex min-h-[36px] items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold whitespace-nowrap"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-fg)',
                      }}
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Play Offline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDownload(dl.id)}
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border"
                      style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}
                      aria-label={`Delete ${dl.title} offline download`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
