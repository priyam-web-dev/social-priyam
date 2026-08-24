import { useMemo, useState } from "react";

import Avatar from "../components/Avatar";

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

function getBio(user) {
  return (
    user?.user_metadata?.bio ||
    "Building things, learning things, and making the internet a little less boring."
  );
}

function getAvatarUrl(user) {
  return (
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    ""
  );
}

function ProfilePage({ user }) {
  const [activeTab, setActiveTab] = useState("Posts");

  const profile = useMemo(() => {
    return {
      name: getDisplayName(user),
      username: getUsername(user),
      bio: getBio(user),
      avatarUrl: getAvatarUrl(user),
    };
  }, [user]);

  const tabs = ["Posts", "Replies", "Likes"];

  return (
    <div className="profile-page">
      <section className="profile-header">
        <div className="profile-avatar-wrap">
          <Avatar
            name={profile.name}
            size="lg"
            src={profile.avatarUrl || undefined}
          />

          <span
            className="profile-status"
            aria-label="Online"
          />
        </div>

        <div className="profile-main">
          <div className="profile-name-row">
            <div>
              <h1>{profile.name}</h1>

              <span>@{profile.username}</span>
            </div>

            <button
              type="button"
              className="profile-follow-button following"
              onClick={() => {
                // Profile editing will be connected to Supabase next.
              }}
            >
              Edit profile
            </button>
          </div>

          <p className="profile-bio">
            {profile.bio}
          </p>

          <div className="profile-stats">
            <button type="button">
              <strong>0</strong>
              <span>posts</span>
            </button>

            <button type="button">
              <strong>0</strong>
              <span>followers</span>
            </button>

            <button type="button">
              <strong>0</strong>
              <span>following</span>
            </button>
          </div>
        </div>
      </section>

      <nav
        className="profile-tabs"
        aria-label="Profile sections"
      >
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "Posts" && (
        <div className="profile-posts">
          <div className="quiet-state">
            <strong>No posts yet.</strong>

            <span>
              Your posts will appear here when you
              start sharing.
            </span>
          </div>
        </div>
      )}

      {activeTab === "Replies" && (
        <div className="quiet-state">
          <strong>No replies yet.</strong>

          <span>
            Replies you make will appear here.
          </span>
        </div>
      )}

      {activeTab === "Likes" && (
        <div className="quiet-state">
          <strong>No liked posts yet.</strong>

          <span>
            Posts you like will appear here.
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
        <strong>No notifications yet.</strong>

        <span>
          When someone interacts with your posts,
          you'll see it here.
        </span>
      </div>
    </div>
  );
}

export default function BasicPage({ type, user }) {
  if (type === "notifications") {
    return <NotificationsPage />;
  }

  if (type === "profile") {
    return <ProfilePage user={user} />;
  }

  return null;
}