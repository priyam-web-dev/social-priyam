import { useEffect, useState } from "react";

import Avatar from "../components/Avatar";
import { supabase } from "../lib/supabase";

function getFallbackName(user) {
  return (
    user?.user_metadata?.display_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User"
  );
}

function getFallbackUsername(user) {
  return (
    user?.user_metadata?.username ||
    user?.email?.split("@")[0] ||
    "user"
  );
}

function getFallbackBio(user) {
  return (
    user?.user_metadata?.bio ||
    "Building things, learning things, and making the internet a little less boring."
  );
}

function getFallbackAvatar(user) {
  return (
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    ""
  );
}

function ProfilePage({ user }) {
  const [activeTab, setActiveTab] = useState("Posts");

  const [profile, setProfile] = useState(null);

  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });

  const [posts, setPosts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    loadProfile();
  }, [user?.id]);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      /*
       * ------------------------------------------
       * 1. LOAD REAL PROFILE
       * ------------------------------------------
       */

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, bio, avatar_url"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      setProfile({
        name:
          profileData?.display_name ||
          getFallbackName(user),

        username:
          profileData?.username ||
          getFallbackUsername(user),

        bio:
          profileData?.bio ||
          getFallbackBio(user),

        avatarUrl:
          profileData?.avatar_url ||
          getFallbackAvatar(user),
      });

      /*
       * ------------------------------------------
       * 2. LOAD POST COUNT
       * ------------------------------------------
       */

      const {
        count: postCount,
        error: postCountError,
      } = await supabase
        .from("posts")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("author_id", user.id);

      if (postCountError) {
        console.error(
          "Post count error:",
          postCountError
        );
      }

      /*
       * ------------------------------------------
       * 3. LOAD FOLLOWER COUNT
       *
       * Someone follows this user:
       * following_id = current user's id
       * ------------------------------------------
       */

      const {
        count: followerCount,
        error: followerError,
      } = await supabase
        .from("follows")
        .select("follower_id", {
          count: "exact",
          head: true,
        })
        .eq("following_id", user.id);

      if (followerError) {
        console.error(
          "Follower count error:",
          followerError
        );
      }

      /*
       * ------------------------------------------
       * 4. LOAD FOLLOWING COUNT
       *
       * Current user follows someone:
       * follower_id = current user's id
       * ------------------------------------------
       */

      const {
        count: followingCount,
        error: followingError,
      } = await supabase
        .from("follows")
        .select("following_id", {
          count: "exact",
          head: true,
        })
        .eq("follower_id", user.id);

      if (followingError) {
        console.error(
          "Following count error:",
          followingError
        );
      }

      setStats({
        posts: postCount || 0,
        followers: followerCount || 0,
        following: followingCount || 0,
      });

      /*
       * ------------------------------------------
       * 5. LOAD REAL POSTS
       * ------------------------------------------
       */

      const {
        data: postData,
        error: postsError,
      } = await supabase
        .from("posts")
        .select(
          `
            id,
            content,
            created_at,
            likes_count,
            replies_count,
            reposts_count
          `
        )
        .eq("author_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (postsError) {
        console.error(
          "Posts loading error:",
          postsError
        );

        setPosts([]);
      } else {
        setPosts(postData || []);
      }
    } catch (err) {
      console.error(
        "Profile loading failed:",
        err
      );

      setError(
        "We couldn't load your profile right now."
      );
    } finally {
      setLoading(false);
    }
  }

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

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-loading-avatar" />

          <div className="profile-loading-lines">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  const displayProfile = profile || {
    name: getFallbackName(user),
    username: getFallbackUsername(user),
    bio: getFallbackBio(user),
    avatarUrl: getFallbackAvatar(user),
  };

  return (
    <div className="profile-page">
      {error && (
        <div className="profile-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadProfile}
          >
            Try again
          </button>
        </div>
      )}

      <section className="profile-header">
        <div className="profile-avatar-wrap">
          <Avatar
            name={displayProfile.name}
            size="lg"
            src={
              displayProfile.avatarUrl ||
              undefined
            }
          />

          <span
            className="profile-status"
            aria-label="Online"
          />
        </div>

        <div className="profile-main">
          <div className="profile-name-row">
            <div>
              <h1>{displayProfile.name}</h1>

              <span>
                @{displayProfile.username}
              </span>
            </div>

            <button
              type="button"
              className="profile-follow-button following"
              onClick={() => {
                /*
                 * Edit profile will be connected
                 * to the profiles table next.
                 */
              }}
            >
              Edit profile
            </button>
          </div>

          <p className="profile-bio">
            {displayProfile.bio}
          </p>

          <div className="profile-stats">
            <button type="button">
              <strong>{stats.posts}</strong>
              <span>posts</span>
            </button>

            <button type="button">
              <strong>
                {stats.followers}
              </strong>
              <span>followers</span>
            </button>

            <button type="button">
              <strong>
                {stats.following}
              </strong>
              <span>following</span>
            </button>
          </div>
        </div>
      </section>

      <nav
        className="profile-tabs"
        aria-label="Profile sections"
      >
        {["Posts", "Replies", "Likes"].map(
          (tab) => (
            <button
              type="button"
              key={tab}
              className={
                activeTab === tab
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(tab)
              }
            >
              {tab}
            </button>
          )
        )}
      </nav>

      {activeTab === "Posts" && (
        <div className="profile-posts">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <article
                className="profile-post"
                key={post.id}
              >
                <div className="profile-post-top">
                  <span>
                    {String(
                      index + 1
                    ).padStart(2, "0")}
                  </span>

                  <small>
                    {formatTime(
                      post.created_at
                    )}
                  </small>
                </div>

                <p>
                  {post.content}
                </p>

                <div className="profile-post-bottom">
                  <span>
                    ♡{" "}
                    {post.likes_count || 0}
                  </span>

                  <span>
                    ○{" "}
                    {post.replies_count ||
                      0}
                  </span>

                  <span>
                    ↻{" "}
                    {post.reposts_count ||
                      0}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="quiet-state">
              <strong>
                No posts yet.
              </strong>

              <span>
                Your posts will appear here
                when you start sharing.
              </span>
            </div>
          )}
        </div>
      )}

      {activeTab === "Replies" && (
        <div className="quiet-state">
          <strong>
            No replies yet.
          </strong>

          <span>
            Replies you make will appear
            here.
          </span>
        </div>
      )}

      {activeTab === "Likes" && (
        <div className="quiet-state">
          <strong>
            No liked posts yet.
          </strong>

          <span>
            Posts you like will appear
            here.
          </span>
        </div>
      )}
    </div>
  );
}

function NotificationsPage() {
  return (
    <div className="activity-page">
      <div className="utility-bar">
        <span>Activity</span>
      </div>

      <div className="quiet-state">
        <strong>
          No notifications yet.
        </strong>

        <span>
          When someone interacts with
          your posts, you'll see it here.
        </span>
      </div>
    </div>
  );
}

export default function BasicPage({
  type,
  user,
}) {
  if (type === "notifications") {
    return <NotificationsPage />;
  }

  if (type === "profile") {
    return (
      <ProfilePage user={user} />
    );
  }

  return null;
}