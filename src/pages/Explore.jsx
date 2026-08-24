import { useMemo, useState } from "react";

import Avatar from "../components/Avatar";

const people = [
  {
    id: 1,
    name: "Aarav Sharma",
    handle: "aarav",
    bio: "Building things that should probably exist.",
    posts: 128,
    followers: "1.8K",
  },
  {
    id: 2,
    name: "Nisha",
    handle: "nisha",
    bio: "Music, late nights and questionable ideas.",
    posts: 84,
    followers: "942",
  },
  {
    id: 3,
    name: "Riya Kapoor",
    handle: "riya",
    bio: "Designing interfaces and collecting references.",
    posts: 156,
    followers: "2.1K",
  },
  {
    id: 4,
    name: "Dev",
    handle: "dev",
    bio: "Code first. Coffee second. Sleep optional.",
    posts: 203,
    followers: "3.4K",
  },
];

const topics = [
  {
    id: 1,
    title: "Technology",
    tag: "#technology",
    posts: "1.8K",
    description: "Code, AI, gadgets and the internet.",
  },
  {
    id: 2,
    title: "Design",
    tag: "#design",
    posts: "940",
    description: "Interfaces, typography and visual ideas.",
  },
  {
    id: 3,
    title: "Music",
    tag: "#music",
    posts: "782",
    description: "Songs, artists and everything worth replaying.",
  },
  {
    id: 4,
    title: "College",
    tag: "#college",
    posts: "641",
    description: "Classes, assignments and surviving semester life.",
  },
  {
    id: 5,
    title: "Photography",
    tag: "#photography",
    posts: "520",
    description: "Frames, cameras and things worth noticing.",
  },
  {
    id: 6,
    title: "React",
    tag: "#react",
    posts: "416",
    description: "Frontend, components and shipping things.",
  },
];

const posts = [
  {
    id: 1,
    name: "Aarav",
    handle: "aarav",
    text: "The best interface is usually the one that gets out of your way.",
    time: "18m",
    likes: 86,
  },
  {
    id: 2,
    name: "Nisha",
    handle: "nisha",
    text: "Found a song today that deserves to be played at irresponsible volume.",
    time: "42m",
    likes: 54,
  },
  {
    id: 3,
    name: "Riya",
    handle: "riya",
    text: "Spent three hours fixing spacing. Nobody will notice. That's the point.",
    time: "1h",
    likes: 112,
  },
  {
    id: 4,
    name: "Dev",
    handle: "dev",
    text: "Finally shipped the thing I've been postponing for two weeks.",
    time: "2h",
    likes: 73,
  },
];

export default function Explore() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Trending");
  const [following, setFollowing] = useState([]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredPeople = useMemo(() => {
    if (!normalizedQuery) {
      return people;
    }

    return people.filter(
      (person) =>
        person.name.toLowerCase().includes(normalizedQuery) ||
        person.handle.toLowerCase().includes(normalizedQuery) ||
        person.bio.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const filteredTopics = useMemo(() => {
    if (!normalizedQuery) {
      return topics;
    }

    return topics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(normalizedQuery) ||
        topic.tag.toLowerCase().includes(normalizedQuery) ||
        topic.description.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const filteredPosts = useMemo(() => {
    if (!normalizedQuery) {
      return posts;
    }

    return posts.filter(
      (post) =>
        post.name.toLowerCase().includes(normalizedQuery) ||
        post.handle.toLowerCase().includes(normalizedQuery) ||
        post.text.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  function toggleFollow(id) {
    setFollowing((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  const hasSearch =
    normalizedQuery.length > 0;

  return (
    <div className="explore-page">
      <div className="explore-heading">
        <div>
          <span className="page-kicker">EXPLORE</span>
          <h1>Find your corner.</h1>
        </div>

        <span className="explore-count">
          {hasSearch
            ? `${filteredPeople.length + filteredTopics.length + filteredPosts.length} results`
            : "What's moving"}
        </span>
      </div>

      <label className="explore-search">
        <span className="explore-search-icon">⌕</span>

        <input
          autoFocus
          type="search"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Search people, posts or topics"
          aria-label="Search people, posts or topics"
        />

        {query && (
          <button
            type="button"
            className="search-clear"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </label>

      {!hasSearch && (
        <div className="explore-tabs">
          {["Trending", "People", "Topics"].map((tab) => (
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
        </div>
      )}

      {hasSearch ? (
        <div className="search-results">
          {filteredPeople.length > 0 && (
            <section className="explore-section">
              <div className="section-heading">
                <h2>People</h2>
                <span>{filteredPeople.length}</span>
              </div>

              <div className="people-list">
                {filteredPeople.map((person) => (
                  <PersonRow
                    key={person.id}
                    person={person}
                    following={following}
                    onFollow={toggleFollow}
                  />
                ))}
              </div>
            </section>
          )}

          {filteredTopics.length > 0 && (
            <section className="explore-section">
              <div className="section-heading">
                <h2>Topics</h2>
                <span>{filteredTopics.length}</span>
              </div>

              <div className="explore-topic-list">
                {filteredTopics.map((topic, index) => (
                  <TopicRow
                    key={topic.id}
                    topic={topic}
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}

          {filteredPosts.length > 0 && (
            <section className="explore-section">
              <div className="section-heading">
                <h2>Posts</h2>
                <span>{filteredPosts.length}</span>
              </div>

              <div className="discover-posts">
                {filteredPosts.map((post) => (
                  <PostPreview
                    key={post.id}
                    post={post}
                  />
                ))}
              </div>
            </section>
          )}

          {filteredPeople.length === 0 &&
            filteredTopics.length === 0 &&
            filteredPosts.length === 0 && (
              <div className="explore-empty">
                <strong>Nothing found.</strong>
                <span>
                  Try a different word or search for a
                  person.
                </span>
              </div>
            )}
        </div>
      ) : (
        <>
          {activeTab === "Trending" && (
            <>
              <section className="explore-section">
                <div className="section-heading">
                  <h2>What's moving</h2>
                  <span>RIGHT NOW</span>
                </div>

                <div className="explore-topic-list">
                  {topics.slice(0, 5).map((topic, index) => (
                    <TopicRow
                      key={topic.id}
                      topic={topic}
                      index={index}
                    />
                  ))}
                </div>
              </section>

              <section className="explore-section">
                <div className="section-heading">
                  <h2>Worth reading</h2>
                  <span>FOR YOU</span>
                </div>

                <div className="discover-posts">
                  {posts.slice(0, 3).map((post) => (
                    <PostPreview
                      key={post.id}
                      post={post}
                    />
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === "People" && (
            <section className="explore-section">
              <div className="section-heading">
                <h2>People you might like</h2>
                <span>{people.length}</span>
              </div>

              <div className="people-list">
                {people.map((person) => (
                  <PersonRow
                    key={person.id}
                    person={person}
                    following={following}
                    onFollow={toggleFollow}
                  />
                ))}
              </div>
            </section>
          )}

          {activeTab === "Topics" && (
            <section className="explore-section">
              <div className="section-heading">
                <h2>Pick a rabbit hole.</h2>
                <span>{topics.length}</span>
              </div>

              <div className="explore-topic-list">
                {topics.map((topic, index) => (
                  <TopicRow
                    key={topic.id}
                    topic={topic}
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function PersonRow({
  person,
  following,
  onFollow,
}) {
  const isFollowing = following.includes(person.id);

  return (
    <article className="person-row">
      <Avatar name={person.name} />

      <div className="person-info">
        <strong>{person.name}</strong>
        <span>@{person.handle}</span>
        <small>{person.bio}</small>
      </div>

      <button
        type="button"
        className={
          isFollowing
            ? "follow-button following"
            : "follow-button"
        }
        onClick={() => onFollow(person.id)}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
    </article>
  );
}

function TopicRow({ topic, index }) {
  return (
    <button
      type="button"
      className="explore-topic"
      onClick={() => {}}
    >
      <span className="topic-number">
        {String(index + 1).padStart(2, "0")}
      </span>

      <span className="topic-copy">
        <strong>{topic.tag}</strong>
        <small>{topic.description}</small>
      </span>

      <span className="topic-posts">
        {topic.posts} posts
      </span>

      <span className="topic-arrow">↗</span>
    </button>
  );
}

function PostPreview({ post }) {
  return (
    <article className="discover-post">
      <Avatar name={post.name} />

      <div>
        <div className="discover-post-meta">
          <strong>{post.name}</strong>
          <span>@{post.handle}</span>
          <span>·</span>
          <span>{post.time}</span>
        </div>

        <p>{post.text}</p>

        <div className="discover-post-stats">
          <span>♡ {post.likes}</span>
          <span>Read conversation ↗</span>
        </div>
      </div>
    </article>
  );
}