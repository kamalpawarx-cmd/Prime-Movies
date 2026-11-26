import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Heart,
  MessageSquare,
  Play,
  Send,
  Share2,
  Star,
  UserPlus,
} from 'lucide-react';
import {
  FriendProfile,
  MediaItem,
  SocialPost,
  UserProfile,
} from '../types/media';
import { PosterImage } from './PosterImage';

interface SocialViewProps {
  profile: UserProfile;
  friends: FriendProfile[];
  posts: SocialPost[];
  catalog: MediaItem[];
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  onAddFriend: (name: string, handle: string) => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onCreatePost: (item: MediaItem, stars: number, note: string) => void;
  onOpenTitle: (item: MediaItem) => void;
  onToggleWatchlist: (item: MediaItem) => void;
  onShareTitle: (item: MediaItem) => void;
}

export const SocialView: React.FC<SocialViewProps> = ({
  profile,
  friends,
  posts,
  catalog,
  onUpdateProfile,
  onAddFriend,
  onToggleLike,
  onAddComment,
  onCreatePost,
  onOpenTitle,
  onToggleWatchlist,
  onShareTitle,
}) => {
  const [filterHandle, setFilterHandle] = useState<string>('all');
  const [friendName, setFriendName] = useState('');
  const [friendHandle, setFriendHandle] = useState('');
  const [postMediaId, setPostMediaId] = useState(catalog[0]?.id ?? '');
  const [postStars, setPostStars] = useState(5);
  const [postNote, setPostNote] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [editingProfile, setEditingProfile] = useState(false);

  const visiblePosts = useMemo(() => {
    if (filterHandle === 'all') return posts;
    if (filterHandle === 'me') return posts.filter((p) => p.isCurrentUser);
    return posts.filter((p) => p.authorHandle === filterHandle);
  }, [posts, filterHandle]);

  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName.trim() || !friendHandle.trim()) return;
    const formattedHandle = friendHandle.trim().startsWith('@')
      ? friendHandle.trim()
      : `@${friendHandle.trim().toLowerCase().replace(/\s+/g, '')}`;
    onAddFriend(friendName.trim(), formattedHandle);
    setFriendName('');
    setFriendHandle('');
  };

  const handlePublishUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const target = catalog.find((c) => c.id === postMediaId);
    if (!target || !postNote.trim()) return;
    onCreatePost(target, postStars, postNote.trim());
    setPostNote('');
  };

  const handleCommentSubmit = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;
    onAddComment(postId, text);
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <section className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end" style={{ borderColor: 'var(--border-hairline)' }}>
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Friends Watch Activity &amp; Ratings
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Social Feed
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Share what you watch, post quick ratings, and discover movies, series, and anime from friends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdateProfile({ shareActivity: !profile.shareActivity })}
            className="min-h-[40px] rounded-lg border px-3.5 text-xs font-medium whitespace-nowrap"
            style={{
              borderColor: profile.shareActivity ? 'var(--accent)' : 'var(--border-strong)',
              backgroundColor: profile.shareActivity ? 'var(--accent-soft)' : 'transparent',
            }}
          >
            Activity Sharing: {profile.shareActivity ? 'Visible to Friends' : 'Private'}
          </button>
          <button
            type="button"
            onClick={() => setEditingProfile((v) => !v)}
            className="min-h-[40px] rounded-lg border px-3.5 text-xs font-medium whitespace-nowrap"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            {editingProfile ? 'Done' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Optional Profile Editor */}
      {editingProfile && (
        <div
          className="grid gap-3 rounded-xl border p-4 sm:grid-cols-3"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-hairline)' }}
        >
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Display Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => onUpdateProfile({ name: e.target.value })}
              className="min-h-[40px] w-full rounded-lg border px-3 text-sm"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Handle
            </label>
            <input
              type="text"
              value={profile.handle}
              onChange={(e) => onUpdateProfile({ handle: e.target.value })}
              className="min-h-[40px] w-full rounded-lg border px-3 text-sm"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Short Bio
            </label>
            <input
              type="text"
              value={profile.bio}
              onChange={(e) => onUpdateProfile({ bio: e.target.value })}
              className="min-h-[40px] w-full rounded-lg border px-3 text-sm"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Feed Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Share a Rating / Activity Form */}
          <form
            onSubmit={handlePublishUpdate}
            className="space-y-3 rounded-xl border p-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-sm font-semibold">
                Post Rating or Watch Update as {profile.name}
              </h2>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPostStars(n)}
                    className="p-1"
                    aria-label={`Rate ${n} stars`}
                  >
                    <Star
                      className="h-4 w-4"
                      style={{
                        color: n <= postStars ? 'var(--accent)' : 'var(--text-muted)',
                        fill: n <= postStars ? 'var(--accent)' : 'transparent',
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              <select
                value={postMediaId}
                onChange={(e) => setPostMediaId(e.target.value)}
                aria-label="Select title to rate"
                className="min-h-[42px] rounded-lg border px-3 text-xs font-medium"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                {catalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={postNote}
                onChange={(e) => setPostNote(e.target.value)}
                placeholder="Share your thoughts with friends..."
                className="min-h-[42px] rounded-lg border px-3 text-xs sm:col-span-2"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!postNote.trim()}
                className="flex min-h-[38px] items-center gap-1.5 rounded-lg px-4 text-xs font-semibold disabled:opacity-40"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                <Send className="h-3.5 w-3.5" />
                <span>Share to Feed</span>
              </button>
            </div>
          </form>

          {/* Feed Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterHandle('all')}
              className="min-h-[36px] rounded-lg px-3 text-xs font-medium transition-colors"
              style={{
                backgroundColor: filterHandle === 'all' ? 'var(--accent)' : 'var(--bg-elevated)',
                color: filterHandle === 'all' ? 'var(--accent-fg)' : 'var(--text-secondary)',
              }}
            >
              All Activity ({posts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterHandle('me')}
              className="min-h-[36px] rounded-lg px-3 text-xs font-medium transition-colors"
              style={{
                backgroundColor: filterHandle === 'me' ? 'var(--accent)' : 'var(--bg-elevated)',
                color: filterHandle === 'me' ? 'var(--accent-fg)' : 'var(--text-secondary)',
              }}
            >
              My Activity
            </button>
            {friends.map((fr) => (
              <button
                key={fr.id}
                type="button"
                onClick={() => setFilterHandle(fr.handle)}
                className="min-h-[36px] rounded-lg px-3 text-xs font-medium transition-colors"
                style={{
                  backgroundColor:
                    filterHandle === fr.handle ? 'var(--accent)' : 'var(--bg-elevated)',
                  color:
                    filterHandle === fr.handle ? 'var(--accent-fg)' : 'var(--text-secondary)',
                }}
              >
                {fr.name}
              </button>
            ))}
          </div>

          {/* Activity Cards */}
          <div className="space-y-4">
            {visiblePosts.map((post) => {
              const linkedMedia = catalog.find((c) => c.id === post.mediaId);
              return (
                <article
                  key={post.id}
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--accent)',
                      }}
                    >
                      {post.authorInitials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {post.authorName}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{post.authorHandle}</span>
                        <span style={{ color: 'var(--text-muted)' }}>·</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {post.actionType === 'rated'
                            ? 'rated'
                            : post.actionType === 'uploaded'
                              ? 'uploaded'
                              : post.actionType === 'watchlisted'
                                ? 'added to watchlist'
                                : 'watched'}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>· {post.createdAt}</span>
                      </div>

                      <div className="mt-3 flex gap-3.5">
                        <button
                          type="button"
                          onClick={() => linkedMedia && onOpenTitle(linkedMedia)}
                          className="w-16 shrink-0 overflow-hidden rounded-lg"
                        >
                          <PosterImage
                            src={post.mediaPosterUrl}
                            alt={post.mediaTitle}
                            title={post.mediaTitle}
                          />
                        </button>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => linkedMedia && onOpenTitle(linkedMedia)}
                            className="font-display text-left text-base font-semibold hover:underline"
                          >
                            {post.mediaTitle}
                          </button>

                          {typeof post.stars === 'number' && post.stars > 0 && (
                            <div className="mt-1 flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className="h-3.5 w-3.5"
                                  style={{
                                    color: s <= post.stars! ? 'var(--accent)' : 'var(--text-muted)',
                                    fill: s <= post.stars! ? 'var(--accent)' : 'transparent',
                                  }}
                                />
                              ))}
                              <span
                                className="font-mono-tabular ml-1.5 text-xs"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {post.stars}/5
                              </span>
                            </div>
                          )}

                          <p
                            className="mt-1.5 text-sm leading-relaxed"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {post.note}
                          </p>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t pt-3 text-xs" style={{ borderColor: 'var(--border-hairline)' }}>
                        <button
                          type="button"
                          onClick={() => onToggleLike(post.id)}
                          className="flex min-h-[34px] items-center gap-1.5 rounded-md px-2 transition-colors"
                          style={{
                            color: post.likedByMe ? 'var(--accent)' : 'var(--text-secondary)',
                          }}
                        >
                          <Heart
                            className="h-4 w-4"
                            style={{ fill: post.likedByMe ? 'var(--accent)' : 'transparent' }}
                          />
                          <span className="font-mono-tabular">{post.likes}</span>
                        </button>

                        <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                          <MessageSquare className="h-4 w-4" />
                          <span className="font-mono-tabular">{post.comments.length}</span>
                        </span>

                        {linkedMedia && (
                          <>
                            <button
                              type="button"
                              onClick={() => onOpenTitle(linkedMedia)}
                              className="flex min-h-[34px] items-center gap-1.5 rounded-md px-2 font-medium"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              <Play className="h-3.5 w-3.5 fill-current" />
                              <span>Watch</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleWatchlist(linkedMedia)}
                              className="flex min-h-[34px] items-center gap-1.5 rounded-md px-2"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              <Bookmark className="h-3.5 w-3.5" />
                              <span>Watchlist</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onShareTitle(linkedMedia)}
                              className="flex min-h-[34px] items-center gap-1.5 rounded-md px-2"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              <span>Share</span>
                            </button>
                          </>
                        )}
                      </div>

                      {/* Comments */}
                      {post.comments.length > 0 && (
                        <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: 'var(--border-hairline)' }}>
                          {post.comments.map((c) => (
                            <div key={c.id} className="text-xs">
                              <span className="font-semibold">{c.authorName}</span>{' '}
                              <span style={{ color: 'var(--text-secondary)' }}>{c.text}</span>{' '}
                              <span style={{ color: 'var(--text-muted)' }}>· {c.createdAt}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <form
                        onSubmit={(e) => handleCommentSubmit(post.id, e)}
                        className="mt-3 flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={commentDrafts[post.id] || ''}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          placeholder="Reply to friend..."
                          className="min-h-[36px] flex-1 rounded-lg border px-3 text-xs"
                          style={{
                            backgroundColor: 'var(--bg-canvas)',
                            borderColor: 'var(--border-hairline)',
                            color: 'var(--text-primary)',
                          }}
                        />
                        <button
                          type="submit"
                          disabled={!(commentDrafts[post.id] || '').trim()}
                          className="min-h-[36px] rounded-lg px-3 text-xs font-medium disabled:opacity-40"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          Reply
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Friends Sidebar */}
        <aside className="space-y-4">
          <div
            className="rounded-xl border p-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <h2 className="font-display text-base font-semibold">
              Friends ({friends.length})
            </h2>
            <div className="mt-3 divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {friends.map((fr) => (
                <div key={fr.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent)' }}
                    >
                      {fr.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{fr.name}</p>
                      <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                        {fr.handle} · {fr.watchedCount} watched
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilterHandle(fr.handle)}
                    className="text-xs font-medium hover:underline whitespace-nowrap"
                    style={{ color: 'var(--accent)' }}
                  >
                    Activity
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAddFriendSubmit}
              className="mt-4 space-y-2.5 border-t pt-4"
              style={{ borderColor: 'var(--border-hairline)' }}
            >
              <p className="text-xs font-semibold">Add a Friend</p>
              <input
                type="text"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                placeholder="Friend's name"
                className="min-h-[38px] w-full rounded-lg border px-3 text-xs"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
              <input
                type="text"
                value={friendHandle}
                onChange={(e) => setFriendHandle(e.target.value)}
                placeholder="@handle"
                className="min-h-[38px] w-full rounded-lg border px-3 text-xs"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="submit"
                disabled={!friendName.trim() || !friendHandle.trim()}
                className="flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add Friend</span>
              </button>
            </form>
          </div>
        </aside>
      </div>
    </section>
  );
};
