import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import { supabase } from "../lib/supabase";

const trends = [
  { id: 1, tag: "#technology", posts: "1.8K posts" },
  { id: 2, tag: "#design", posts: "940 posts" },
  { id: 3, tag: "#music", posts: "782 posts" },
];

export default function RightRail() {
  const [currentUser, setCurrentUser] = useState(null);
  const [people, setPeople] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [followLoading, setFollowLoading] = useState(null);

  useEffect(() => {
    loadPeople();
  }, []);

  async function loadPeople() {
    setLoadingPeople(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (userError) console.error("Could not get current user:", userError);
        setPeople([]);
        return;
      }

      setCurrentUser(user);

      const [{ data: profiles, error: profileError }, { data: follows, error: followsError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .neq("id", user.id)
            .order("display_name", { ascending: true })
            .limit(3),
          supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id),
        ]);

      if (profileError) {
        console.error("Could not load profiles:", profileError);
        setPeople([]);
      } else {
        setPeople(profiles || []);
      }

      if (followsError) {
        console.error("Could not load follows:", followsError);
        setFollowing([]);
      } else {
        setFollowing((follows || []).map((item) => item.following_id));
      }
    } catch (error) {
      console.error("Unexpected RightRail error:", error);
      setPeople([]);
      setFollowing([]);
    } finally {
      setLoadingPeople(false);
    }
  }

  async function toggleFollow(personId) {
    if (!currentUser || followLoading === personId) return;

    const alreadyFollowing = following.includes(personId);
    setFollowLoading(personId);

    try {
      if (alreadyFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", personId);

        if (error) throw error;
        setFollowing((current) => current.filter((id) => id !== personId));
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: currentUser.id,
          following_id: personId,
        });

        if (error) throw error;
        setFollowing((current) => [...current, personId]);
      }
    } catch (error) {
      console.error("Follow action failed:", error);
    } finally {
      setFollowLoading(null);
    }
  }

  function getPersonName(person) {
    return person.display_name || person.username || "User";
  }

  function getPersonHandle(person) {
    return person.username || "user";
  }

  return (
    <aside className="right-rail">
      <section className="rail-section">
        <div className="rail-heading">
          <h2>People to know</h2>
          <button type="button" onClick={loadPeople}>Refresh</button>
        </div>

        {loadingPeople ? (
          <div className="rail-empty"><span>Finding people...</span></div>
        ) : people.length > 0 ? (
          people.map((person) => {
            const isFollowing = following.includes(person.id);
            const name = getPersonName(person);
            const handle = getPersonHandle(person);

            return (
              <div className="follow-row" key={person.id}>
                <Avatar name={name} src={person.avatar_url} />
                <span>
                  <strong>{name}</strong>
                  <small>@{handle}</small>
                </span>
                <button
                  type="button"
                  disabled={followLoading === person.id}
                  onClick={() => toggleFollow(person.id)}
                >
                  {followLoading === person.id ? "..." : isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            );
          })
        ) : (
          <div className="rail-empty">
            <strong>No one to show yet.</strong>
            <span>New people will appear here as they join.</span>
          </div>
        )}
      </section>

      <section className="rail-section">
        <div className="rail-heading">
          <h2>What's moving</h2>
          <button type="button" onClick={() => (window.location.href = "/explore")}>Explore</button>
        </div>

        {trends.map((trend, index) => (
          <button
            type="button"
            className="trend"
            key={trend.id}
            onClick={() =>
              (window.location.href = `/explore?topic=${encodeURIComponent(trend.tag)}`)
            }
          >
            <small>0{index + 1} · TRENDING</small>
            <strong>{trend.tag}</strong>
            <small>{trend.posts}</small>
          </button>
        ))}
      </section>

      <section className="rail-note">
        <span>QYVRA / 01</span>
        <p>A small place for people, ideas and whatever happens between them.</p>
      </section>

      <footer className="rail-footer">
        <span>Made for conversations.</span>
        <span>v1.0</span>
      </footer>
    </aside>
  );
}
