import { useEffect, useState } from "react";

import Avatar from "./Avatar";
import { supabase } from "../lib/supabase";

export default function Composer({
  onCreate,
  onSubmit,
}) {
  const [text, setText] = useState("");

  const [expanded, setExpanded] =
    useState(false);

  const [user, setUser] = useState(null);

  const [profile, setProfile] =
    useState(null);

  const [posting, setPosting] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return;
    }

    setUser(currentUser);

    const {
      data: profileData,
    } = await supabase
      .from("profiles")
      .select(
        "username, display_name, avatar_url"
      )
      .eq("id", currentUser.id)
      .maybeSingle();

    setProfile(profileData);
  }

  function getDisplayName() {
    return (
      profile?.display_name ||
      profile?.username ||
      user?.user_metadata
        ?.display_name ||
      user?.email?.split("@")[0] ||
      "User"
    );
  }

  function getAvatarUrl() {
    return (
      profile?.avatar_url ||
      user?.user_metadata?.avatar_url ||
      user?.user_metadata?.picture ||
      ""
    );
  }

  function openComposer() {
    setExpanded(true);
    setError("");

    if (onCreate) {
      onCreate();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanText = text.trim();

    if (!cleanText || posting) {
      return;
    }

    setPosting(true);
    setError("");

    try {
      let currentUser = user;

      /*
       * Make sure we have the current authenticated
       * Supabase user before inserting.
       */

      if (!currentUser) {
        const {
          data: {
            user: authenticatedUser,
          },
        } =
          await supabase.auth.getUser();

        currentUser =
          authenticatedUser;
      }

      if (!currentUser) {
        throw new Error(
          "You need to be logged in to post."
        );
      }

      /*
       * Insert the REAL post.
       */

      const {
        data: insertedPost,
        error: insertError,
      } =
        await supabase
          .from("posts")
          .insert({
            author_id:
              currentUser.id,

            content: cleanText,

            likes_count: 0,

            replies_count: 0,

            reposts_count: 0,
          })
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
          .single();

      if (insertError) {
        throw insertError;
      }

      /*
       * Convert the database post into the shape
       * expected by Post.jsx / Home.jsx.
       */

      const author =
        insertedPost.profiles;

      const createdPost = {
        id: insertedPost.id,

        name:
          author?.display_name ||
          author?.username ||
          getDisplayName(),

        handle:
          author?.username ||
          profile?.username ||
          user?.email?.split("@")[0] ||
          "user",

        avatarUrl:
          author?.avatar_url ||
          getAvatarUrl(),

        text:
          insertedPost.content,

        time: "now",

        likes:
          insertedPost.likes_count || 0,

        replies:
          insertedPost.replies_count || 0,

        reposts:
          insertedPost.reposts_count || 0,

        createdAt:
          insertedPost.created_at,

        authorId:
          insertedPost.author_id,
      };

      /*
       * Tell Home.jsx that a real post was created.
       */

      window.dispatchEvent(
        new CustomEvent(
          "social:post-created",
          {
            detail: createdPost,
          }
        )
      );

      /*
       * Keep compatibility with the old
       * onSubmit prop if another component uses it.
       */

      if (onSubmit) {
        onSubmit(createdPost);
      }

      setText("");
      setExpanded(false);
    } catch (err) {
      console.error(
        "Post creation failed:",
        err
      );

      setError(
        err?.message ||
          "Couldn't publish your post."
      );
    } finally {
      setPosting(false);
    }
  }

  function cancelComposer() {
    if (posting) {
      return;
    }

    setText("");
    setError("");
    setExpanded(false);
  }

  return (
    <section
      className={
        expanded
          ? "composer composer-expanded"
          : "composer"
      }
    >
      <Avatar
        name={getDisplayName()}
        src={
          getAvatarUrl() || undefined
        }
      />

      {!expanded ? (
        <>
          <button
            type="button"
            className="composer-input"
            onClick={openComposer}
          >
            What's on your mind?
          </button>

          <button
            type="button"
            className="composer-add"
            onClick={openComposer}
            aria-label="Create post"
          >
            +
          </button>
        </>
      ) : (
        <form
          className="composer-form"
          onSubmit={handleSubmit}
        >
          <textarea
            autoFocus
            value={text}
            onChange={(event) =>
              setText(
                event.target.value
              )
            }
            placeholder="What's on your mind?"
            maxLength={280}
            disabled={posting}
          />

          {error && (
            <div className="composer-error">
              <span>{error}</span>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
              >
                ×
              </button>
            </div>
          )}

          <div className="composer-footer">
            <span>
              {text.length}/280
            </span>

            <div>
              <button
                type="button"
                className="composer-cancel"
                onClick={
                  cancelComposer
                }
                disabled={posting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="composer-post"
                disabled={
                  !text.trim() ||
                  posting
                }
              >
                {posting
                  ? "Posting..."
                  : "Post"}
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}