import {
  useEffect,
  useRef,
  useState,
} from "react";

import Avatar from "./Avatar";

function getBookmarkKey({
  id,
  name,
  handle,
  time,
  text,
  imageUrl,
}) {
  if (id !== undefined && id !== null) {
    return String(id);
  }

  return [
    name,
    handle,
    time,
    text,
    imageUrl,
  ]
    .filter(Boolean)
    .join("|");
}

function readBookmarks() {
  try {
    const raw = window.localStorage.getItem(
      "qyvra_bookmarks"
    );

    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function writeBookmarks(items) {
  try {
    window.localStorage.setItem(
      "qyvra_bookmarks",
      JSON.stringify(items)
    );
  } catch {
    // Ignore local storage failures.
  }

  window.dispatchEvent(
    new Event("qyvra:bookmark-changed")
  );
}

export default function Post({
  id,
  name,
  handle,
  avatarUrl = "",
  text,
  imageUrl = "",
  time = "2h",
  replies = 8,
  likes = 42,
  reposts = 0,
  onLike,
  onReply,
  onRepost,
}) {
  const [liked, setLiked] =
    useState(false);

  const [reposted, setReposted] =
    useState(false);

  const [shared, setShared] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [likePulse, setLikePulse] =
    useState(false);

  const [imageFailed, setImageFailed] =
    useState(false);

  const menuRef =
    useRef(null);

  const shareTimerRef =
    useRef(null);

  const likeTimerRef =
    useRef(null);

  const bookmarkKey = getBookmarkKey({
    id,
    name,
    handle,
    time,
    text,
    imageUrl,
  });

  const displayedLikes =
    likes + (liked ? 1 : 0);

  const displayedReposts =
    reposts + (reposted ? 1 : 0);

  useEffect(() => {
    function syncSavedState() {
      const bookmarks = readBookmarks();
      setSaved(
        bookmarks.some(
          (item) =>
            item.bookmarkKey === bookmarkKey
        )
      );
    }

    syncSavedState();

    window.addEventListener(
      "qyvra:bookmark-changed",
      syncSavedState
    );

    return () => {
      window.removeEventListener(
        "qyvra:bookmark-changed",
        syncSavedState
      );
    };
  }, [bookmarkKey]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener(
        "mousedown",
        handleOutsideClick
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [menuOpen]);

  useEffect(() => {
    return () => {
      if (shareTimerRef.current) {
        window.clearTimeout(
          shareTimerRef.current
        );
      }

      if (likeTimerRef.current) {
        window.clearTimeout(
          likeTimerRef.current
        );
      }
    };
  }, []);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  function handleLike() {
    setLiked((current) => {
      const next = !current;

      if (next) {
        setLikePulse(true);

        if (likeTimerRef.current) {
          window.clearTimeout(
            likeTimerRef.current
          );
        }

        likeTimerRef.current =
          window.setTimeout(() => {
            setLikePulse(false);
          }, 420);
      } else {
        setLikePulse(false);
      }

      if (onLike) {
        onLike(next);
      }

      return next;
    });
  }

  function handleDoubleClick() {
    if (!liked) {
      handleLike();
    }
  }

  function handleReply() {
    if (onReply) {
      onReply();
    }
  }

  function handleRepost() {
    setReposted((current) => {
      const next = !current;

      if (onRepost) {
        onRepost(next);
      }

      return next;
    });
  }

  function handleBookmark() {
    const current = readBookmarks();
    const alreadySaved = current.some(
      (item) =>
        item.bookmarkKey === bookmarkKey
    );

    if (alreadySaved) {
      writeBookmarks(
        current.filter(
          (item) =>
            item.bookmarkKey !== bookmarkKey
        )
      );
      return;
    }

    writeBookmarks([
      {
        bookmarkKey,
        name,
        handle,
        avatarUrl,
        text: text || "",
        imageUrl: imageUrl || "",
        time,
        replies: Number(replies || 0),
        likes: Number(likes || 0),
        reposts: Number(reposts || 0),
        savedAt: Date.now(),
      },
      ...current,
    ]);
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${name} on QYVRA`,
          text:
            text ||
            "Check out this post on QYVRA.",
          url: window.location.href,
        });

        showSharedState();
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          text || window.location.href
        );

        showSharedState();
      }
    } catch {
      setShared(false);
    }
  }

  function showSharedState() {
    setShared(true);

    if (shareTimerRef.current) {
      window.clearTimeout(
        shareTimerRef.current
      );
    }

    shareTimerRef.current =
      window.setTimeout(() => {
        setShared(false);
      }, 1600);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <article className="post-card">
      <Avatar
        name={name}
        src={avatarUrl || undefined}
      />

      <div className="post-body">
        <div className="post-meta">
          <strong>{name}</strong>
          <span>@{handle}</span>
          <span>·</span>
          <span>{time}</span>

          <div
            className="post-menu-wrap"
            ref={menuRef}
          >
            <button
              type="button"
              className="post-more"
              onClick={() =>
                setMenuOpen(
                  (current) => !current
                )
              }
              aria-label="Post options"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              ···
            </button>

            {menuOpen && (
              <div
                className="post-menu"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={closeMenu}
                >
                  Not interested
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={closeMenu}
                >
                  Mute @{handle}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={closeMenu}
                >
                  Report post
                </button>
              </div>
            )}
          </div>
        </div>

        {imageUrl && !imageFailed && (
          <div
            className="post-image"
            onDoubleClick={
              handleDoubleClick
            }
          >
            <img
              src={imageUrl}
              alt="Post attachment"
              loading="lazy"
              decoding="async"
              onError={() =>
                setImageFailed(true)
              }
            />
          </div>
        )}

        {imageUrl && imageFailed && (
          <div className="post-image-error">
            Image couldn't be loaded.
          </div>
        )}

        {text && (
          <p
            className="post-text"
            onDoubleClick={
              handleDoubleClick
            }
          >
            {text}
          </p>
        )}

        <div className="post-actions">
          <button
            type="button"
            className={
              liked
                ? `post-action ${
                    likePulse
                      ? "like-pulse"
                      : ""
                  } active`
                : "post-action"
            }
            onClick={handleLike}
            aria-label={
              liked
                ? "Unlike post"
                : "Like post"
            }
            aria-pressed={liked}
          >
            <span className="post-action-icon">
              {liked ? "♥" : "♡"}
            </span>
            <span>{displayedLikes}</span>
          </button>

          <button
            type="button"
            className="post-action"
            onClick={handleReply}
            aria-label="Reply to post"
          >
            <span className="post-action-icon">
              ○
            </span>
            <span>{replies}</span>
          </button>

          <button
            type="button"
            className={
              reposted
                ? "post-action active reposted"
                : "post-action"
            }
            onClick={handleRepost}
            aria-label={
              reposted
                ? "Undo repost"
                : "Repost"
            }
            aria-pressed={reposted}
          >
            <span className="post-action-icon">
              ↻
            </span>
            <span>{displayedReposts}</span>
          </button>

          <button
            type="button"
            className={
              shared
                ? "post-action shared"
                : "post-action"
            }
            onClick={handleShare}
            aria-label={
              shared
                ? "Shared"
                : "Share post"
            }
          >
            <span className="post-action-icon">
              {shared ? "✓" : "↗"}
            </span>
            <span>
              {shared ? "Shared" : "Share"}
            </span>
          </button>

          <button
            type="button"
            className={
              saved
                ? "post-action post-save-action saved"
                : "post-action post-save-action"
            }
            onClick={handleBookmark}
            aria-label={
              saved
                ? "Remove bookmark"
                : "Save post"
            }
            aria-pressed={saved}
          >
            <span className="post-action-icon">
              {saved ? "◆" : "◇"}
            </span>
            <span>{saved ? "Saved" : "Save"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
