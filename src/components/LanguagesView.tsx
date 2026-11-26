import React, { useMemo, useState } from 'react';
import { Check, Globe, Languages, Play, Plus, Search, Subtitles, Volume2 } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../data/catalog';
import { MediaItem } from '../types/media';
import { PosterImage } from './PosterImage';

interface LanguagesViewProps {
  catalog: MediaItem[];
  preferredAudioLang: string;
  preferredSubtitleLang: string;
  dualSubtitles: boolean;
  customLanguages: string[];
  onChangeAudioLang: (lang: string) => void;
  onChangeSubtitleLang: (lang: string) => void;
  onToggleDualSubtitles: () => void;
  onAddCustomLanguage: (lang: string) => void;
  onOpenTitle: (item: MediaItem) => void;
  onPlayWithLanguage: (item: MediaItem, audioLang: string, subtitleLang: string) => void;
}

export const LanguagesView: React.FC<LanguagesViewProps> = ({
  catalog,
  preferredAudioLang,
  preferredSubtitleLang,
  dualSubtitles,
  customLanguages,
  onChangeAudioLang,
  onChangeSubtitleLang,
  onToggleDualSubtitles,
  onAddCustomLanguage,
  onOpenTitle,
  onPlayWithLanguage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrowseLang, setSelectedBrowseLang] = useState<string>(preferredAudioLang);
  const [newLangInput, setNewLangInput] = useState('');

  const allLanguages = useMemo(() => {
    const customs = customLanguages.map((name) => ({
      code: name.slice(0, 2).toLowerCase(),
      name,
      nativeName: name,
      region: 'Custom Language',
      audioSupported: true,
      subtitleSupported: true,
    }));
    return [...SUPPORTED_LANGUAGES, ...customs];
  }, [customLanguages]);

  const filteredLanguages = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allLanguages;
    return allLanguages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.region.toLowerCase().includes(q)
    );
  }, [allLanguages, searchTerm]);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newLangInput.trim();
    if (!cleaned) return;
    onAddCustomLanguage(cleaned);
    setSelectedBrowseLang(cleaned);
    onChangeAudioLang(cleaned);
    onChangeSubtitleLang(cleaned);
    setNewLangInput('');
  };

  return (
    <section className="space-y-8 pb-8">
      {/* Header & Active Playback Language Summary */}
      <div className="flex flex-col justify-between gap-4 border-b pb-6 md:flex-row md:items-end" style={{ borderColor: 'var(--border-hairline)' }}>
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Multi-Audio Dubs &amp; Instant Subtitles
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Watch in Any Language
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Choose your preferred audio track and subtitle language globally, or add any custom language.
            Every movie, web series, and anime automatically launches in your selected language.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span>
            Audio:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{preferredAudioLang}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Subtitles:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{preferredSubtitleLang}</strong>
          </span>
        </div>
      </div>

      {/* Global Audio & Subtitle Preferences Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <div
          className="rounded-xl border p-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Volume2 className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <span>Preferred Audio Track</span>
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            Applied automatically when playing movies, series, and anime.
          </p>
          <select
            value={preferredAudioLang}
            onChange={(e) => {
              onChangeAudioLang(e.target.value);
              setSelectedBrowseLang(e.target.value);
            }}
            aria-label="Preferred audio language"
            className="mt-3 min-h-[42px] w-full rounded-lg border px-3 text-sm"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="Original Audio">Original Audio (Native)</option>
            {allLanguages.map((l) => (
              <option key={l.name} value={l.name}>
                {l.name} ({l.nativeName})
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
            <Subtitles className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <span>Preferred Subtitles</span>
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            Lightweight soft-subtitles (~40 KB/hr) for zero extra data cost.
          </p>
          <select
            value={preferredSubtitleLang}
            onChange={(e) => onChangeSubtitleLang(e.target.value)}
            aria-label="Preferred subtitle language"
            className="mt-3 min-h-[42px] w-full rounded-lg border px-3 text-sm"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="Off">Off</option>
            {allLanguages.map((l) => (
              <option key={l.name} value={l.name}>
                {l.name} ({l.nativeName})
              </option>
            ))}
          </select>
        </div>

        <div
          className="flex flex-col justify-between rounded-xl border p-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Languages className="h-4 w-4" style={{ color: 'var(--accent)' }} />
              <span>Dual Subtitles Mode</span>
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              Display your selected language alongside English captions while watching.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleDualSubtitles}
            className="mt-3 flex min-h-[42px] w-full items-center justify-between rounded-lg border px-3.5 text-sm font-medium transition-colors"
            style={{
              borderColor: dualSubtitles ? 'var(--accent)' : 'var(--border-strong)',
              backgroundColor: dualSubtitles ? 'var(--accent-soft)' : 'var(--bg-canvas)',
              color: 'var(--text-primary)',
            }}
          >
            <span>{dualSubtitles ? 'Dual Subtitles Enabled' : 'Enable Dual Subtitles'}</span>
            {dualSubtitles && <Check className="h-4 w-4" style={{ color: 'var(--accent)' }} />}
          </button>
        </div>
      </div>

      {/* Browse & Select Any Language Grid + Custom Language Creator */}
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="font-display text-lg font-semibold">
            Select a Language ({allLanguages.length} Ready)
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search any language..."
                className="min-h-[40px] w-full rounded-lg border pr-3 pl-9 text-xs"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <form onSubmit={handleAddCustom} className="flex items-center gap-1.5">
              <input
                type="text"
                value={newLangInput}
                onChange={(e) => setNewLangInput(e.target.value)}
                placeholder="Add any other language..."
                className="min-h-[40px] w-44 rounded-lg border px-3 text-xs"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="submit"
                disabled={!newLangInput.trim()}
                className="flex min-h-[40px] items-center gap-1 rounded-lg px-3 text-xs font-semibold disabled:opacity-40 whitespace-nowrap shrink-0"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-fg)',
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {filteredLanguages.map((lang) => {
            const isSelected = selectedBrowseLang === lang.name;
            return (
              <button
                key={lang.name}
                type="button"
                onClick={() => {
                  setSelectedBrowseLang(lang.name);
                  onChangeAudioLang(lang.name);
                  onChangeSubtitleLang(lang.name);
                }}
                className="flex min-h-[68px] flex-col justify-between rounded-xl border p-3.5 text-left transition-colors"
                style={{
                  backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--bg-surface)',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border-hairline)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-semibold">{lang.nativeName}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />}
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {lang.name} · {lang.region}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ready to Stream in Selected Language */}
      <div className="space-y-4 border-t pt-6" style={{ borderColor: 'var(--border-hairline)' }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Available in {selectedBrowseLang}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Multi-track audio dubs and soft subtitles ready for low-data streaming ({catalog.length} titles)
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Globe className="h-3.5 w-3.5" />
            <span>Auto-applies {selectedBrowseLang} audio &amp; subtitles</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {catalog.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-xl border transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
                borderRadius: 'var(--radius-card)',
              }}
            >
              <button
                type="button"
                onClick={() => onOpenTitle(item)}
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
                    onClick={() => onOpenTitle(item)}
                    className="font-display line-clamp-1 text-left text-sm font-semibold hover:underline"
                  >
                    {item.title}
                  </button>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {item.year} · {item.category === 'webseries' ? 'Series' : item.category === 'anime' ? 'Anime' : 'Movie'} · {selectedBrowseLang}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onPlayWithLanguage(item, selectedBrowseLang, preferredSubtitleLang === 'Off' ? selectedBrowseLang : preferredSubtitleLang)
                  }
                  className="mt-3 flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-fg)',
                  }}
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Watch in {selectedBrowseLang}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
