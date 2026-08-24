import { useState } from "react";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";

function getDisplayName(user) {
  return (
    user?.user_metadata?.display_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User"
  );
}

export default function Composer({
  onSubmit,
  submitting = false,
}) {
  const { user } = useAuth();

  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);

  const displayName = getDisplayName(user);

  function openComposer() {
    setExpanded(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanText = text.trim();

    if (!cleanText || submitting) {
      return;
    }

    await onSubmit(cleanText);

    setText("");
    setExpanded(false);
  }

  function cancelComposer() {
    if (submitting) {
      return;
    }

    setText("");
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
        name={displayName}
        size="md"
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
              setText(event.target.value)
            }
            placeholder="What's on your mind?"
            maxLength={280}
            disabled={submitting}
          />

          <div className="composer-footer">
            <span>
              {text.length}/280
            </span>

            <div>
              <button
                type="button"
                className="composer-cancel"
                onClick={cancelComposer}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="composer-post"
                disabled={
                  !text.trim() || submitting
                }
              >
                {submitting
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