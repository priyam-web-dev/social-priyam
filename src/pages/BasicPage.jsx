import { useState } from "react";

import Avatar from "../components/Avatar";

const notifications = [
  {
    id: 1,
    type: "like",
    name: "Aarav",
    handle: "aarav",
    text: "liked your post",
    time: "12m",
  },
  {
    id: 2,
    type: "reply",
    name: "Nisha",
    handle: "nisha",
    text: "replied to your post",
    time: "1h",
  },
  {
    id: 3,
    type: "follow",
    name: "Riya",
    handle: "riya",
    text: "started following you",
    time: "3h",
  },
  {
    id: 4,
    type: "repost",
    name: "Dev",
    handle: "dev",
    text: "reposted your post",
    time: "Yesterday",
  },
];

const profilePosts = [
  {
    id: 1,
    text: "Building something new today. Keeping it simple, fast and actually useful.",
    time: "2h",
    likes: 24,
  },
  {
    id: 2,
    text: "The best interfaces don't need a tutorial.",
    time: "Yesterday",
    likes: 61,
  },
  {
    id: 3,
    text: "Late night ideas always arrive without an appointment.",
    time: "3d",
    likes: 38,
  },
];

function NotificationIcon({ type }) {
  const icons = {
    like: "♥",
    reply: "↩",
    follow: "+",
    repost: "↻",
  };

  return (
    <span className={`activity-icon activity-${type}`}>
      {icons[type]}
    </span>
  );
}

function NotificationsPage() {
  const [items, setItems] = useState(notifications);

  function clearNotifications() {
    setItems([]);
  }

  return (
    <div className="activity-page">
      <div className="utility-bar">
        <span>{items.length} new</span>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearNotifications}
          >
            Mark all read
          </button>
        )}
      </div>

      {items.length > 0 ? (
        <div className="activity-list">
          {items.map((item) => (
            <article
              className="activity-item"
              key={item.id}
            >
              <Avatar name={item.name} />

              <div className="activity-copy">
                <div>
                  <strong>{item.name}</strong>
                  <span>@{item.handle}</span>
                </div>

                <p>{item.text}</p>
                <small>{item.time}</small>
              </div>

              <NotificationIcon type={item.type} />
            </article>
          ))}
        </div>
      ) : (
        <div className="quiet-state">
          <strong>You're all caught up.</strong>
          <span>Nothing waiting for you.</span>
        </div>
      )}
    </div>
  );
}

function ProfilePage() {
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");

  return (
    <div className="profile-page">
      <section className="profile-header">
        <div className="profile-avatar-wrap">
          <Avatar
            name="Priyam"
            size="lg"
          />

          <span className="profile-status" />
        </div>

        <div className="profile-main">
          <div className="profile-name-row">
            <div>
              <h1>Priyam</h1>
              <span>@priyam</span>
            </div>

            <button
              type="button"
              className={
                following
                  ? "profile-follow-button following"
                  : "profile-follow-button"
              }
              onClick={() =>
                setFollowing((value) => !value)
              }
            >
              {following ? "Following" : "Follow"}
            </button>
          </div>

          <p className="profile-bio">
            Building things, learning things,
            and making the internet a little less
            boring.
          </p>

          <div className="profile-stats">
            <button type="button">
              <strong>24</strong>
              <span>posts</span>
            </button>

            <button type="button">
              <strong>186</strong>
              <span>followers</span>
            </button>

            <button type="button">
              <strong>91</strong>
              <span>following</span>
            </button>
          </div>
        </div>
      </section>

      <nav className="profile-tabs">
        {["Posts", "Replies", "Likes"].map((tab) => (
          <button
            type="button"
            key={tab}
            className={
              activeTab === tab ? "active" : ""
            }
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "Posts" && (
        <div className="profile-posts">
          {profilePosts.map((post, index) => (
            <article
              className="profile-post"
              key={post.id}
            >
              <div className="profile-post-top">
                <span>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <small>{post.time}</small>
              </div>

              <p>{post.text}</p>

              <div className="profile-post-bottom">
                <span>♡ {post.likes}</span>
                <span>↗</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {activeTab === "Replies" && (
        <div className="quiet-state">
          <strong>No replies yet.</strong>
          <span>Start a conversation.</span>
        </div>
      )}

      {activeTab === "Likes" && (
        <div className="quiet-state">
          <strong>No liked posts here.</strong>
          <span>Your saved taste will show up here.</span>
        </div>
      )}
    </div>
  );
}

export default function BasicPage({ type }) {
  if (type === "notifications") {
    return <NotificationsPage />;
  }

  if (type === "profile") {
    return <ProfilePage />;
  }

  return null;
}