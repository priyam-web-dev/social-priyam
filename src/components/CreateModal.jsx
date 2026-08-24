import { useEffect, useRef, useState } from "react";

import Avatar from "./Avatar";

const MAX_LENGTH = 500;

export default function CreateModal({ onClose }) {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "Enter"
      ) {
        event.preventDefault();
        publishPost();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  function publishPost() {
    const cleanText = text.trim();

    if (!cleanText || posting) {
      return;
    }

    setPosting(true);

    const post = {
      id: Date.now(),
      name: "Priyam",
      handle: "priyam",
      text: cleanText,
      time: "now",
      likes: 0,
      replies: 0,
      reposts: 0,
    };

    window.dispatchEvent(
      new CustomEvent("social:post-created", {
        detail: post,
      })
    );

    window.setTimeout(() => {
      onClose();
    }, 120);
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  const remaining = MAX_LENGTH - text.length;
  const hasText = Boolean(text.trim());

  return (
    <div
      className="modal-backdrop"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <section
        className="modal create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-post-title"
      >
        <div className="modal-head">
          <div>
            <span className="create-kicker">WRITE SOMETHING</span>
            <h2 id="create-post-title">New post.</h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="create-author">
          <Avatar name="Priyam" />

          <div>
            <strong>Priyam</strong>
            <small>@priyam</small>
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) =>
            setText(event.target.value.slice(0, MAX_LENGTH))
          }
          maxLength={MAX_LENGTH}
          placeholder="Say something worth stopping for..."
          aria-label="Post text"
        />

        <footer className="create-footer">
          <div className="create-tools">
            <button
              type="button"
              aria-label="Add image"
              title="Images coming soon"
            >
              +
            </button>

            <button
              type="button"
              aria-label="Add emoji"
              title="Emoji coming soon"
            >
              ☺
            </button>

            <span
              className={
                remaining < 40
                  ? "character-count warning"
                  : "character-count"
              }
            >
              {remaining}
            </span>
          </div>

          <div className="create-actions">
            <span className="create-shortcut">
              ⌘ ↵
            </span>

            <button
              type="button"
              className="create-post-button"
              disabled={!hasText || posting}
              onClick={publishPost}
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}