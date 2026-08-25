import { useEffect, useMemo, useState } from "react";

import Avatar from "../components/Avatar";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

function getDisplayName(profile) {
  return profile?.display_name || profile?.username || "User";
}

function getUsername(profile) {
  return profile?.username || "user";
}

function formatTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();

  const diff = Math.max(0, now.getTime() - date.getTime());

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function formatMessageTime(dateString) {
  if (!dateString) return "";

  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Messages() {
  const { user } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [messages, setMessages] = useState([]);

  const [selectedId, setSelectedId] = useState(null);

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchUsers, setSearchUsers] = useState("");

  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  /*
   * ========================================================
   * LOAD MESSAGING DATA
   * ========================================================
   */

  async function loadMessagingData() {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    setError("");

    const [
      profilesResult,
      membershipsResult,
      conversationsResult,
      messagesResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", {
          ascending: true,
        }),

      supabase
        .from("conversation_members")
        .select("*"),

      supabase
        .from("conversations")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("messages")
        .select("*")
        .order("created_at", {
          ascending: true,
        }),
    ]);

    if (profilesResult.error) {
      console.error(
        "Profiles error:",
        profilesResult.error
      );
    }

    if (membershipsResult.error) {
      console.error(
        "Membership error:",
        membershipsResult.error
      );
    }

    if (conversationsResult.error) {
      console.error(
        "Conversations error:",
        conversationsResult.error
      );
    }

    if (messagesResult.error) {
      console.error(
        "Messages error:",
        messagesResult.error
      );
    }

    if (
      profilesResult.error ||
      membershipsResult.error ||
      conversationsResult.error ||
      messagesResult.error
    ) {
      setError("Couldn't load your conversations.");
      setLoading(false);
      return;
    }

    setProfiles(profilesResult.data || []);
    setMemberships(membershipsResult.data || []);
    setConversations(conversationsResult.data || []);
    setMessages(messagesResult.data || []);

    setLoading(false);
  }

  useEffect(() => {
    loadMessagingData();
  }, [user?.id]);

  /*
   * ========================================================
   * REAL USER SEARCH
   * ========================================================
   */

  useEffect(() => {
    if (!showNewMessage || !user?.id) {
      return;
    }

    let cancelled = false;

    async function searchRealUsers() {
      setUsersLoading(true);

      const query = searchUsers.trim();

      let request = supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .order("created_at", {
          ascending: true,
        })
        .limit(30);

      if (query) {
        request = request.or(
          `username.ilike.%${query}%,display_name.ilike.%${query}%`
        );
      }

      const { data, error: searchError } =
        await request;

      if (cancelled) {
        return;
      }

      if (searchError) {
        console.error(
          "User search error:",
          searchError
        );

        setError("Couldn't search users.");
        setUsersLoading(false);

        return;
      }

      setProfiles((current) => {
        const merged = [...current];

        (data || []).forEach((profile) => {
          const exists = merged.some(
            (item) => item.id === profile.id
          );

          if (!exists) {
            merged.push(profile);
          }
        });

        return merged;
      });

      setUsersLoading(false);
    }

    const timer = setTimeout(
      searchRealUsers,
      150
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    showNewMessage,
    searchUsers,
    user?.id,
  ]);

  /*
   * ========================================================
   * PROFILE MAP
   * ========================================================
   */

  const profileMap = useMemo(() => {
    const map = {};

    profiles.forEach((profile) => {
      map[profile.id] = profile;
    });

    return map;
  }, [profiles]);

  /*
   * ========================================================
   * BUILD CONVERSATIONS
   *
   * IMPORTANT:
   * A conversation has two membership rows.
   * We therefore build one UI conversation per
   * conversation ID instead of mapping every membership row.
   * ========================================================
   */

  const conversationData = useMemo(() => {
    if (!user?.id) {
      return [];
    }

    const uniqueConversations = new Map();

    conversations.forEach((conversation) => {
      const conversationMemberships =
        memberships.filter(
          (membership) =>
            membership.conversation_id ===
            conversation.id
        );

      const memberIds =
        conversationMemberships.map(
          (membership) => membership.user_id
        );

      if (!memberIds.includes(user.id)) {
        return;
      }

      const otherUserId = memberIds.find(
        (id) => id !== user.id
      );

      if (!otherUserId) {
        return;
      }

      const otherProfile =
        profileMap[otherUserId];

      if (!otherProfile) {
        return;
      }

      const conversationMessages =
        messages
          .filter(
            (item) =>
              item.conversation_id ===
              conversation.id
          )
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );

      const lastMessage =
        conversationMessages[
          conversationMessages.length - 1
        ];

      uniqueConversations.set(
        conversation.id,
        {
          id: conversation.id,
          otherUserId,
          profile: otherProfile,
          messages: conversationMessages,
          preview:
            lastMessage?.content ||
            "No messages yet.",
          time: lastMessage
            ? formatTime(
                lastMessage.created_at
              )
            : formatTime(
                conversation.created_at
              ),
          createdAt:
            conversation.created_at,
        }
      );
    });

    return Array.from(
      uniqueConversations.values()
    ).sort((a, b) => {
      const aTime = new Date(
        a.messages[a.messages.length - 1]
          ?.created_at ||
          a.createdAt
      ).getTime();

      const bTime = new Date(
        b.messages[b.messages.length - 1]
          ?.created_at ||
          b.createdAt
      ).getTime();

      return bTime - aTime;
    });
  }, [
    memberships,
    conversations,
    messages,
    profileMap,
    user?.id,
  ]);

  /*
   * ========================================================
   * SELECTED CONVERSATION
   * ========================================================
   */

  const selectedConversation =
    conversationData.find(
      (conversation) =>
        conversation.id === selectedId
    ) || null;

  /*
   * ========================================================
   * CONVERSATION SEARCH
   * ========================================================
   */

  const filteredConversations = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return conversationData;
    }

    return conversationData.filter(
      (conversation) => {
        const name = getDisplayName(
          conversation.profile
        ).toLowerCase();

        const handle = getUsername(
          conversation.profile
        ).toLowerCase();

        const preview =
          conversation.preview.toLowerCase();

        return (
          name.includes(query) ||
          handle.includes(query) ||
          preview.includes(query)
        );
      }
    );
  }, [
    conversationData,
    search,
  ]);

  /*
   * ========================================================
   * AVAILABLE USERS
   * ========================================================
   */


  /*
   * ========================================================
   * SELECT CONVERSATION
   * ========================================================
   */

  function selectConversation(id) {
    setSelectedId(id);
    setShowNewMessage(false);
    setSearchUsers("");
    setError("");
    setMessage("");
  }

  /*
   * ========================================================
   * START NEW CONVERSATION
   * ========================================================
   */

  async function startConversation(otherUser) {
    if (!user?.id || !otherUser?.id) {
      return;
    }

    setError("");

    try {
      const {
        data: conversationId,
        error: conversationError,
      } = await supabase.rpc(
        "create_conversation",
        {
          p_recipient_id: otherUser.id,
        }
      );

      if (conversationError) {
        console.error(
          "Conversation RPC failed:",
          conversationError
        );

        setError(
          conversationError.message ||
            "Couldn't start the conversation."
        );

        return;
      }

      if (!conversationId) {
        setError(
          "Conversation could not be created."
        );

        return;
      }

      await loadMessagingData();

      setShowNewMessage(false);
      setSearchUsers("");
      setSelectedId(conversationId);
    } catch (rpcError) {
      console.error(
        "Unexpected conversation error:",
        rpcError
      );

      setError(
        rpcError?.message ||
          "Couldn't start the conversation."
      );
    }
  }

  /*
   * ========================================================
   * SEND MESSAGE
   * ========================================================
   */

  async function sendMessage(event) {
    event.preventDefault();

    const cleanMessage =
      message.trim();

    if (
      !cleanMessage ||
      !selectedConversation ||
      !user?.id ||
      sending
    ) {
      return;
    }

    setSending(true);
    setError("");

    const {
      data,
      error: sendError,
    } = await supabase
      .from("messages")
      .insert({
        conversation_id:
          selectedConversation.id,
        sender_id: user.id,
        content: cleanMessage,
      })
      .select()
      .single();

    if (sendError) {
      console.error(
        "Message send failed:",
        sendError
      );

      setError(
        sendError.message ||
          "Couldn't send your message."
      );

      setSending(false);

      return;
    }

    setMessages((current) => [
      ...current,
      data,
    ]);

    setMessage("");
    setSending(false);
  }

  /*
   * ========================================================
   * RENDER
   * ========================================================
   */

  return (
    <section className="messages-page">
      <div className="messages-layout">

        {/* LEFT SIDEBAR */}

        <aside className="messages-sidebar">

          <div className="messages-toolbar">

            <button
              type="button"
              className="new-message-button"
              onClick={() => {
                setShowNewMessage(true);
                setSelectedId(null);
                setSearchUsers("");
                setError("");
              }}
              aria-label="New message"
            >
              +
            </button>

            <label className="messages-search">
              <span>⌕</span>

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search conversations"
                aria-label="Search conversations"
              />
            </label>

          </div>

          {showNewMessage ? (

            <div className="new-message-panel">

              <div className="new-message-heading">

                <strong>
                  New message
                </strong>

                <button
                  type="button"
                  onClick={() => {
                    setShowNewMessage(false);
                    setSearchUsers("");
                    setError("");
                  }}
                >
                  Cancel
                </button>

              </div>

              <input
                className="new-message-search"
                type="search"
                value={searchUsers}
                onChange={(event) =>
                  setSearchUsers(
                    event.target.value
                  )
                }
                placeholder="Search people"
                aria-label="Search people"
                autoFocus
              />

              <div className="new-message-users">

                {usersLoading ? (

                  <div className="chat-search-empty">
                    Searching people...
                  </div>

                ) : availableUsers.length === 0 ? (

                  <div className="chat-search-empty">

                    <strong>
                      No other users found.
                    </strong>

                    <span>
                      Try another name or username.
                    </span>

                  </div>

                ) : (

                  availableUsers.map(
                    (profile) => (

                      <button
                        type="button"
                        className="new-message-user"
                        key={profile.id}
                        onClick={() =>
                          startConversation(
                            profile
                          )
                        }
                      >

                        <Avatar
                          name={getDisplayName(
                            profile
                          )}
                          size="sm"
                          src={
                            profile.avatar_url ||
                            undefined
                          }
                        />

                        <span>

                          <strong>
                            {getDisplayName(
                              profile
                            )}
                          </strong>

                          <small>
                            @
                            {getUsername(
                              profile
                            )}
                          </small>

                        </span>

                      </button>

                    )
                  )

                )}

              </div>

            </div>

          ) : (

            <div className="conversation-list">

              {loading ? (

                <div className="chat-search-empty">
                  Loading conversations...
                </div>

              ) : filteredConversations.length ===
                0 ? (

                <div className="chat-search-empty">

                  <strong>
                    No conversations yet.
                  </strong>

                  <span>
                    Start a conversation with
                    another member.
                  </span>

                </div>

              ) : (

                filteredConversations.map(
                  (conversation) => {

                    const profile =
                      conversation.profile;

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        className={
                          conversation.id ===
                          selectedId
                            ? "conversation active"
                            : "conversation"
                        }
                        onClick={() =>
                          selectConversation(
                            conversation.id
                          )
                        }
                      >

                        <div className="conversation-avatar">

                          <Avatar
                            name={getDisplayName(
                              profile
                            )}
                            src={
                              profile.avatar_url ||
                              undefined
                            }
                          />

                        </div>

                        <span className="conversation-copy">

                          <strong>
                            {getDisplayName(
                              profile
                            )}
                          </strong>

                          <small>
                            {conversation.preview}
                          </small>

                        </span>

                        <span className="conversation-meta">

                          <time>
                            {conversation.time}
                          </time>

                        </span>

                      </button>
                    );
                  }
                )

              )}

            </div>

          )}

        </aside>

        {/* RIGHT CHAT */}

        {selectedConversation ? (

          <section className="conversation-panel">

            <header className="conversation-header">

              <button
                type="button"
                className="chat-back"
                onClick={() =>
                  setSelectedId(null)
                }
                aria-label="Back to conversations"
              >
                ←
              </button>

              <Avatar
                name={getDisplayName(
                  selectedConversation.profile
                )}
                size="sm"
                src={
                  selectedConversation.profile
                    .avatar_url ||
                  undefined
                }
              />

              <div>

                <strong>
                  {getDisplayName(
                    selectedConversation.profile
                  )}
                </strong>

                <span>
                  @
                  {getUsername(
                    selectedConversation.profile
                  )}
                </span>

              </div>

              <button
                type="button"
                className="chat-more"
                aria-label="Conversation options"
              >
                ···
              </button>

            </header>

            <div className="conversation-messages">

              <div className="conversation-start">

                <Avatar
                  name={getDisplayName(
                    selectedConversation.profile
                  )}
                  size="lg"
                  src={
                    selectedConversation.profile
                      .avatar_url ||
                    undefined
                  }
                />

                <strong>
                  {getDisplayName(
                    selectedConversation.profile
                  )}
                </strong>

                <span>
                  @
                  {getUsername(
                    selectedConversation.profile
                  )}
                </span>

              </div>

              {selectedConversation.messages.map(
                (item) => (

                  <div
                    key={item.id}
                    className={
                      item.sender_id === user?.id
                        ? "message-row mine"
                        : "message-row"
                    }
                  >

                    <div className="message-bubble">

                      <p>
                        {item.content}
                      </p>

                      <time>
                        {formatMessageTime(
                          item.created_at
                        )}
                      </time>

                    </div>

                  </div>

                )
              )}

              {selectedConversation.messages.length ===
                0 && (

                <div className="chat-empty">

                  <strong>
                    Start the conversation.
                  </strong>

                  <span>
                    Send a message to{" "}
                    {getDisplayName(
                      selectedConversation.profile
                    )}
                    .
                  </span>

                </div>

              )}

            </div>

            {error && (
              <div className="message-error">
                {error}
              </div>
            )}

            <form
              className="message-composer"
              onSubmit={sendMessage}
            >

              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                placeholder={`Message ${getDisplayName(
                  selectedConversation.profile
                )}...`}
                aria-label={`Message ${getDisplayName(
                  selectedConversation.profile
                )}`}
                maxLength={2000}
              />

              <button
                type="submit"
                disabled={
                  !message.trim() ||
                  sending
                }
                aria-label="Send message"
              >
                {sending ? "…" : "↗"}
              </button>

            </form>

          </section>

        ) : (

          <section className="conversation-panel conversation-empty-panel">

            <div className="conversation-empty">

              <div className="conversation-empty-mark">
                S
              </div>

              <strong>
                Find someone to message.
              </strong>

              <span>
                Choose a real member to start
                a conversation.
              </span>

              {error && (
                <div className="message-error">
                  {error}
                </div>
              )}

              {!showNewMessage && (

                <button
                  type="button"
                  onClick={() => {
                    setShowNewMessage(true);
                    setSearchUsers("");
                    setError("");
                  }}
                >
                  New message
                </button>

              )}

            </div>

          </section>

        )}

      </div>
    </section>
  );
}