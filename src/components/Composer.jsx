import { useState } from "react";

export default function Composer({ onSubmit }) {
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);

  function openComposer() {
    setExpanded(true);
  }

  function closeComposer() {
    setText("");
    setExpanded(false);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const cleanText = text.trim();

    if (!cleanText || !onSubmit) {
      return;
    }

    onSubmit(cleanText);

    setText("");
    setExpanded(false);
  }

  if (!expanded) {
    return (
      <section className="composer-inner">
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
      </section>
    );
  }

  return (
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
      />

      <div className="composer-footer">
        <span>{text.length}/280</span>

        <div>
          <button
            type="button"
            className="composer-cancel"
            onClick={closeComposer}
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
  );
}