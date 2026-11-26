import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bookmark,
  Clapperboard,
  Download,
  Film,
  Gauge,
  Globe,
  Menu,
  Play,
  Plus,
  Puzzle,
  Search,
  Tv,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { AddonsView } from './components/AddonsView';
import { AlertsView } from './components/AlertsView';
import { DownloadsView } from './components/DownloadsView';
import { LanguagesView } from './components/LanguagesView';
import { PosterImage } from './components/PosterImage';
import { SearchOverlay } from './components/SearchOverlay';
import { ShareModal } from './components/ShareModal';
import { SocialView } from './components/SocialView';
import { TitleDetailModal } from './components/TitleDetailModal';
import { UploadModal } from './components/UploadModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { WatchlistView } from './components/WatchlistView';
import {
  ADDON_CATALOG_ITEMS,
  BUILTIN_SKINS,
  CORE_CATALOG,
  INITIAL_ADDONS,
  INITIAL_FRIENDS,
  INITIAL_LINKED_SITES,
  INITIAL_NOTIFICATIONS,
  INITIAL_SOCIAL_POSTS,
  QUALITY_PROFILES,
  SUPPORTED_LANGUAGES,
} from './data/catalog';
import {
  AddonSource,
  DataSaverSettings,
  DownloadItem,
  Episode,
  FriendProfile,
  LinkedSite,
  MediaCategory,
  MediaItem,
  NotificationItem,
  NotificationPrefs,
  QualityTierId,
  SkinPreset,
  SocialPost,
  UserProfile,
  UserRating,
  WatchlistEntry,
  WatchlistStatus,
} from './types/media';
import {
  createOfflinePlayableFallbackBlob,
  deleteBlobFromStore,
  saveBlobToStore,
} from './utils/mediaStorage';
import { sendBrowserPushNotification } from './utils/notifications';

type ActiveView =
  | 'movies'
  | 'webseries'
  | 'anime'
  | 'watchlist'
  | 'downloads'
  | 'languages'
  | 'social'
  | 'addons'
  | 'alerts';

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('movies');
  const [genreFilter, setGenreFilter] = useState<string>('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Persisted user states
  const [uploadedItems, setUploadedItems] = useState<MediaItem[]>(() =>
    readStorage('kinolite_uploads', [])
  );
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>(() =>
    readStorage('kinolite_watchlist', [
      {
        mediaId: 'mov-meridian-zero',
        status: 'watching',
        addedAt: '2026-11-20',
        progressSec: 1840,
        durationSec: 8040,
        notifyNewEpisodes: false,
      },
      {
        mediaId: 'ani-astral-crane',
        status: 'watching',
        addedAt: '2026-11-21',
        progressSec: 620,
        durationSec: 1440,
        lastEpisodeId: 'ac-e2',
        notifyNewEpisodes: true,
      },
      {
        mediaId: 'ser-severance-echoes',
        status: 'plan',
        addedAt: '2026-11-22',
        progressSec: 0,
        durationSec: 3240,
        notifyNewEpisodes: true,
      },
    ])
  );
  const [downloads, setDownloads] = useState<DownloadItem[]>(() =>
    readStorage('kinolite_downloads', [])
  );
  const [addons, setAddons] = useState<AddonSource[]>(() =>
    readStorage('kinolite_addons', INITIAL_ADDONS)
  );
  const [linkedSites, setLinkedSites] = useState<LinkedSite[]>(() =>
    readStorage('kinolite_linked_sites', INITIAL_LINKED_SITES)
  );
  const [customSkins, setCustomSkins] = useState<SkinPreset[]>(() =>
    readStorage('kinolite_custom_skins', [])
  );
  const [activeSkinId, setActiveSkinId] = useState<string>(() =>
    readStorage('kinolite_active_skin', 'obsidian')
  );
  const [ratings, setRatings] = useState<Record<string, UserRating>>(() =>
    readStorage('kinolite_ratings', {})
  );
  const [friends, setFriends] = useState<FriendProfile[]>(() =>
    readStorage('kinolite_friends', INITIAL_FRIENDS)
  );
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(() =>
    readStorage('kinolite_social_posts', INITIAL_SOCIAL_POSTS)
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    readStorage('kinolite_notifications', INITIAL_NOTIFICATIONS)
  );
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(() =>
    readStorage('kinolite_notif_prefs', {
      pushEnabled: true,
      newEpisodes: true,
      recommendations: true,
      downloads: true,
      friendActivity: true,
    })
  );
  const [profile, setProfile] = useState<UserProfile>(() =>
    readStorage('kinolite_profile', {
      name: 'Alex Rivera',
      handle: '@alexr',
      bio: 'Minimal cinema, anime, and low-data streaming.',
      shareActivity: true,
    })
  );
  const [dataSaver, setDataSaver] = useState<DataSaverSettings>(() =>
    readStorage('kinolite_data_saver', {
      defaultQuality: '720p-av1',
      wifiOnlyDownloads: true,
      autoDeleteWatchedDownloads: false,
      preloadThumbnailsOnly: true,
      sessionMbUsed: 18.4,
      sessionMbSaved: 92.6,
    })
  );
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    readStorage('kinolite_recent_searches', ['Sci-Fi', 'Kyoto', 'Anime'])
  );

  // Language preferences ("watch in any language")
  const [preferredAudioLang, setPreferredAudioLang] = useState<string>(() =>
    readStorage('kinolite_audio_lang', 'English')
  );
  const [preferredSubtitleLang, setPreferredSubtitleLang] = useState<string>(() =>
    readStorage('kinolite_sub_lang', 'English')
  );
  const [dualSubtitles, setDualSubtitles] = useState<boolean>(() =>
    readStorage('kinolite_dual_sub', false)
  );
  const [customLanguages, setCustomLanguages] = useState<string[]>(() =>
    readStorage('kinolite_custom_langs', [])
  );

  // Modals & Overlays
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [playerState, setPlayerState] = useState<{
    item: MediaItem;
    episode?: Episode;
    offlineKey?: string;
    initialTimeSec?: number;
    audioOverride?: string;
    subtitleOverride?: string;
  } | null>(null);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [uploadOpen, setUploadOpen] = useState<boolean>(false);
  const [shareItem, setShareItem] = useState<MediaItem | null>(null);
  const [toast, setToast] = useState<{ title: string; body?: string } | null>(null);

  const showToast = useCallback((title: string, body?: string) => {
    setToast({ title, body });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('kinolite_uploads', JSON.stringify(uploadedItems));
  }, [uploadedItems]);
  useEffect(() => {
    localStorage.setItem('kinolite_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);
  useEffect(() => {
    localStorage.setItem('kinolite_downloads', JSON.stringify(downloads));
  }, [downloads]);
  useEffect(() => {
    localStorage.setItem('kinolite_addons', JSON.stringify(addons));
  }, [addons]);
  useEffect(() => {
    localStorage.setItem('kinolite_linked_sites', JSON.stringify(linkedSites));
  }, [linkedSites]);
  useEffect(() => {
    localStorage.setItem('kinolite_custom_skins', JSON.stringify(customSkins));
  }, [customSkins]);
  useEffect(() => {
    localStorage.setItem('kinolite_active_skin', JSON.stringify(activeSkinId));
  }, [activeSkinId]);
  useEffect(() => {
    localStorage.setItem('kinolite_ratings', JSON.stringify(ratings));
  }, [ratings]);
  useEffect(() => {
    localStorage.setItem('kinolite_friends', JSON.stringify(friends));
  }, [friends]);
  useEffect(() => {
    localStorage.setItem('kinolite_social_posts', JSON.stringify(socialPosts));
  }, [socialPosts]);
  useEffect(() => {
    localStorage.setItem('kinolite_notifications', JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem('kinolite_notif_prefs', JSON.stringify(notifPrefs));
  }, [notifPrefs]);
  useEffect(() => {
    localStorage.setItem('kinolite_profile', JSON.stringify(profile));
  }, [profile]);
  useEffect(() => {
    localStorage.setItem('kinolite_data_saver', JSON.stringify(dataSaver));
  }, [dataSaver]);
  useEffect(() => {
    localStorage.setItem('kinolite_recent_searches', JSON.stringify(recentSearches));
  }, [recentSearches]);
  useEffect(() => {
    localStorage.setItem('kinolite_audio_lang', JSON.stringify(preferredAudioLang));
  }, [preferredAudioLang]);
  useEffect(() => {
    localStorage.setItem('kinolite_sub_lang', JSON.stringify(preferredSubtitleLang));
  }, [preferredSubtitleLang]);
  useEffect(() => {
    localStorage.setItem('kinolite_dual_sub', JSON.stringify(dualSubtitles));
  }, [dualSubtitles]);
  useEffect(() => {
    localStorage.setItem('kinolite_custom_langs', JSON.stringify(customLanguages));
  }, [customLanguages]);

  // Apply Active Skin (Built-in or Custom CSS custom properties)
  const allSkins = useMemo(() => [...BUILTIN_SKINS, ...customSkins], [customSkins]);
  useEffect(() => {
    const root = document.documentElement;
    const skin = allSkins.find((s) => s.id === activeSkinId) ?? BUILTIN_SKINS[0];
    if (skin.isCustom && skin.customVars) {
      root.setAttribute('data-skin', skin.mode === 'light' ? 'nordic' : 'obsidian');
      root.style.setProperty('--bg-canvas', skin.customVars.canvas);
      root.style.setProperty('--bg-surface', skin.customVars.surface);
      root.style.setProperty('--bg-elevated', skin.customVars.elevated);
      root.style.setProperty('--text-primary', skin.customVars.textPrimary);
      root.style.setProperty('--text-secondary', skin.customVars.textSecondary);
      root.style.setProperty('--accent', skin.customVars.accent);
      root.style.setProperty('--accent-fg', skin.customVars.accentFg);
      root.style.setProperty('--radius-card', skin.customVars.radiusCard);
    } else {
      root.removeAttribute('style');
      root.setAttribute('data-skin', skin.id);
    }
  }, [activeSkinId, allSkins]);

  // Global "/" shortcut for instant Search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        !playerState
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playerState]);

  // Combined live catalog: Core + Enabled Add-ons + User Uploads
  const fullCatalog = useMemo<MediaItem[]>(() => {
    const enabledAddonIds = new Set(addons.filter((a) => a.enabled).map((a) => a.id));
    const activeAddonTitles = ADDON_CATALOG_ITEMS.filter(
      (item) => item.sourceProviderId && enabledAddonIds.has(item.sourceProviderId)
    );
    return [...uploadedItems, ...CORE_CATALOG, ...activeAddonTitles];
  }, [addons, uploadedItems]);

  const availableLanguages = useMemo(
    () => [...SUPPORTED_LANGUAGES.map((l) => l.name), ...customLanguages],
    [customLanguages]
  );

  // Personalized recommendations derived from Watchlist & Ratings genres
  const personalizedRecommendations = useMemo(() => {
    const watchlistedIds = new Set(watchlist.map((w) => w.mediaId));
    const likedGenres = new Map<string, number>();

    watchlist.forEach((entry) => {
      const m = fullCatalog.find((c) => c.id === entry.mediaId);
      m?.genres.forEach((g) => likedGenres.set(g, (likedGenres.get(g) ?? 0) + 2));
    });
    Object.values(ratings).forEach((r) => {
      if (r.stars >= 4) {
        const m = fullCatalog.find((c) => c.id === r.mediaId);
        m?.genres.forEach((g) => likedGenres.set(g, (likedGenres.get(g) ?? 0) + 3));
      }
    });

    return [...fullCatalog]
      .sort((a, b) => {
        const scoreA =
          a.genres.reduce((s, g) => s + (likedGenres.get(g) ?? 0), 0) +
          a.rating -
          (watchlistedIds.has(a.id) ? 4 : 0);
        const scoreB =
          b.genres.reduce((s, g) => s + (likedGenres.get(g) ?? 0), 0) +
          b.rating -
          (watchlistedIds.has(b.id) ? 4 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }, [fullCatalog, watchlist, ratings]);

  // Category-filtered items for Movies / Web Series / Anime views
  const currentCategory: MediaCategory | null =
    activeView === 'movies'
      ? 'movie'
      : activeView === 'webseries'
        ? 'webseries'
        : activeView === 'anime'
          ? 'anime'
          : null;

  const categoryItems = useMemo(() => {
    if (!currentCategory) return [];
    return fullCatalog.filter((item) => item.category === currentCategory);
  }, [fullCatalog, currentCategory]);

  const categoryGenres = useMemo(() => {
    const set = new Set<string>(['All']);
    categoryItems.forEach((i) => i.genres.forEach((g) => set.add(g)));
    return Array.from(set);
  }, [categoryItems]);

  const filteredCategoryItems = useMemo(() => {
    if (genreFilter === 'All') return categoryItems;
    return categoryItems.filter((i) => i.genres.includes(genreFilter));
  }, [categoryItems, genreFilter]);

  const featuredHeroItem = useMemo(() => {
    return categoryItems.find((i) => i.featured) ?? categoryItems[0] ?? null;
  }, [categoryItems]);

  // Reset genre filter on tab switch
  useEffect(() => {
    setGenreFilter('All');
  }, [activeView]);

  // Push Notification Helper
  const pushAlert = useCallback(
    (item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => {
      const notif: NotificationItem = {
        ...item,
        id: `notif-${Date.now()}`,
        createdAt: 'Just now',
        read: false,
      };
      setNotifications((prev) => [notif, ...prev]);
      showToast(notif.title, notif.body);
      if (notifPrefs.pushEnabled) {
        sendBrowserPushNotification(notif.title, notif.body);
      }
    },
    [notifPrefs.pushEnabled, showToast]
  );

  // Handlers
  const handleUpdateWatchlist = useCallback(
    (item: MediaItem, status: WatchlistStatus | null) => {
      setWatchlist((prev) => {
        if (status === null) {
          showToast('Removed from Watchlist', item.title);
          return prev.filter((e) => e.mediaId !== item.id);
        }
        const existing = prev.find((e) => e.mediaId === item.id);
        if (existing) {
          showToast('Watchlist updated', `${item.title} moved to ${status}`);
          return prev.map((e) => (e.mediaId === item.id ? { ...e, status } : e));
        }
        showToast('Saved to Watchlist', item.title);
        return [
          {
            mediaId: item.id,
            status,
            addedAt: new Date().toISOString().slice(0, 10),
            progressSec: 0,
            durationSec: item.durationMin * 60,
            notifyNewEpisodes: Boolean(item.episodes?.length),
          },
          ...prev,
        ];
      });
    },
    [showToast]
  );

  const handleToggleWatchlistQuick = useCallback(
    (item: MediaItem) => {
      const exists = watchlist.some((w) => w.mediaId === item.id);
      handleUpdateWatchlist(item, exists ? null : 'plan');
    },
    [watchlist, handleUpdateWatchlist]
  );

  const handleToggleEpisodeAlerts = useCallback(
    (item: MediaItem) => {
      setWatchlist((prev) => {
        const existing = prev.find((w) => w.mediaId === item.id);
        if (existing) {
          const nextNotify = !existing.notifyNewEpisodes;
          showToast(
            nextNotify ? 'Episode alerts enabled' : 'Episode alerts paused',
            item.title
          );
          return prev.map((w) =>
            w.mediaId === item.id ? { ...w, notifyNewEpisodes: nextNotify } : w
          );
        }
        showToast('Following for new episodes', item.title);
        return [
          {
            mediaId: item.id,
            status: 'plan',
            addedAt: new Date().toISOString().slice(0, 10),
            progressSec: 0,
            durationSec: item.durationMin * 60,
            notifyNewEpisodes: true,
          },
          ...prev,
        ];
      });
    },
    [showToast]
  );

  const handleProgressUpdate = useCallback(
    (mediaId: string, timeSec: number, durationSec: number, episodeId?: string) => {
      setWatchlist((prev) => {
        const exists = prev.find((w) => w.mediaId === mediaId);
        const completed = durationSec > 0 && timeSec / durationSec > 0.92;
        if (exists) {
          return prev.map((w) =>
            w.mediaId === mediaId
              ? {
                  ...w,
                  progressSec: timeSec,
                  durationSec,
                  lastEpisodeId: episodeId ?? w.lastEpisodeId,
                  status: completed ? 'completed' : 'watching',
                }
              : w
          );
        }
        return [
          {
            mediaId,
            status: completed ? 'completed' : 'watching',
            addedAt: new Date().toISOString().slice(0, 10),
            progressSec: timeSec,
            durationSec,
            lastEpisodeId: episodeId,
            notifyNewEpisodes: Boolean(episodeId),
          },
          ...prev,
        ];
      });
    },
    []
  );

  const handleDataConsumed = useCallback((mbUsed: number, mbSaved: number) => {
    setDataSaver((prev) => ({
      ...prev,
      sessionMbUsed: prev.sessionMbUsed + mbUsed,
      sessionMbSaved: prev.sessionMbSaved + mbSaved,
    }));
  }, []);

  // Offline Download with real IndexedDB storage
  const handleStartDownload = useCallback(
    async (item: MediaItem, qualityId: QualityTierId, episode?: Episode) => {
      const dlId = episode ? `${item.id}:${episode.id}` : item.id;
      const profileQ = QUALITY_PROFILES.find((q) => q.id === qualityId) ?? QUALITY_PROFILES[1];
      const mins = episode ? episode.durationMin : item.durationMin;
      const estMb = Math.max(12, Math.round((mins / 60) * profileQ.mbPerHour));

      const initialRecord: DownloadItem = {
        id: dlId,
        mediaId: item.id,
        episodeId: episode?.id,
        title: item.title,
        episodeLabel: episode ? `S${episode.season}E${episode.number} · ${episode.title}` : undefined,
        category: item.category,
        posterUrl: item.posterUrl,
        qualityId,
        qualityLabel: profileQ.label,
        codec: profileQ.codec,
        estimatedMb: estMb,
        actualBytes: 0,
        progress: 12,
        status: 'downloading',
        downloadedAt: new Date().toISOString(),
        hasLocalBlob: false,
        fallbackStreamUrl: episode?.streamUrl || item.streamUrl,
      };

      setDownloads((prev) => [initialRecord, ...prev.filter((d) => d.id !== dlId)]);
      showToast('Download started', `${item.title} (${profileQ.label} · ~${estMb} MB)`);

      // Progress smoothly while storing an offline playable video package in IndexedDB
      const bump = (pct: number) =>
        setDownloads((prev) =>
          prev.map((d) => (d.id === dlId ? { ...d, progress: pct } : d))
        );

      try {
        setTimeout(() => bump(42), 350);
        const offlineBlob = await createOfflinePlayableFallbackBlob(
          item.title,
          episode ? `S${episode.season}E${episode.number} ${episode.title}` : profileQ.label
        );
        bump(78);

        let actualBytes = 0;
        let hasLocalBlob = false;
        if (offlineBlob) {
          await saveBlobToStore('downloads', dlId, offlineBlob);
          actualBytes = offlineBlob.size;
          hasLocalBlob = true;
        }

        setTimeout(() => {
          setDownloads((prev) =>
            prev.map((d) =>
              d.id === dlId
                ? { ...d, progress: 100, status: 'completed', actualBytes, hasLocalBlob }
                : d
            )
          );
          if (notifPrefs.downloads) {
            pushAlert({
              type: 'download',
              title: `Offline Ready: ${item.title}`,
              body: `${
                episode ? `Episode ${episode.number}` : 'Full movie'
              } saved in ${profileQ.label} (~${estMb} MB). Watch anytime with zero data.`,
              mediaId: item.id,
              episodeId: episode?.id,
            });
          }
        }, 450);
      } catch {
        setDownloads((prev) =>
          prev.map((d) => (d.id === dlId ? { ...d, progress: 100, status: 'completed' } : d))
        );
      }
    },
    [notifPrefs.downloads, pushAlert, showToast]
  );

  const handleDeleteDownload = useCallback(
    async (dlId: string) => {
      await deleteBlobFromStore('downloads', dlId);
      setDownloads((prev) => prev.filter((d) => d.id !== dlId));
      showToast('Offline copy deleted');
    },
    [showToast]
  );

  const handleSubmitRating = useCallback(
    (item: MediaItem, stars: number, review: string) => {
      setRatings((prev) => ({
        ...prev,
        [item.id]: {
          mediaId: item.id,
          stars,
          review,
          updatedAt: new Date().toISOString(),
        },
      }));

      if (profile.shareActivity) {
        const initials = profile.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        const post: SocialPost = {
          id: `post-${Date.now()}`,
          authorName: profile.name,
          authorHandle: profile.handle,
          authorInitials: initials || 'ME',
          isCurrentUser: true,
          actionType: 'rated',
          mediaId: item.id,
          mediaTitle: item.title,
          mediaCategory: item.category,
          mediaPosterUrl: item.posterUrl,
          stars,
          note: review || `Rated ${item.title} ${stars}/5 on KinoLite.`,
          createdAt: 'Just now',
          likes: 0,
          comments: [],
        };
        setSocialPosts((prev) => [post, ...prev]);
      }
      showToast(`Rated ${item.title} ${stars}/5`, profile.shareActivity ? 'Shared to Friends Feed' : 'Saved privately');
    },
    [profile, showToast]
  );

  const handleUploadedMovie = useCallback(
    (newItem: MediaItem) => {
      setUploadedItems((prev) => [newItem, ...prev]);
      if (newItem.category === 'movie') setActiveView('movies');
      if (newItem.category === 'webseries') setActiveView('webseries');
      if (newItem.category === 'anime') setActiveView('anime');

      if (profile.shareActivity) {
        const initials = profile.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        setSocialPosts((prev) => [
          {
            id: `post-${Date.now()}`,
            authorName: profile.name,
            authorHandle: profile.handle,
            authorInitials: initials || 'ME',
            isCurrentUser: true,
            actionType: 'uploaded',
            mediaId: newItem.id,
            mediaTitle: newItem.title,
            mediaCategory: newItem.category,
            mediaPosterUrl: newItem.posterUrl,
            note: `Uploaded "${newItem.title}" to KinoLite in ${newItem.audioLanguages[0]}.`,
            createdAt: 'Just now',
            likes: 0,
            comments: [],
          },
          ...prev,
        ]);
      }
      showToast('Upload published', `${newItem.title} is ready to watch`);
    },
    [profile, showToast]
  );

  const openPlayer = useCallback(
    (
      item: MediaItem,
      episode?: Episode,
      offlineKey?: string,
      audioOverride?: string,
      subtitleOverride?: string
    ) => {
      const entry = watchlist.find((w) => w.mediaId === item.id);
      setDetailItem(null);
      setPlayerState({
        item,
        episode: episode ?? item.episodes?.[0],
        offlineKey,
        initialTimeSec: entry?.progressSec ?? 0,
        audioOverride,
        subtitleOverride,
      });
    },
    [watchlist]
  );

  const unreadAlertsCount = notifications.filter((n) => !n.read).length;
  const activeQualityMeta =
    QUALITY_PROFILES.find((q) => q.id === dataSaver.defaultQuality) ?? QUALITY_PROFILES[1];

  return (
    <div
      className="min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Bar — Strict 3-Zone Contract on Desktop, Compact Minimal on Mobile */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          backgroundColor: 'var(--bg-overlay)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveView('movies')}
            className="font-display text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
            style={{ color: 'var(--text-primary)' }}
          >
            KinoLite
          </button>

          {/* Zone 2: Clean Single-Line Nav Links (Desktop) */}
          <nav
            aria-label="Utility navigation"
            className="hidden items-center gap-7 text-sm font-medium md:flex"
          >
            {(
              [
                ['languages', 'Languages'],
                ['social', 'Social'],
                ['addons', 'Add-ons'],
                ['alerts', unreadAlertsCount > 0 ? `Alerts (${unreadAlertsCount})` : 'Alerts'],
              ] as const
            ).map(([view, label]) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className="relative py-1 transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
                style={{
                  color:
                    activeView === view ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="py-1 transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              Search
            </button>
          </nav>

          {/* Zone 3: Single Primary Action (Desktop) / Compact Mobile Triggers */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="hidden min-h-[38px] items-center gap-1.5 rounded-lg px-4 text-xs font-semibold transition-opacity hover:opacity-90 md:inline-flex whitespace-nowrap shrink-0"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-fg)',
              }}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload</span>
            </button>

            {/* Mobile compact actions */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex min-h-[42px] min-w-[42px] items-center justify-center rounded-lg md:hidden"
              style={{ color: 'var(--text-primary)' }}
              aria-label="Search library"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex min-h-[42px] min-w-[42px] items-center justify-center rounded-lg md:hidden"
              style={{ color: 'var(--text-primary)' }}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer for Languages, Social, Add-ons, Alerts, Upload */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl border-t p-5 pb-8"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-base font-bold">More in KinoLite</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  ['languages', 'Languages', Globe],
                  ['social', 'Social Feed', Users],
                  ['addons', 'Add-ons & Skins', Puzzle],
                  ['alerts', `Alerts (${unreadAlertsCount})`, Bell],
                ] as const
              ).map(([view, label, Icon]) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => {
                    setActiveView(view);
                    setMobileMenuOpen(false);
                  }}
                  className="flex min-h-[48px] items-center gap-2.5 rounded-xl border px-3.5 text-sm font-medium"
                  style={{
                    backgroundColor: activeView === view ? 'var(--accent-soft)' : 'var(--bg-canvas)',
                    borderColor: activeView === view ? 'var(--accent)' : 'var(--border-hairline)',
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setUploadOpen(true);
              }}
              className="mt-3 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
            >
              <Upload className="h-4 w-4" />
              <span>Upload Movie or Episode</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="mx-auto max-w-7xl px-4 pt-6 pb-24 sm:px-6">
        {/* MOVIES / WEB SERIES / ANIME CATALOG VIEWS */}
        {currentCategory && (
          <div className="space-y-8">
            {/* Hero Feature Cinema Card */}
            {featuredHeroItem && (
              <section
                className="relative overflow-hidden rounded-2xl border"
                style={{
                  borderColor: 'var(--border-hairline)',
                  borderRadius: 'var(--radius-card)',
                }}
              >
                <div className="relative aspect-[16/10] w-full sm:aspect-[21/9]">
                  <PosterImage
                    src={featuredHeroItem.backdropUrl || featuredHeroItem.posterUrl}
                    alt={featuredHeroItem.title}
                    title={featuredHeroItem.title}
                    aspectClass="h-full w-full"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:max-w-2xl">
                    <p className="text-xs font-medium text-white/75">
                      Featured{' '}
                      {currentCategory === 'movie'
                        ? 'Movie'
                        : currentCategory === 'webseries'
                          ? 'Web Series'
                          : 'Anime'}{' '}
                      · {featuredHeroItem.year} · {featuredHeroItem.genres.join(' / ')} ·{' '}
                      <span className="font-mono-tabular">
                        {featuredHeroItem.rating.toFixed(1)}/10
                      </span>{' '}
                      ·{' '}
                      <span className="font-mono-tabular">
                        AV1 ~{featuredHeroItem.mbPerHourAv1} MB/hr
                      </span>
                    </p>
                    <h1
                      className="font-display mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl"
                      style={{ textWrap: 'balance' }}
                    >
                      {featuredHeroItem.title}
                    </h1>
                    <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/80">
                      {featuredHeroItem.synopsis}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => openPlayer(featuredHeroItem)}
                        className="flex min-h-[44px] items-center gap-2 rounded-lg px-5 text-sm font-semibold transition-opacity hover:opacity-95 whitespace-nowrap shrink-0"
                        style={{
                          backgroundColor: 'var(--accent)',
                          color: 'var(--accent-fg)',
                        }}
                      >
                        <Play className="h-4 w-4 fill-current" />
                        <span>Watch Now</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDetailItem(featuredHeroItem)}
                        className="flex min-h-[44px] items-center gap-2 rounded-lg border border-white/25 bg-black/40 px-4 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60 whitespace-nowrap shrink-0"
                      >
                        <span>Details &amp; Download</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleWatchlistQuick(featuredHeroItem)}
                        className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-white/20 bg-black/35 px-3.5 text-sm font-medium text-white/90 backdrop-blur-sm hover:bg-black/55 whitespace-nowrap shrink-0"
                      >
                        <Bookmark className="h-4 w-4" />
                        <span>
                          {watchlist.some((w) => w.mediaId === featuredHeroItem.id)
                            ? 'Saved'
                            : 'Watchlist'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Workspace Toolbar: Genre Filters + Quick Language & Low-Data Bar */}
            <div className="flex flex-col justify-between gap-3 border-b pb-4 lg:flex-row lg:items-center" style={{ borderColor: 'var(--border-hairline)' }}>
              <div className="flex flex-wrap items-center gap-1.5">
                {categoryGenres.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setGenreFilter(genre)}
                    className="min-h-[36px] rounded-lg px-3.5 text-xs font-medium transition-colors whitespace-nowrap"
                    style={{
                      backgroundColor:
                        genreFilter === genre ? 'var(--accent)' : 'var(--bg-elevated)',
                      color:
                        genreFilter === genre ? 'var(--accent-fg)' : 'var(--text-secondary)',
                    }}
                  >
                    {genre}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <button
                  type="button"
                  onClick={() => setActiveView('languages')}
                  className="inline-flex min-h-[36px] items-center gap-1.5 hover:underline whitespace-nowrap"
                >
                  <Globe className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                  <span>
                    Language: <strong style={{ color: 'var(--text-primary)' }}>{preferredAudioLang}</strong> / Sub:{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{preferredSubtitleLang}</strong>
                  </span>
                </button>

                <span aria-hidden="true">·</span>

                <button
                  type="button"
                  onClick={() => setActiveView('downloads')}
                  className="font-mono-tabular inline-flex min-h-[36px] items-center gap-1.5 hover:underline whitespace-nowrap"
                >
                  <Gauge className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                  <span>
                    {activeQualityMeta.label} ({activeQualityMeta.mbPerHour} MB/hr)
                  </span>
                </button>
              </div>
            </div>

            {/* Catalog Poster Grid */}
            <section className="space-y-4">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-xl font-bold">
                  {currentCategory === 'movie'
                    ? 'Movies'
                    : currentCategory === 'webseries'
                      ? 'Web Series'
                      : 'Anime'}
                </h2>
                <span className="font-mono-tabular text-xs" style={{ color: 'var(--text-muted)' }}>
                  {filteredCategoryItems.length} titles · Low-data AV1 ready
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredCategoryItems.map((item) => {
                  const isSaved = watchlist.some((w) => w.mediaId === item.id);
                  const isOffline = downloads.some(
                    (d) => d.mediaId === item.id && d.status === 'completed'
                  );
                  return (
                    <article
                      key={item.id}
                      className="group flex flex-col overflow-hidden rounded-xl border transition-transform duration-200"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-hairline)',
                        borderRadius: 'var(--radius-card)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setDetailItem(item)}
                        className="relative block w-full overflow-hidden text-left"
                      >
                        <PosterImage
                          src={item.posterUrl}
                          alt={item.title}
                          title={item.title}
                          className="group-hover:scale-[1.03]"
                        />
                      </button>

                      <div className="flex flex-1 flex-col justify-between p-3">
                        <div>
                          <button
                            type="button"
                            onClick={() => setDetailItem(item)}
                            className="font-display line-clamp-1 text-left text-sm font-semibold hover:underline"
                          >
                            {item.title}
                          </button>
                          <p
                            className="mt-1 line-clamp-1 text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {item.year} · {item.genres[0]} ·{' '}
                            <span className="font-mono-tabular">{item.rating.toFixed(1)}</span>
                          </p>
                          <p
                            className="font-mono-tabular mt-0.5 line-clamp-1 text-[11px]"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            ~{item.mbPerHourAv1} MB/hr
                            {isOffline ? ' · Offline' : ''}
                            {item.isUserUpload ? ' · Uploaded' : ''}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openPlayer(item)}
                            className="flex min-h-[36px] flex-1 items-center justify-center gap-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
                            style={{
                              backgroundColor: 'var(--accent)',
                              color: 'var(--accent-fg)',
                            }}
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>Watch</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleWatchlistQuick(item)}
                            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border transition-colors"
                            style={{
                              borderColor: isSaved ? 'var(--accent)' : 'var(--border-strong)',
                              color: isSaved ? 'var(--accent)' : 'var(--text-secondary)',
                            }}
                            aria-label={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}
                          >
                            {isSaved ? <Bookmark className="h-3.5 w-3.5 fill-current" /> : <Plus className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Personalized Picks Row below main grid */}
            <section className="space-y-4 border-t pt-7" style={{ borderColor: 'var(--border-hairline)' }}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-semibold">Recommended For You</h2>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Based on your watchlist, ratings, and {preferredAudioLang} language preference.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('addons')}
                  className="text-xs font-medium hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  Manage Add-ons &amp; Movie Box Links
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {personalizedRecommendations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDetailItem(item)}
                    className="group overflow-hidden rounded-xl border text-left"
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
                      <p className="font-display line-clamp-1 text-sm font-semibold">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {item.category === 'webseries'
                          ? 'Series'
                          : item.category === 'anime'
                            ? 'Anime'
                            : 'Movie'}{' '}
                        · {item.genres[0]}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* WATCHLIST TAB */}
        {activeView === 'watchlist' && (
          <WatchlistView
            entries={watchlist}
            catalog={fullCatalog}
            recommendations={personalizedRecommendations}
            onOpenTitle={setDetailItem}
            onPlayTitle={(item) => openPlayer(item)}
            onUpdateStatus={handleUpdateWatchlist}
          />
        )}

        {/* DOWNLOADS TAB */}
        {activeView === 'downloads' && (
          <DownloadsView
            downloads={downloads}
            dataSaver={dataSaver}
            onUpdateDataSaver={(patch) => setDataSaver((prev) => ({ ...prev, ...patch }))}
            onPlayOffline={(dl) => {
              const found = fullCatalog.find((c) => c.id === dl.mediaId);
              if (!found) return;
              const ep = dl.episodeId
                ? found.episodes?.find((e) => e.id === dl.episodeId)
                : undefined;
              openPlayer(found, ep, dl.hasLocalBlob ? dl.id : undefined);
            }}
            onDeleteDownload={handleDeleteDownload}
          />
        )}

        {/* LANGUAGES SECTION */}
        {activeView === 'languages' && (
          <LanguagesView
            catalog={fullCatalog}
            preferredAudioLang={preferredAudioLang}
            preferredSubtitleLang={preferredSubtitleLang}
            dualSubtitles={dualSubtitles}
            customLanguages={customLanguages}
            onChangeAudioLang={(lang) => {
              setPreferredAudioLang(lang);
              showToast('Audio language updated', `Now watching in ${lang}`);
            }}
            onChangeSubtitleLang={(lang) => {
              setPreferredSubtitleLang(lang);
              showToast('Subtitle language updated', lang);
            }}
            onToggleDualSubtitles={() => setDualSubtitles((d) => !d)}
            onAddCustomLanguage={(lang) => {
              if (!availableLanguages.includes(lang)) {
                setCustomLanguages((prev) => [...prev, lang]);
              }
              showToast('Language added', `${lang} is now available across all videos`);
            }}
            onOpenTitle={setDetailItem}
            onPlayWithLanguage={(item, audio, sub) => openPlayer(item, undefined, undefined, audio, sub)}
          />
        )}

        {/* SOCIAL FEED VIEW */}
        {activeView === 'social' && (
          <SocialView
            profile={profile}
            friends={friends}
            posts={socialPosts}
            catalog={fullCatalog}
            onUpdateProfile={(patch) => setProfile((prev) => ({ ...prev, ...patch }))}
            onAddFriend={(name, handle) => {
              const initials = name
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              setFriends((prev) => [
                {
                  id: `fr-${Date.now()}`,
                  name,
                  handle,
                  initials: initials || 'FR',
                  favoriteGenre: 'Cinema',
                  watchedCount: 12,
                  recentTitle: 'Meridian Zero',
                },
                ...prev,
              ]);
              showToast('Friend added', `${name} (${handle}) connected`);
            }}
            onToggleLike={(postId) =>
              setSocialPosts((prev) =>
                prev.map((p) =>
                  p.id === postId
                    ? {
                        ...p,
                        likedByMe: !p.likedByMe,
                        likes: p.likedByMe ? Math.max(0, p.likes - 1) : p.likes + 1,
                      }
                    : p
                )
              )
            }
            onAddComment={(postId, text) =>
              setSocialPosts((prev) =>
                prev.map((p) =>
                  p.id === postId
                    ? {
                        ...p,
                        comments: [
                          ...p.comments,
                          {
                            id: `c-${Date.now()}`,
                            authorName: profile.name,
                            authorHandle: profile.handle,
                            text,
                            createdAt: 'Just now',
                          },
                        ],
                      }
                    : p
                )
              )
            }
            onCreatePost={(item, stars, note) => handleSubmitRating(item, stars, note)}
            onOpenTitle={setDetailItem}
            onToggleWatchlist={handleToggleWatchlistQuick}
            onShareTitle={setShareItem}
          />
        )}

        {/* ADD-ONS, LINKED SITES (MOVIE BOX) & CUSTOM SKINS */}
        {activeView === 'addons' && (
          <AddonsView
            addons={addons}
            linkedSites={linkedSites}
            skins={allSkins}
            activeSkinId={activeSkinId}
            onToggleAddon={(id) => {
              setAddons((prev) =>
                prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
              );
              showToast('Add-on sources updated');
            }}
            onInstallAddon={(addon) => {
              setAddons((prev) => [addon, ...prev]);
              showToast('Add-on installed', `${addon.name} is now active`);
            }}
            onRemoveAddon={(id) => {
              setAddons((prev) => prev.filter((a) => a.id !== id));
              showToast('Add-on removed');
            }}
            onUpdateLinkedSite={(siteId, patch) => {
              setLinkedSites((prev) =>
                prev.map((s) => (s.id === siteId ? { ...s, ...patch } : s))
              );
              showToast(
                patch.linked ? 'Streaming site linked' : 'Streaming site unlinked'
              );
            }}
            onAddLinkedSite={(site) => {
              setLinkedSites((prev) => [site, ...prev]);
              showToast('Site linked', `${site.name} added to player sources`);
            }}
            onSelectSkin={(id) => {
              setActiveSkinId(id);
              const found = allSkins.find((s) => s.id === id);
              if (found) showToast('Skin applied', found.name);
            }}
            onCreateCustomSkin={(skin) => {
              setCustomSkins((prev) => [...prev, skin]);
              setActiveSkinId(skin.id);
              showToast('Custom skin applied', skin.name);
            }}
          />
        )}

        {/* PUSH NOTIFICATIONS & RECOMMENDATIONS VIEW */}
        {activeView === 'alerts' && (
          <AlertsView
            notifications={notifications}
            prefs={notifPrefs}
            recommendations={personalizedRecommendations}
            catalog={fullCatalog}
            onUpdatePrefs={(patch) => setNotifPrefs((prev) => ({ ...prev, ...patch }))}
            onMarkAllRead={() =>
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            }
            onMarkRead={(id) =>
              setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
              )
            }
            onTriggerTestEpisodePush={() =>
              pushAlert({
                type: 'new-episode',
                title: 'New Episode Dropped: Iron Lotus: 2099',
                body: 'Episode 3 "Foundry Ghost" is ready in 720p AV1 (61 MB). Tap to stream or save offline.',
                mediaId: 'ani-iron-lotus',
                episodeId: 'il-e3',
              })
            }
            onTriggerRecommendationPush={() => {
              const pick = personalizedRecommendations[0];
              if (!pick) return;
              pushAlert({
                type: 'recommendation',
                title: `Picked For You: ${pick.title}`,
                body: `Matched to your watchlist genres (${pick.genres.join(', ')}) · Streams in ${pick.mbPerHourAv1} MB/hr AV1.`,
                mediaId: pick.id,
              });
            }}
            onOpenTitle={setDetailItem}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation Tab Bar — Movies, Web Series, Anime, Watchlist, Downloads */}
      <nav
        aria-label="Primary categories"
        className="fixed right-0 bottom-0 left-0 z-30 border-t backdrop-blur-md pb-safe"
        style={{
          backgroundColor: 'var(--bg-overlay)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="mx-auto grid h-14 max-w-2xl grid-cols-5 items-center px-1">
          {(
            [
              ['movies', 'Movies', Film],
              ['webseries', 'Web Series', Tv],
              ['anime', 'Anime', Clapperboard],
              ['watchlist', 'Watchlist', Bookmark],
              ['downloads', 'Downloads', Download],
            ] as const
          ).map(([id, label, Icon]) => {
            const active = activeView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveView(id)}
                className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg transition-colors"
                style={{
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals & Overlays */}
      {detailItem && (
        <TitleDetailModal
          item={detailItem}
          watchlistEntry={watchlist.find((w) => w.mediaId === detailItem.id)}
          downloads={downloads}
          userRating={ratings[detailItem.id]}
          defaultQuality={dataSaver.defaultQuality}
          linkedSites={linkedSites}
          onClose={() => setDetailItem(null)}
          onPlay={(item, ep, offlineKey) => openPlayer(item, ep, offlineKey)}
          onUpdateWatchlist={handleUpdateWatchlist}
          onToggleEpisodeAlerts={handleToggleEpisodeAlerts}
          onDownload={handleStartDownload}
          onSubmitRating={handleSubmitRating}
          onShare={(item) => setShareItem(item)}
        />
      )}

      {playerState && (
        <VideoPlayerModal
          item={playerState.item}
          episode={playerState.episode}
          initialTimeSec={playerState.initialTimeSec}
          offlineBlobKey={playerState.offlineKey}
          defaultQuality={dataSaver.defaultQuality}
          preferredAudioLang={playerState.audioOverride || preferredAudioLang}
          preferredSubtitleLang={playerState.subtitleOverride || preferredSubtitleLang}
          dualSubtitles={dualSubtitles}
          availableLanguages={availableLanguages}
          addons={addons}
          linkedSites={linkedSites}
          isWatchlisted={watchlist.some((w) => w.mediaId === playerState.item.id)}
          userStars={ratings[playerState.item.id]?.stars}
          onClose={() => setPlayerState(null)}
          onProgressUpdate={handleProgressUpdate}
          onDataConsumed={handleDataConsumed}
          onSelectEpisode={(ep) =>
            setPlayerState((prev) => (prev ? { ...prev, episode: ep, initialTimeSec: 0 } : null))
          }
          onToggleWatchlist={handleToggleWatchlistQuick}
          onDownload={handleStartDownload}
          onQuickRate={(item, stars) => handleSubmitRating(item, stars, '')}
          onShare={(item) => setShareItem(item)}
          onChangePreferredLanguages={(audio, sub) => {
            setPreferredAudioLang(audio);
            setPreferredSubtitleLang(sub);
          }}
        />
      )}

      {searchOpen && (
        <SearchOverlay
          catalog={fullCatalog}
          recentSearches={recentSearches}
          onSaveSearch={(term) =>
            setRecentSearches((prev) => [term, ...prev.filter((t) => t !== term)].slice(0, 6))
          }
          onClose={() => setSearchOpen(false)}
          onOpenTitle={setDetailItem}
        />
      )}

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onUploaded={handleUploadedMovie}
        />
      )}

      {shareItem && (
        <ShareModal
          item={shareItem}
          userRating={ratings[shareItem.id]}
          onClose={() => setShareItem(null)}
          onPostToFriendsFeed={handleSubmitRating}
        />
      )}

      {/* Subtle Toast Feedback Banner */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 bottom-20 z-50 max-w-sm rounded-xl border px-4 py-3 shadow-xl backdrop-blur-md"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-strong)',
            color: 'var(--text-primary)',
          }}
        >
          <p className="text-xs font-semibold">{toast.title}</p>
          {toast.body && (
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {toast.body}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
