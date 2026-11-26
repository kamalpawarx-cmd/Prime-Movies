import React, { useState } from 'react';
import {
  Check,
  ExternalLink,
  Link2,
  Palette,
  Plus,
  Puzzle,
  Trash2,
  Unlink,
} from 'lucide-react';
import { AddonSource, LinkedSite, MediaCategory, SkinPreset } from '../types/media';

interface AddonsViewProps {
  addons: AddonSource[];
  linkedSites: LinkedSite[];
  skins: SkinPreset[];
  activeSkinId: string;
  onToggleAddon: (addonId: string) => void;
  onInstallAddon: (addon: AddonSource) => void;
  onRemoveAddon: (addonId: string) => void;
  onUpdateLinkedSite: (siteId: string, patch: Partial<LinkedSite>) => void;
  onAddLinkedSite: (site: LinkedSite) => void;
  onSelectSkin: (skinId: string) => void;
  onCreateCustomSkin: (skin: SkinPreset) => void;
}

export const AddonsView: React.FC<AddonsViewProps> = ({
  addons,
  linkedSites,
  skins,
  activeSkinId,
  onToggleAddon,
  onInstallAddon,
  onRemoveAddon,
  onUpdateLinkedSite,
  onAddLinkedSite,
  onSelectSkin,
  onCreateCustomSkin,
}) => {
  const [subTab, setSubTab] = useState<'sources' | 'sites' | 'skins'>('sources');

  // Install custom add-on form
  const [addonName, setAddonName] = useState('');
  const [addonUrl, setAddonUrl] = useState('');
  const [addonCategory, setAddonCategory] = useState<MediaCategory>('movie');
  const [addonCodec, setAddonCodec] = useState('AV1 720p · 160 MB/hr');

  // Link external site form (Movie Box etc.)
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [siteUrlDraft, setSiteUrlDraft] = useState('');
  const [siteTokenDraft, setSiteTokenDraft] = useState('');
  const [customSiteName, setCustomSiteName] = useState('');
  const [customSiteUrl, setCustomSiteUrl] = useState('');

  // Custom skin creator state
  const [skinName, setSkinName] = useState('');
  const [skinMode, setSkinMode] = useState<'dark' | 'light'>('dark');
  const [skinAccent, setSkinAccent] = useState('#d97706');
  const [skinRadius, setSkinRadius] = useState('12px');

  const handleInstallAddon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonName.trim() || !addonUrl.trim()) return;
    const newAddon: AddonSource = {
      id: `addon-custom-${Date.now()}`,
      name: addonName.trim(),
      author: 'Custom Manifest',
      version: '1.0.0',
      manifestUrl: addonUrl.trim(),
      description: 'User-installed third-party streaming source manifest.',
      categories: [addonCategory],
      codecSpecialty: addonCodec.trim() || 'AV1 Adaptive',
      enabled: true,
      isCustom: true,
    };
    onInstallAddon(newAddon);
    setAddonName('');
    setAddonUrl('');
  };

  const handleSaveSiteLink = (site: LinkedSite) => {
    const url = siteUrlDraft.trim() || site.baseUrl;
    onUpdateLinkedSite(site.id, {
      baseUrl: url,
      apiToken: siteTokenDraft.trim() || undefined,
      linked: true,
      lastSynced: 'Just now',
    });
    setEditingSiteId(null);
    setSiteUrlDraft('');
    setSiteTokenDraft('');
  };

  const handleAddCustomSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSiteName.trim() || !customSiteUrl.trim()) return;
    onAddLinkedSite({
      id: `site-custom-${Date.now()}`,
      name: customSiteName.trim(),
      platformType: 'custom',
      baseUrl: customSiteUrl.trim(),
      linked: true,
      lastSynced: 'Just now',
      description: 'Custom linked streaming site bridged directly into KinoLite’s playback source switcher.',
      supportsDirectStream: true,
    });
    setCustomSiteName('');
    setCustomSiteUrl('');
  };

  const handleSaveSkin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skinName.trim()) return;
    const isLight = skinMode === 'light';
    const skin: SkinPreset = {
      id: `custom-skin-${Date.now()}`,
      name: skinName.trim(),
      author: 'You',
      description: `Custom ${skinMode} interface skin with personalized accent & radius.`,
      mode: skinMode,
      swatches: [isLight ? '#f6f6f4' : '#0c0d10', isLight ? '#ffffff' : '#181a20', skinAccent],
      isCustom: true,
      customVars: {
        canvas: isLight ? '#f6f6f4' : '#0c0d10',
        surface: isLight ? '#ffffff' : '#15171c',
        elevated: isLight ? '#ecece7' : '#1e2129',
        textPrimary: isLight ? '#14161a' : '#f4f4f6',
        textSecondary: isLight ? '#4b505c' : '#a4a8b3',
        accent: skinAccent,
        accentFg: isLight ? '#ffffff' : '#0b0c0e',
        radiusCard: skinRadius,
      },
    };
    onCreateCustomSkin(skin);
    setSkinName('');
  };

  return (
    <section className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end" style={{ borderColor: 'var(--border-hairline)' }}>
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Modular Extensions &amp; Appearance
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Add-ons, Linked Sites &amp; Skins
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Plug in third-party streaming sources, link platforms like Movie Box, or switch custom interface skins.
          </p>
        </div>

        {/* Sub-tab Segmented Control */}
        <div className="inline-flex self-start rounded-lg p-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          <button
            type="button"
            onClick={() => setSubTab('sources')}
            className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap"
            style={{
              backgroundColor: subTab === 'sources' ? 'var(--accent)' : 'transparent',
              color: subTab === 'sources' ? 'var(--accent-fg)' : 'var(--text-secondary)',
            }}
          >
            <Puzzle className="h-3.5 w-3.5" />
            <span>Sources ({addons.filter((a) => a.enabled).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('sites')}
            className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap"
            style={{
              backgroundColor: subTab === 'sites' ? 'var(--accent)' : 'transparent',
              color: subTab === 'sites' ? 'var(--accent-fg)' : 'var(--text-secondary)',
            }}
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Linked Sites ({linkedSites.filter((s) => s.linked).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('skins')}
            className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap"
            style={{
              backgroundColor: subTab === 'skins' ? 'var(--accent)' : 'transparent',
              color: subTab === 'skins' ? 'var(--accent-fg)' : 'var(--text-secondary)',
            }}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Custom Skins</span>
          </button>
        </div>
      </div>

      {/* TAB 1: THIRD-PARTY STREAMING SOURCE ADD-ONS */}
      {subTab === 'sources' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {addons.map((addon) => (
              <div
                key={addon.id}
                className="flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-semibold">{addon.name}</h3>
                    <span className="font-mono-tabular text-xs" style={{ color: 'var(--text-muted)' }}>
                      v{addon.version} · {addon.author}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {addon.description}
                  </p>
                  <p className="font-mono-tabular mt-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {addon.codecSpecialty} · Categories: {addon.categories.join(', ')}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleAddon(addon.id)}
                    className="min-h-[40px] rounded-lg px-4 text-xs font-semibold transition-colors whitespace-nowrap"
                    style={{
                      backgroundColor: addon.enabled ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: addon.enabled ? 'var(--accent-fg)' : 'var(--text-primary)',
                    }}
                  >
                    {addon.enabled ? 'Enabled' : 'Enable Source'}
                  </button>
                  {addon.isCustom && (
                    <button
                      type="button"
                      onClick={() => onRemoveAddon(addon.id)}
                      className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border"
                      style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}
                      aria-label={`Remove ${addon.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Install Custom Manifest Form */}
          <form
            onSubmit={handleInstallAddon}
            className="h-fit space-y-3.5 rounded-xl border p-5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <h3 className="font-display text-base font-semibold">Install Add-on Manifest</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Add any community streaming manifest JSON URL to expand available mirrors and catalogs.
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Source Name
              </label>
              <input
                type="text"
                required
                value={addonName}
                onChange={(e) => setAddonName(e.target.value)}
                placeholder="e.g. CinemaFlux AV1"
                className="min-h-[40px] w-full rounded-lg border px-3 text-xs"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Manifest URL
              </label>
              <input
                type="url"
                required
                value={addonUrl}
                onChange={(e) => setAddonUrl(e.target.value)}
                placeholder="https://provider.example/manifest.json"
                className="min-h-[40px] w-full rounded-lg border px-3 text-xs"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Category
                </label>
                <select
                  value={addonCategory}
                  onChange={(e) => setAddonCategory(e.target.value as MediaCategory)}
                  className="min-h-[40px] w-full rounded-lg border px-2.5 text-xs"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="movie">Movies</option>
                  <option value="webseries">Web Series</option>
                  <option value="anime">Anime</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Codec Profile
                </label>
                <input
                  type="text"
                  value={addonCodec}
                  onChange={(e) => setAddonCodec(e.target.value)}
                  className="min-h-[40px] w-full rounded-lg border px-2.5 text-xs"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
            <button
              type="submit"
              className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
            >
              <Plus className="h-4 w-4" />
              <span>Install Add-on</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: LINK STREAMING SITES (MOVIE BOX, STREMIO, JELLYFIN, CUSTOM) */}
      {subTab === 'sites' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {linkedSites.map((site) => {
              const isEditing = editingSiteId === site.id;
              return (
                <div
                  key={site.id}
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: site.linked ? 'var(--accent)' : 'var(--border-hairline)',
                  }}
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-semibold">{site.name}</h3>
                        <span
                          className="text-xs font-medium"
                          style={{ color: site.linked ? 'var(--accent)' : 'var(--text-muted)' }}
                        >
                          · {site.linked ? `Linked (${site.lastSynced || 'Synced'})` : 'Not linked'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {site.description}
                      </p>
                      <p className="font-mono-tabular mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {site.baseUrl}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {site.linked ? (
                        <>
                          <a
                            href={site.baseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-h-[40px] items-center gap-1 rounded-lg border px-3 text-xs font-medium whitespace-nowrap"
                            style={{ borderColor: 'var(--border-strong)' }}
                          >
                            <span>Open</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => onUpdateLinkedSite(site.id, { linked: false })}
                            className="flex min-h-[40px] items-center gap-1 rounded-lg border px-3 text-xs font-medium whitespace-nowrap"
                            style={{ borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }}
                          >
                            <Unlink className="h-3.5 w-3.5" />
                            <span>Unlink</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSiteId(isEditing ? null : site.id);
                            setSiteUrlDraft(site.baseUrl);
                            setSiteTokenDraft(site.apiToken || '');
                          }}
                          className="min-h-[40px] rounded-lg px-4 text-xs font-semibold whitespace-nowrap"
                          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
                        >
                          {isEditing ? 'Cancel' : `Link ${site.name}`}
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'var(--border-hairline)' }}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                            Site / Server URL
                          </label>
                          <input
                            type="url"
                            value={siteUrlDraft}
                            onChange={(e) => setSiteUrlDraft(e.target.value)}
                            className="min-h-[40px] w-full rounded-lg border px-3 text-xs"
                            style={{
                              backgroundColor: 'var(--bg-canvas)',
                              borderColor: 'var(--border-strong)',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                            Session / API Token (Optional)
                          </label>
                          <input
                            type="password"
                            value={siteTokenDraft}
                            onChange={(e) => setSiteTokenDraft(e.target.value)}
                            placeholder="Optional account sync key"
                            className="min-h-[40px] w-full rounded-lg border px-3 text-xs"
                            style={{
                              backgroundColor: 'var(--bg-canvas)',
                              borderColor: 'var(--border-strong)',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveSiteLink(site)}
                        className="min-h-[40px] rounded-lg px-4 text-xs font-semibold"
                        style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
                      >
                        Connect &amp; Enable in Player
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Custom Streaming Site */}
          <form
            onSubmit={handleAddCustomSite}
            className="h-fit space-y-3.5 rounded-xl border p-5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <h3 className="font-display text-base font-semibold">Link Any Streaming Site</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Bridge Movie Box mirrors, personal media portals, or anime sites directly into KinoLite’s player source menu.
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Site Name
              </label>
              <input
                type="text"
                required
                value={customSiteName}
                onChange={(e) => setCustomSiteName(e.target.value)}
                placeholder="e.g. Movie Box Mirror"
                className="min-h-[40px] w-full rounded-lg border px-3 text-xs"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Portal URL
              </label>
              <input
                type="url"
                required
                value={customSiteUrl}
                onChange={(e) => setCustomSiteUrl(e.target.value)}
                placeholder="https://moviebox.example.com"
                className="min-h-[40px] w-full rounded-lg border px-3 text-xs"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <button
              type="submit"
              className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
            >
              <Link2 className="h-4 w-4" />
              <span>Link Site</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: CUSTOM SKINS */}
      {subTab === 'skins' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
            {skins.map((skin) => {
              const active = skin.id === activeSkinId;
              return (
                <button
                  key={skin.id}
                  type="button"
                  onClick={() => onSelectSkin(skin.id)}
                  className="flex flex-col justify-between rounded-xl border p-4 text-left transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: active ? 'var(--accent)' : 'var(--border-hairline)',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-base font-semibold">{skin.name}</h3>
                      {active && <Check className="h-4 w-4" style={{ color: 'var(--accent)' }} />}
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {skin.author} · {skin.mode === 'light' ? 'Light Surface' : 'Dark Surface'}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {skin.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {skin.swatches.map((hex, i) => (
                      <span
                        key={i}
                        className="h-5 w-8 rounded border"
                        style={{
                          backgroundColor: hex,
                          borderColor: 'var(--border-strong)',
                        }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Skin Builder */}
          <form
            onSubmit={handleSaveSkin}
            className="h-fit space-y-4 rounded-xl border p-5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <h3 className="font-display text-base font-semibold">Create Custom Skin</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Build and apply your own minimal interface skin instantly.
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Skin Name
              </label>
              <input
                type="text"
                required
                value={skinName}
                onChange={(e) => setSkinName(e.target.value)}
                placeholder="e.g. Velvet Sand"
                className="min-h-[40px] w-full rounded-lg border px-3 text-xs"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Base Mode
                </label>
                <select
                  value={skinMode}
                  onChange={(e) => setSkinMode(e.target.value as 'dark' | 'light')}
                  className="min-h-[40px] w-full rounded-lg border px-2.5 text-xs"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="dark">Dark Cinema</option>
                  <option value="light">Light Paper</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={skinAccent}
                    onChange={(e) => setSkinAccent(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded border bg-transparent p-1"
                    style={{ borderColor: 'var(--border-strong)' }}
                  />
                  <span className="font-mono-tabular text-xs" style={{ color: 'var(--text-muted)' }}>
                    {skinAccent}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Card Corner Radius
              </label>
              <select
                value={skinRadius}
                onChange={(e) => setSkinRadius(e.target.value)}
                className="min-h-[40px] w-full rounded-lg border px-2.5 text-xs"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="6px">Sharp (6px)</option>
                <option value="12px">Balanced (12px)</option>
                <option value="18px">Soft (18px)</option>
              </select>
            </div>

            <button
              type="submit"
              className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
            >
              <Palette className="h-4 w-4" />
              <span>Save &amp; Apply Skin</span>
            </button>
          </form>
        </div>
      )}
    </section>
  );
};
