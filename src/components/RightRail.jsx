import { useState } from "react";

import Avatar from "./Avatar";

const suggestedPeople = [
  {
    id: 1,
    name: "Aarav",
    handle: "aarav",
  },
  {
    id: 2,
    name: "Nisha",
    handle: "nisha",
  },
  {
    id: 3,
    name: "Riya",
    handle: "riya",
  },
];

const trends = [
  {
    id: 1,
    tag: "#technology",
    posts: "1.8K posts",
  },
  {
    id: 2,
    tag: "#design",
    posts: "940 posts",
  },
  {
    id: 3,
    tag: "#music",
    posts: "782 posts",
  },
];

export default function RightRail() {
  const [following, setFollowing] = useState([]);

  function toggleFollow(id) {
    setFollowing((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <aside className="right-rail">
      <section className="rail-section">
        <div className="rail-heading">
          <h2>People to know</h2>

          <button type="button">
            See all
          </button>
        </div>

        {suggestedPeople.map((person) => {
          const isFollowing = following.includes(
            person.id
          );

          return (
            <div
              className="follow-row"
              key={person.id}
            >
              <Avatar name={person.name} />

              <span>
                <strong>{person.name}</strong>
                <small>@{person.handle}</small>
              </span>

              <button
                type="button"
                onClick={() =>
                  toggleFollow(person.id)
                }
              >
                {isFollowing
                  ? "Following"
                  : "Follow"}
              </button>
            </div>
          );
        })}
      </section>

      <section className="rail-section">
        <div className="rail-heading">
          <h2>What's moving</h2>

          <button type="button">
            Explore
          </button>
        </div>

        {trends.map((trend, index) => (
          <button
            type="button"
            className="trend"
            key={trend.id}
          >
            <small>
              0{index + 1} · TRENDING
            </small>

            <strong>{trend.tag}</strong>

            <small>{trend.posts}</small>
          </button>
        ))}
      </section>

      <section className="rail-note">
        <span>SOCIAL / 01</span>

        <p>
          A small place for people,
          ideas and whatever happens
          between them.
        </p>
      </section>

      <footer className="rail-footer">
        <span>Made for conversations.</span>
        <span>v1.0</span>
      </footer>
    </aside>
  );
}