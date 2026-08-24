import { useEffect, useMemo, useState } from "react";

import PageIntro from "../components/PageIntro";
import Composer from "../components/Composer";
import Post from "../components/Post";
import { supabase } from "../lib/supabase";

function formatTime(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);
  const now = new Date();

  const difference =
    now.getTime() - date.getTime();

  const minutes = Math.floor(
    difference / 60000
  );

  if (minutes < 1) {
    return "now";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days < 7) {
    return `${days}d`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
    }
  );
}

function normalizePost(post) {
  const profile = post.profiles;

  return {
    id: post.id,

    name:
      profile?.display_name ||
      profile?.username ||
      "User",

    handle:
      profile?.username ||
      "user",

    avatarUrl:
      profile?.avatar_url ||
      "",

    text:
      post.content ||
      "",

    time:
      formatTime(post.created_at),

    likes:
      post.likes_count || 0,

    replies:
      post.replies_count || 0,

    reposts:
      post.reposts_count || 0,

    createdAt:
      post.created_at,

    authorId:
      post.author_id,
  };
}

export default function Home({ onCreate }) {
  const [posts, setPosts] = useState([]);

  const [feedMode, setFeedMode] =
    useState("For you");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    function handleCreatedPost(event) {
      const createdPost =
        event.detail;

      if (!createdPost) {
        return;
      }

      setPosts((current) => [
        createdPost,
        ...current,
      ]);
    }

    window.addEventListener(
      "social:post-created",
      handleCreatedPost
    );

    return () => {
      window.removeEventListener(
        "social:post-created",
        handleCreatedPost
      );
    };
  }, []);

  async function loadPosts() {
    setLoading(true);
    setError("");

    try {
      const {
        data,
        error: postsError,
      } = await supabase
        .from("posts")
        .select(
          `
            id,
            author_id,
            content,
            created_at,
            likes_count,
            replies_count,
            reposts_count,
            profiles (
              username,
              display_name,
              avatar_url
            )
          `
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(50);

      if (postsError) {
        throw postsError;
      }

      setPosts(
        (data || []).map(normalizePost)
      );
    } catch (err) {
      console.error(
        "Feed loading failed:",
        err
      );

      setPosts([]);

      setError(
        "We couldn't load the feed right now."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(id) {
    /*
     * Real likes will be connected to the
     * likes table next.
     *
     * For now we reload instead of pretending
     * the interaction succeeded locally.
     */

    await loadPosts();
  }

  async function handleReply(id) {
    /*
     * Real replies will be connected to the
     * replies table next.
     */

    await loadPosts();
  }

  async function handleRepost(id) {
    /*
     * Real reposts will be connected next.
     */

    await loadPosts();
  }

  const visiblePosts = useMemo(() => {
    const result = [...posts];

    if (feedMode === "Fresh") {
      return result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
    }

    if (feedMode === "Popular") {
      return result.sort(
        (a, b) =>
          b.likes +
          b.replies +
          b.reposts -
          (a.likes +
            a.replies +
            a.reposts)
      );
    }

    return result;
  }, [posts, feedMode]);

  return (
    <>
      <PageIntro
        title="Your space."
        description="People, ideas and conversations you actually care about."
      />

      <div className="feed-switcher">
        {[
          "For you",
          "Fresh",
          "Popular",
        ].map((mode) => (
          <button
            type="button"
            key={mode}
            className={
              feedMode === mode
                ? "feed-switch active"
                : "feed-switch"
            }
            onClick={() =>
              setFeedMode(mode)
            }
          >
            {mode}
          </button>
        ))}

        <button
          type="button"
          className="feed-refresh"
          onClick={loadPosts}
          disabled={loading}
          aria-label="Refresh feed"
        >
          {loading ? "..." : "↻"}
        </button>
      </div>

      <Composer
        onCreate={onCreate}
      />

      {error && (
        <div className="feed-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadPosts}
          >
            Try again
          </button>
        </div>
      )}

      <div className="feed">
        {loading ? (
          <div className="feed-loading">
            <span />
            <span />
            <span />
          </div>
        ) : visiblePosts.length > 0 ? (
          visiblePosts.map((post) => (
            <Post
              key={post.id}
              {...post}
              onLike={() =>
                handleLike(post.id)
              }
              onReply={() =>
                handleReply(post.id)
              }
              onRepost={() =>
                handleRepost(post.id)
              }
            />
          ))
        ) : (
          <div className="feed-empty">
            <strong>
              Your feed is quiet.
            </strong>

            <span>
              Be the first person to say
              something.
            </span>

            <button
              type="button"
              onClick={onCreate}
            >
              Create a post
            </button>
          </div>
        )}
      </div>
    </>
  );
}