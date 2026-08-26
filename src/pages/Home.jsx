import { useEffect, useMemo, useState } from "react";

import PageIntro from "../components/PageIntro";
import Composer from "../components/Composer";
import Post from "../components/Post";
import Avatar from "../components/Avatar";
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

function getAvatarUrl(user) {
  return (
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    ""
  );
}

function formatTime(dateString) {
  if (!dateString) {
    return "now";
  }

  const date = new Date(dateString);
  const now = new Date();

  const diff = Math.max(
    0,
    now.getTime() - date.getTime()
  );

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return "now";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  if (hours < 24) {
    return `${hours}h`;
  }

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

function normalizePost(row) {
  return {
    id: row.id,

    name:
      row.author_name ||
      "User",

    handle:
      row.author_username ||
      "user",

    avatarUrl:
      row.author_avatar ||
      "",

    text:
      row.content ||
      "",

    imageUrl:
      row.image_url ||
      "",

    time: formatTime(
      row.created_at
    ),

    createdAt:
      row.created_at,

    likes:
      Number(row.likes || 0),

    replies:
      Number(row.replies || 0),

    reposts:
      Number(row.reposts || 0),

    authorId:
      row.author_id,
  };
}

export default function Home() {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [feedMode, setFeedMode] =
    useState("For you");

  const [loading, setLoading] =
    useState(true);

  const [posting, setPosting] =
    useState(false);

  const [error, setError] =
    useState("");

  const currentUser = useMemo(
    () => ({
      name:
        getDisplayName(user),

      username:
        getUsername(user),

      avatarUrl:
        getAvatarUrl(user),
    }),
    [user]
  );

  async function loadPosts() {
    setLoading(true);
    setError("");

    const {
      data,
      error: fetchError,
    } = await supabase
      .from("posts")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (fetchError) {
      console.error(
        "Failed to load posts:",
        fetchError
      );

      setError(
        "Couldn't load your feed."
      );

      setPosts([]);
      setLoading(false);

      return;
    }

    setPosts(
      (data || []).map(
        normalizePost
      )
    );

    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  /*
   * CreateModal inserts the post directly
   * into Supabase and then sends this event.
   *
   * This makes the newly-created image post
   * appear immediately without requiring
   * a page refresh.
   */
  useEffect(() => {
    function handlePostCreated(event) {
      const newPost =
        event.detail;

      if (!newPost?.id) {
        return;
      }

      setPosts((current) => {
        const alreadyExists =
          current.some(
            (post) =>
              post.id ===
              newPost.id
          );

        if (alreadyExists) {
          return current;
        }

        return [
          newPost,
          ...current,
        ];
      });
    }

    window.addEventListener(
      "social:post-created",
      handlePostCreated
    );

    return () => {
      window.removeEventListener(
        "social:post-created",
        handlePostCreated
      );
    };
  }, []);

  async function handleCreatePost(text) {
    if (
      !user?.id ||
      !text.trim()
    ) {
      return;
    }

    setPosting(true);
    setError("");

    const newPost = {
      author_id:
        user.id,

      author_name:
        currentUser.name,

      author_username:
        currentUser.username,

      author_avatar:
        currentUser.avatarUrl ||
        null,

      content:
        text.trim(),

      image_url:
        null,

      likes: 0,
      replies: 0,
      reposts: 0,
    };

    const {
      data,
      error: insertError,
    } = await supabase
      .from("posts")
      .insert(newPost)
      .select()
      .single();

    if (insertError) {
      console.error(
        "Failed to create post:",
        insertError
      );

      setError(
        insertError.message ||
          "Couldn't publish your post."
      );

      setPosting(false);

      return;
    }

    setPosts((current) => [
      normalizePost(data),
      ...current,
    ]);

    setPosting(false);
  }

  async function handleLike(id) {
    const post =
      posts.find(
        (item) =>
          item.id === id
      );

    if (!post) {
      return;
    }

    const nextLikes =
      post.likes + 1;

    setPosts((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              likes:
                nextLikes,
            }
          : item
      )
    );

    const {
      error: updateError,
    } = await supabase
      .from("posts")
      .update({
        likes:
          nextLikes,
      })
      .eq(
        "id",
        id
      );

    if (updateError) {
      console.error(
        "Like update failed:",
        updateError
      );

      setPosts((current) =>
        current.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  likes:
                    post.likes,
                }
              : item
        )
      );
    }
  }

  async function handleReply(id) {
    const post =
      posts.find(
        (item) =>
          item.id === id
      );

    if (!post) {
      return;
    }

    const nextReplies =
      post.replies + 1;

    setPosts((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              replies:
                nextReplies,
            }
          : item
      )
    );

    const {
      error: updateError,
    } = await supabase
      .from("posts")
      .update({
        replies:
          nextReplies,
      })
      .eq(
        "id",
        id
      );

    if (updateError) {
      console.error(
        "Reply update failed:",
        updateError
      );

      setPosts((current) =>
        current.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  replies:
                    post.replies,
                }
              : item
        )
      );
    }
  }

  async function handleRepost(id) {
    const post =
      posts.find(
        (item) =>
          item.id === id
      );

    if (!post) {
      return;
    }

    const nextReposts =
      post.reposts + 1;

    setPosts((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              reposts:
                nextReposts,
            }
          : item
      )
    );

    const {
      error: updateError,
    } = await supabase
      .from("posts")
      .update({
        reposts:
          nextReposts,
      })
      .eq(
        "id",
        id
      );

    if (updateError) {
      console.error(
        "Repost update failed:",
        updateError
      );

      setPosts((current) =>
        current.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  reposts:
                    post.reposts,
                }
              : item
        )
      );
    }
  }

  const visiblePosts =
    useMemo(() => {
      if (
        feedMode === "Fresh"
      ) {
        return [...posts].sort(
          (a, b) =>
            new Date(
              b.createdAt
            ).getTime() -
            new Date(
              a.createdAt
            ).getTime()
        );
      }

      if (
        feedMode === "Popular"
      ) {
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
    }, [
      posts,
      feedMode,
    ]);

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
          onClick={
            loadPosts
          }
          disabled={
            loading
          }
          aria-label="Refresh feed"
        >
          ↻
        </button>
      </div>

      <section className="composer">
        <Avatar
          name={
            currentUser.name
          }
          src={
            currentUser.avatarUrl ||
            undefined
          }
        />

        <Composer
          onSubmit={
            handleCreatePost
          }
        />
      </section>

      {error && (
        <div className="feed-error">
          <strong>
            Something went wrong.
          </strong>

          <span>
            {error}
          </span>
        </div>
      )}

      {posting && (
        <div className="feed-status">
          Publishing your post...
        </div>
      )}

      <div className="feed">
        {loading ? (
          <div className="feed-empty">
            <strong>
              Loading your space.
            </strong>

            <span>
              Fetching the latest conversations...
            </span>
          </div>
        ) : visiblePosts.length >
          0 ? (
          visiblePosts.map(
            (post) => (
              <Post
                key={post.id}
                {...post}
                onLike={() =>
                  handleLike(
                    post.id
                  )
                }
                onReply={() =>
                  handleReply(
                    post.id
                  )
                }
                onRepost={() =>
                  handleRepost(
                    post.id
                  )
                }
              />
            )
          )
        ) : (
          <div className="feed-empty">
            <strong>
              Your feed is quiet.
            </strong>

            <span>
              Be the first person to say something.
            </span>
          </div>
        )}
      </div>
    </>
  );
}