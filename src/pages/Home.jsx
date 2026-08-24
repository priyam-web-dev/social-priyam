import { useEffect, useMemo, useState } from "react";

import PageIntro from "../components/PageIntro";
import Composer from "../components/Composer";
import Post from "../components/Post";

const defaultPosts = [
  {
    id: 1,
    name: "Priyam",
    handle: "priyam",
    text: "Building something new today. Keeping it simple, fast and actually useful.",
    time: "now",
    likes: 24,
    replies: 4,
    reposts: 2,
  },
  {
    id: 2,
    name: "Aarav",
    handle: "aarav",
    text: "Sometimes the best interface is the one that gets out of your way.",
    time: "4h",
    likes: 67,
    replies: 12,
    reposts: 8,
  },
  {
    id: 3,
    name: "Nisha",
    handle: "nisha",
    text: "Late night ideas always arrive without an appointment.",
    time: "6h",
    likes: 31,
    replies: 5,
    reposts: 3,
  },
  {
    id: 4,
    name: "Riya",
    handle: "riya",
    text: "A good product should feel obvious after you use it, not while someone is explaining it.",
    time: "8h",
    likes: 49,
    replies: 9,
    reposts: 6,
  },
];

const STORAGE_KEY = "social-posts";

function loadPosts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return defaultPosts;
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) && parsed.length
      ? parsed
      : defaultPosts;
  } catch {
    return defaultPosts;
  }
}

export default function Home({ onCreate }) {
  const [posts, setPosts] = useState(loadPosts);
  const [feedMode, setFeedMode] = useState("For you");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    function handleCreatedPost(event) {
      const post = event.detail;

      if (!post) {
        return;
      }

      setPosts((current) => [post, ...current]);
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

  function handleLike(id) {
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

  function handleReply(id) {
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

  function handleRepost(id) {
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
      return [...posts].sort((a, b) => b.id - a.id);
    }

    if (feedMode === "Popular") {
      return [...posts].sort(
        (a, b) =>
          b.likes +
          b.replies +
          b.reposts -
          (a.likes + a.replies + a.reposts)
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
        {["For you", "Fresh", "Popular"].map((mode) => (
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
        ))}
      </div>

      <Composer onCreate={onCreate} />

      <div className="feed">
        {visiblePosts.length > 0 ? (
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
            <span>Be the first person to say something.</span>

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