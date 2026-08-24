import { useState } from "react";
import Avatar from "./Avatar";

export default function Composer({ onCreate, onSubmit }) {
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);

  function openComposer() {
    setExpanded(true);

    if (onCreate) {
      onCreate();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const cleanText = text.trim();

    if (!cleanText) return;

    if (onSubmit) {
      onSubmit(cleanText);
    }

    setText("");
    setExpanded(false);
  }

  return (
    <section className={expanded ? "composer composer-expanded" : "composer"}>
      <Avatar name="Priyam" />

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
            ＋
          </button>
        </>
      ) : (
        <form className="composer-form" onSubmit={handleSubmit}>
          <textarea
            autoFocus
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="What's on your mind?"
            maxLength={280}
          />

          <div className="composer-footer">
            <span>{text.length}/280</span>

            <div>
              <button
                type="button"
                className="composer-cancel"
                onClick={() => {
                  setText("");
                  setExpanded(false);
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="composer-post"
                disabled={!text.trim()}
              >
                Post
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}