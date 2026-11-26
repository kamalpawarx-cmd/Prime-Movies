import React, { useState } from 'react';
import { Bell, CheckCheck, Play, RefreshCw } from 'lucide-react';
import {
  MediaItem,
  NotificationItem,
  NotificationPrefs,
} from '../types/media';
import {
  BrowserNotificationState,
  getBrowserNotificationState,
  requestBrowserNotificationPermission,
} from '../utils/notifications';
import { PosterImage } from './PosterImage';

interface AlertsViewProps {
  notifications: NotificationItem[];
  prefs: NotificationPrefs;
  recommendations: MediaItem[];
  catalog: MediaItem[];
  onUpdatePrefs: (patch: Partial<NotificationPrefs>) => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onTriggerTestEpisodePush: () => void;
  onTriggerRecommendationPush: () => void;
  onOpenTitle: (item: MediaItem) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  notifications,
  prefs,
  recommendations,
  catalog,
  onUpdatePrefs,
  onMarkAllRead,
  onMarkRead,
  onTriggerTestEpisodePush,
  onTriggerRecommendationPush,
  onOpenTitle,
}) => {
  const [browserPerm, setBrowserPerm] = useState<BrowserNotificationState>(
    getBrowserNotificationState()
  );

  const handleEnableBrowserPush = async () => {
    const result = await requestBrowserNotificationPermission();
    setBrowserPerm(result);
    if (result === 'granted') {
      onUpdatePrefs({ pushEnabled: true });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <section className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end" style={{ borderColor: 'var(--border-hairline)' }}>
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Release Radar &amp; Personalized Picks
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Push Notifications &amp; Recommendations
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Get notified the moment new web series or anime episodes drop, plus tailored picks based on your watchlist.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleEnableBrowserPush}
            className="flex min-h-[40px] items-center gap-1.5 rounded-lg px-4 text-xs font-semibold whitespace-nowrap"
            style={{
              backgroundColor: browserPerm === 'granted' ? 'var(--bg-elevated)' : 'var(--accent)',
              color: browserPerm === 'granted' ? 'var(--text-primary)' : 'var(--accent-fg)',
            }}
          >
            <Bell className="h-3.5 w-3.5" />
            <span>
              {browserPerm === 'granted'
                ? 'Browser Push Enabled'
                : browserPerm === 'denied'
                  ? 'Push Blocked (In-App Active)'
                  : 'Enable Push Notifications'}
            </span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3.5 text-xs font-medium whitespace-nowrap"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Preferences + Live Push Dispatch Controls */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div
          className="space-y-3 rounded-xl border p-4 lg:col-span-2"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold">
              Recent Alerts ({notifications.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onTriggerTestEpisodePush}
                className="min-h-[34px] rounded-lg border px-3 text-xs font-medium whitespace-nowrap"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                Simulate Episode Drop
              </button>
              <button
                type="button"
                onClick={onTriggerRecommendationPush}
                className="flex min-h-[34px] items-center gap-1 rounded-lg border px-3 text-xs font-medium whitespace-nowrap"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                <RefreshCw className="h-3 w-3" />
                <span>Send Recommendation</span>
              </button>
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
            {notifications.map((n) => {
              const targetItem = catalog.find((c) => c.id === n.mediaId);
              return (
                <div
                  key={n.id}
                  className="flex items-start justify-between gap-4 py-3.5"
                  style={{ opacity: n.read ? 0.72 : 1 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onMarkRead(n.id);
                      if (targetItem) onOpenTitle(targetItem);
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className="font-medium"
                        style={{ color: n.read ? 'var(--text-muted)' : 'var(--accent)' }}
                      >
                        {n.type === 'new-episode'
                          ? 'New Episode'
                          : n.type === 'recommendation'
                            ? 'Recommended'
                            : n.type === 'download'
                              ? 'Offline Ready'
                              : 'Friend Activity'}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>· {n.createdAt}</span>
                      {!n.read && (
                        <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                          · Unread
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-semibold">{n.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {n.body}
                    </p>
                  </button>

                  {targetItem && (
                    <button
                      type="button"
                      onClick={() => {
                        onMarkRead(n.id);
                        onOpenTitle(targetItem);
                      }}
                      className="flex min-h-[36px] shrink-0 items-center gap-1 rounded-lg border px-3 text-xs font-medium whitespace-nowrap"
                      style={{ borderColor: 'var(--border-strong)' }}
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Open</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Alert Preferences */}
        <aside
          className="h-fit space-y-3.5 rounded-xl border p-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <h2 className="font-display text-base font-semibold">Alert Channels</h2>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Choose which push alerts KinoLite sends to your browser and inbox.
          </p>

          {(
            [
              ['newEpisodes', 'New Episode Releases', 'Instant alerts for followed web series & anime'],
              ['recommendations', 'Personalized Picks', 'Weekly picks matched to your watchlist genres'],
              ['downloads', 'Offline Download Complete', 'Notify when compact AV1 downloads finish'],
              ['friendActivity', 'Friends Ratings & Activity', 'When friends rate or recommend a title'],
            ] as const
          ).map(([key, label, desc]) => (
            <label
              key={key}
              className="flex cursor-pointer items-start justify-between gap-3 border-t pt-3"
              style={{ borderColor: 'var(--border-hairline)' }}
            >
              <div>
                <p className="text-xs font-semibold">{label}</p>
                <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {desc}
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => onUpdatePrefs({ [key]: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-amber-500"
              />
            </label>
          ))}
        </aside>
      </div>

      {/* Personalized Recommendations Shelf */}
      <div className="space-y-4 border-t pt-6" style={{ borderColor: 'var(--border-hairline)' }}>
        <div>
          <h2 className="font-display text-lg font-semibold">Personalized For You</h2>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Curated dynamically from your watchlist genres, ratings, and low-data streaming preferences.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {recommendations.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenTitle(item)}
              className="group overflow-hidden rounded-xl border text-left transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
                borderRadius: 'var(--radius-card)',
              }}
            >
              <PosterImage
                src={item.posterUrl}
                alt={item.title}
                title={item.title}
                className="group-hover:scale-[1.03]"
              />
              <div className="p-3">
                <p className="font-display line-clamp-1 text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {item.genres[0]} · <span className="font-mono-tabular">{item.rating.toFixed(1)}</span> ·{' '}
                  <span className="font-mono-tabular">{item.mbPerHourAv1} MB/hr</span>
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
