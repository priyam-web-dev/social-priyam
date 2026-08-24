import { useMemo, useState } from "react";
import Avatar from "../components/Avatar";

const initialConversations = [
  {
    id: 1,
    name: "Aarav",
    handle: "aarav",
    preview: "Did you finish the new layout?",
    time: "now",
    status: "online",
    unread: 2,
    messages: [
      {
        id: 1,
        text: "Did you finish the new layout?",
        time: "10:38",
        mine: false,
      },
      {
        id: 2,
        text: "Almost. I am cleaning up the mobile version now.",
        time: "10:39",
        mine: true,
      },
      {
        id: 3,
        text: "Nice. Send it when you're done.",
        time: "10:42",
        mine: false,
      },
    ],
  },
  {
    id: 2,
    name: "Nisha",
    handle: "nisha",
    preview: "Send me that song later.",
    time: "1h",
    status: "away",
    unread: 1,
    messages: [
      {
        id: 1,
        text: "That song is actually so good.",
        time: "09:12",
        mine: false,
      },
      {
        id: 2,
        text: "Right? I have had it on repeat.",
        time: "09:18",
        mine: true,
      },
      {
        id: 3,
        text: "Send me that song later.",
        time: "09:19",
        mine: false,
      },
    ],
  },
  {
    id: 3,
    name: "Riya",
    handle: "riya",
    preview: "The design looks much better now.",
    time: "3h",
    status: "online",
    unread: 0,
    messages: [
      {
        id: 1,
        text: "The design looks much better now.",
        time: "07:41",
        mine: false,
      },
      {
        id: 2,
        text: "I finally got the spacing right.",
        time: "07:45",
        mine: true,
      },
    ],
  },
  {
    id: 4,
    name: "Dev",
    handle: "dev",
    preview: "I'll check it tonight.",
    time: "Yesterday",
    status: "offline",
    unread: 0,
    messages: [
      {
        id: 1,
        text: "Can you send the project link?",
        time: "Yesterday",
        mine: false,
      },
      {
        id: 2,
        text: "Sure, I will send it.",
        time: "Yesterday",
        mine: true,
      },
      {
        id: 3,
        text: "I'll check it tonight.",
        time: "Yesterday",
        mine: false,
      },
    ],
  },
];

export default function Messages() {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState(1);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId
  );

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter(
      (conversation) =>
        conversation.name.toLowerCase().includes(query) ||
        conversation.handle.toLowerCase().includes(query) ||
        conversation.preview.toLowerCase().includes(query)
    );
  }, [conversations, search]);

  function selectConversation(id) {
    setSelectedId(id);
    setMenuOpen(false);

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? { ...conversation, unread: 0 }
          : conversation
      )
    );
  }

  function sendMessage(event) {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage || !selectedConversation) {
      return;
    }

    const newMessage = {
      id: Date.now(),
      text: cleanMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      mine: true,
    };

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversation.id
          ? {
              ...conversation,
              preview: cleanMessage,
              time: "now",
              messages: [...conversation.messages, newMessage],
            }
          : conversation
      )
    );

    setMessage("");
  }

  function startNewMessage() {
    const existing = conversations.find(
      (conversation) => conversation.handle === "aarav"
    );

    if (existing) {
      selectConversation(existing.id);
      return;
    }
  }

  return (
    <section className="messages-page">
      <div className="messages-layout">
        <aside className="messages-sidebar">
          <div className="messages-toolbar">
            <button
              type="button"
              className="new-message-button"
              onClick={startNewMessage}
              aria-label="New message"
            >
              +
            </button>

            <label className="messages-search">
              <span>⌕</span>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations"
                aria-label="Search conversations"
              />
            </label>
          </div>

          <div className="conversation-list">
            {filteredConversations.length === 0 ? (
              <div className="chat-search-empty">
                No conversations found.
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  className={
                    conversation.id === selectedId
                      ? "conversation active"
                      : "conversation"
                  }
                  onClick={() => selectConversation(conversation.id)}
                >
                  <div className="conversation-avatar">
                    <Avatar name={conversation.name} />

                    <span
                      className={`presence ${conversation.status}`}
                      aria-hidden="true"
                    />
                  </div>

                  <span className="conversation-copy">
                    <strong>{conversation.name}</strong>
                    <small>{conversation.preview}</small>
                  </span>

                  <span className="conversation-meta">
                    <time>{conversation.time}</time>

                    {conversation.unread > 0 && (
                      <b>{conversation.unread}</b>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {selectedConversation && (
          <section className="conversation-panel">
            <header className="conversation-header">
              <button
                type="button"
                className="chat-back"
                onClick={() => setSelectedId(null)}
                aria-label="Back to conversations"
              >
                ←
              </button>

              <Avatar
                name={selectedConversation.name}
                size="sm"
              />

              <div>
                <strong>{selectedConversation.name}</strong>

                <span>
                  @{selectedConversation.handle} ·{" "}
                  {selectedConversation.status}
                </span>
              </div>

              <button
                type="button"
                className="chat-more"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label="Conversation options"
              >
                ···
              </button>

              {menuOpen && (
                <div className="post-menu">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                  >
                    Mute conversation
                  </button>

                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                  >
                    Clear conversation
                  </button>

                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                  >
                    Report
                  </button>
                </div>
              )}
            </header>

            <div className="conversation-messages">
              <div className="conversation-start">
                <Avatar
                  name={selectedConversation.name}
                  size="lg"
                />

                <strong>{selectedConversation.name}</strong>

                <span>
                  @{selectedConversation.handle}
                </span>
              </div>

              {selectedConversation.messages.map((item) => (
                <div
                  key={item.id}
                  className={
                    item.mine
                      ? "message-row mine"
                      : "message-row"
                  }
                >
                  <div className="message-bubble">
                    <p>{item.text}</p>
                    <time>{item.time}</time>
                  </div>
                </div>
              ))}
            </div>

            <form
              className="message-composer"
              onSubmit={sendMessage}
            >
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={`Message ${selectedConversation.name}...`}
                aria-label={`Message ${selectedConversation.name}`}
              />

              <button
                type="submit"
                disabled={!message.trim()}
                aria-label="Send message"
              >
                ↗
              </button>
            </form>
          </section>
        )}
      </div>
    </section>
  );
}