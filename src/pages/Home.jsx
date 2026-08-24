import { useCallback, useEffect, useMemo, useState } from "react";
import PageIntro from "../components/PageIntro";
import Composer from "../components/Composer";
import Post from "../components/Post";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

function getDisplayName(user) {
  return (
    user?.user_metadata?.display_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User"
  );
}

function getUsername(user) {
  return (
    user?.user_metadata?.username ||
    user?.email?.split("@")[0] ||
    "user"
  );
}

function getRelativeTime(dateString) {
  if (!dateString) {
    return "now";
  }

  const created = new Date(dateString);
  const now = new Date();

  const seconds = Math.floor((now - created) / 1000);

  if (seconds < 60) {
    return "now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d`;
  }

  return created.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function normalizePost(row, user) {
  const isCurrentUser = row.author_id === user?.id;

  return {
    id: row.id,
    name: isCurrentUser ? getDisplayName(user) : "User",
    handle: isCurrentUser ? getUsername(user) : "user",
    text: row.content,
    time: getRelativeTime(row.created_at),
    likes: row.likes_count ?? 0,
    replies: row.replies_count ?? 0,
    reposts: row.reposts_count ?? 0,
    authorId: row.author_id,
    createdAt: row.created_at,
  };
}

export default function Home() {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [feedMode, setFeedMode] = useState("For you");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (fetchError) {
      console.error("Failed to load posts:", fetchError);
      setError(fetchError.message);
      setPosts([]);
      setLoading(false);
      return;
    }

    setPosts(
      (data || []).map((row) =>
        normalizePost(row, user)
      )
    );

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    loadPosts();
  }, [user, loadPosts]);

  async function handleCreatePost(text) {
    const cleanText = text.trim();

    if (!cleanText || !user || creating) {
      return;
    }

    setCreating(true);
    setError("");

    const { data, error: insertError } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        content: cleanText,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create post:", insertError);
      setError(insertError.message);
      setCreating(false);
      return;
    }

    const newPost = normalizePost(data, user);

    setPosts((current) => [
      newPost,
      ...current,
    ]);

    setCreating(false);
  }

  async function handleLike(id) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? {
              ...post,
              likes: post.likes + 1,
            }
          : post
      )
    );
  }

  async function handleReply(id) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? {
              ...post,
              replies: post.replies + 1,
            }
          : post
      )
    );
  }

  async function handleRepost(id) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? {
              ...post,
              reposts: post.reposts + 1,
            }
          : post
      )
    );
  }

  const visiblePosts = useMemo(() => {
    if (feedMode === "Fresh") {
      return [...posts].sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );
    }

    if (feedMode === "Popular") {
      return [...posts].sort(
        (a, b) =>
          b.likes +
          b.replies +
          b.reposts -
          (a.likes +
            a.replies +
            a.reposts)
      );
    }

    return posts;
  }, [posts, feedMode]);

  return (
    <>
      <PageIntro
        title="Your space."
        description="People, ideas and conversations you actually care about."
      />

      <div className="feed-switcher">
        {["For you", "Fresh", "Popular"].map(
          (mode) => (
            <button
              type="button"
              key={mode}
              className={
                feedMode === mode
                  ? "feed-switch active"
                  : "feed-switch"
              }
              onClick={() => setFeedMode(mode)}
            >
              {mode}
            </button>
          )
        )}

        <button
          type="button"
          className="feed-refresh"
          onClick={loadPosts}
          disabled={loading}
          aria-label="Refresh feed"
        >
          ↻
        </button>
      </div>

      <Composer
        onSubmit={handleCreatePost}
        submitting={creating}
      />

      {error && (
        <div className="feed-error">
          <strong>Something went wrong.</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="feed">
        {loading ? (
          <div className="feed-empty">
            <strong>Loading your feed...</strong>
            <span>
              Fetching the latest conversations.
            </span>
          </div>
        ) : visiblePosts.length > 0 ? (
          visiblePosts.map((post) => (
            <Post
              key={post.id}
              {...post}
              onLike={() => handleLike(post.id)}
              onReply={() => handleReply(post.id)}
              onRepost={() => handleRepost(post.id)}
            />
          ))
        ) : (
          <div className="feed-empty">
            <strong>Your feed is quiet.</strong>
            <span>
              Be the first person to say something.
            </span>
          </div>
        )}
      </div>
    </>
  );
}