export type MediaCategory = 'movie' | 'webseries' | 'anime';

export type QualityTierId = '480p-eco' | '720p-av1' | '1080p-hevc' | '4k-av1';

export interface QualityProfile {
  id: QualityTierId;
  label: string;
  resolution: string;
  codec: string;
  mbPerHour: number;
  savingsPercent: number;
  description: string;
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export interface Episode {
  id: string;
  season: number;
  number: number;
  title: string;
  durationMin: number;
  synopsis: string;
  streamUrl: string;
  releaseDate: string;
  isNew?: boolean;
}

export interface MediaSourceMirror {
  id: string;
  providerId: string;
  providerName: string;
  streamUrl: string;
  codec: string;
  qualityLabel: string;
  mbPerHour: number;
  kind: 'builtin' | 'addon' | 'linked-site' | 'upload';
}

export interface MediaItem {
  id: string;
  title: string;
  category: MediaCategory;
  year: number;
  genres: string[];
  rating: number;
  durationLabel: string;
  durationMin: number;
  synopsis: string;
  directorOrStudio: string;
  posterUrl: string;
  backdropUrl?: string;
  streamUrl: string;
  audioLanguages: string[];
  subtitles: string[];
  mbPerHourAv1: number;
  featured?: boolean;
  episodes?: Episode[];
  sourceProviderId?: string;
  sourceProviderName?: string;
  isUserUpload?: boolean;
  uploadedAt?: string;
  externalSiteUrl?: string;
  externalSiteName?: string;
}

export type WatchlistStatus = 'plan' | 'watching' | 'completed';

export interface WatchlistEntry {
  mediaId: string;
  status: WatchlistStatus;
  addedAt: string;
  progressSec: number;
  durationSec: number;
  lastEpisodeId?: string;
  notifyNewEpisodes: boolean;
}

export interface DownloadItem {
  id: string; // mediaId or `${mediaId}:${episodeId}`
  mediaId: string;
  episodeId?: string;
  title: string;
  episodeLabel?: string;
  category: MediaCategory;
  posterUrl: string;
  qualityId: QualityTierId;
  qualityLabel: string;
  codec: string;
  estimatedMb: number;
  actualBytes: number;
  progress: number; // 0..100
  status: 'downloading' | 'paused' | 'completed' | 'error';
  downloadedAt: string;
  hasLocalBlob: boolean;
  fallbackStreamUrl: string;
}

export interface AddonSource {
  id: string;
  name: string;
  author: string;
  version: string;
  manifestUrl: string;
  description: string;
  categories: MediaCategory[];
  codecSpecialty: string;
  enabled: boolean;
  isCustom?: boolean;
}

export interface LinkedSite {
  id: string;
  name: string;
  platformType: 'moviebox' | 'stremio' | 'jellyfin' | 'anilist' | 'custom';
  baseUrl: string;
  apiToken?: string;
  linked: boolean;
  lastSynced?: string;
  description: string;
  supportsDirectStream: boolean;
}

export interface SkinPreset {
  id: string;
  name: string;
  author: string;
  description: string;
  mode: 'dark' | 'light';
  swatches: [string, string, string];
  isCustom?: boolean;
  customVars?: {
    canvas: string;
    surface: string;
    elevated: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    accentFg: string;
    radiusCard: string;
  };
}

export interface UserRating {
  mediaId: string;
  stars: number; // 1..5
  review: string;
  updatedAt: string;
}

export interface SocialComment {
  id: string;
  authorName: string;
  authorHandle: string;
  text: string;
  createdAt: string;
}

export interface SocialPost {
  id: string;
  authorName: string;
  authorHandle: string;
  authorInitials: string;
  isCurrentUser?: boolean;
  actionType: 'rated' | 'watched' | 'watchlisted' | 'uploaded' | 'recommended';
  mediaId: string;
  mediaTitle: string;
  mediaCategory: MediaCategory;
  mediaPosterUrl: string;
  stars?: number;
  note: string;
  createdAt: string;
  likes: number;
  likedByMe?: boolean;
  comments: SocialComment[];
}

export interface FriendProfile {
  id: string;
  name: string;
  handle: string;
  initials: string;
  favoriteGenre: string;
  watchedCount: number;
  recentTitle: string;
}

export interface NotificationItem {
  id: string;
  type: 'new-episode' | 'recommendation' | 'download' | 'social';
  title: string;
  body: string;
  mediaId?: string;
  episodeId?: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationPrefs {
  pushEnabled: boolean;
  newEpisodes: boolean;
  recommendations: boolean;
  downloads: boolean;
  friendActivity: boolean;
}

export interface UserProfile {
  name: string;
  handle: string;
  bio: string;
  shareActivity: boolean;
}

export interface DataSaverSettings {
  defaultQuality: QualityTierId;
  wifiOnlyDownloads: boolean;
  autoDeleteWatchedDownloads: boolean;
  preloadThumbnailsOnly: boolean;
  sessionMbUsed: number;
  sessionMbSaved: number;
}
