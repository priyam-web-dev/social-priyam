import {
  useEffect,
  useRef,
  useState,
} from "react";

import Avatar from "../components/Avatar";
import { supabase } from "../lib/supabase";

function getFallbackName(user) {
  return (
    user?.user_metadata?.display_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User"
  );
}

function getFallbackUsername(user) {
  return (
    user?.user_metadata?.username ||
    user?.email?.split("@")[0] ||
    "user"
  );
}

function getFallbackBio(user) {
  return (
    user?.user_metadata?.bio ||
    "Building things, learning things, and making the internet a little less boring."
  );
}

function getFallbackAvatar(user) {
  return (
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    ""
  );
}

function ProfileSquare({
  name = "User",
  src = "",
  size = 92,
  className = "",
  responsive = false,
}) {
  const initial =
    (name || "U")
      .trim()
      .charAt(0)
      .toUpperCase() || "U";

  const dimension =
    responsive
      ? "100%"
      : `${size}px`;

  return (
    <div
      className={className}
      style={{
        width: dimension,
        height: dimension,
        minWidth:
          responsive
            ? "0"
            : dimension,
        minHeight:
          responsive
            ? "0"
            : dimension,
        aspectRatio: "1 / 1",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        borderRadius: "8px",
        border:
          "1px solid var(--text)",
        background:
          "var(--accent)",
        color: "#fff",
        fontFamily:
          "var(--display-font)",
        fontSize: responsive
          ? "clamp(28px, 10vw, 52px)"
          : `${Math.max(
              18,
              Math.round(
                size * 0.29
              )
            )}px`,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            minWidth: "100%",
            minHeight: "100%",
            objectFit: "cover",
            objectPosition:
              "center center",
          }}
        />
      ) : (
        initial
      )}
    </div>
  );
}

function cleanUsername(value = "") {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9_]/g,
      ""
    )
    .slice(0, 24);
}

function formatTime(dateString) {
  if (!dateString) {
    return "";
  }

  const date =
    new Date(dateString);

  const now =
    new Date();

  const difference =
    Math.max(
      0,
      now.getTime() -
        date.getTime()
    );

  const minutes =
    Math.floor(
      difference / 60000
    );

  const hours =
    Math.floor(
      difference / 3600000
    );

  const days =
    Math.floor(
      difference / 86400000
    );

  if (minutes < 1) {
    return "now";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  if (hours < 24) {
    return `${hours}h`;
  }

  if (days < 7) {
    return `${days}d`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
    }
  );
}

function ProfilePage({ user }) {
  const [activeTab, setActiveTab] =
    useState("Posts");

  const [profile, setProfile] =
    useState(null);

  const [stats, setStats] =
    useState({
      posts: 0,
      followers: 0,
      following: 0,
    });

  const [posts, setPosts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [editOpen, setEditOpen] =
    useState(false);

  const [
    savingProfile,
    setSavingProfile,
  ] = useState(false);

  const [editError, setEditError] =
    useState("");

  const [
    editMessage,
    setEditMessage,
  ] = useState("");

  const [editName, setEditName] =
    useState("");

  const [
    editUsername,
    setEditUsername,
  ] = useState("");

  const [editBio, setEditBio] =
    useState("");

  const [
    editAvatarUrl,
    setEditAvatarUrl,
  ] = useState("");

  const [avatarFile, setAvatarFile] =
    useState(null);

  const [
    avatarPreview,
    setAvatarPreview,
  ] = useState("");

  const fileInputRef =
    useRef(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    loadProfile();
  }, [user?.id]);

  useEffect(() => {
    function handlePostCreated() {
      if (user?.id) {
        loadProfile();
      }
    }

    window.addEventListener(
      "social:post-created",
      handlePostCreated
    );

    return () => {
      window.removeEventListener(
        "social:post-created",
        handlePostCreated
      );
    };
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (
        avatarPreview?.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          avatarPreview
        );
      }
    };
  }, [avatarPreview]);

  async function loadProfile() {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, bio, avatar_url"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      setProfile({
        name:
          profileData?.display_name ||
          getFallbackName(user),

        username:
          profileData?.username ||
          getFallbackUsername(
            user
          ),

        bio:
          profileData?.bio ||
          getFallbackBio(user),

        avatarUrl:
          profileData?.avatar_url ||
          getFallbackAvatar(
            user
          ),
      });

      const {
        count: postCount,
      } = await supabase
        .from("posts")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "author_id",
          user.id
        );

      const {
        count: followerCount,
      } = await supabase
        .from("follows")
        .select(
          "follower_id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "following_id",
          user.id
        );

      const {
        count: followingCount,
      } = await supabase
        .from("follows")
        .select(
          "following_id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "follower_id",
          user.id
        );

      setStats({
        posts:
          postCount || 0,
        followers:
          followerCount || 0,
        following:
          followingCount || 0,
      });

      /*
       * IMPORTANT:
       * image_url is now selected.
       */
      const {
        data: postData,
        error: postsError,
      } = await supabase
        .from("posts")
        .select(
          `
            id,
            content,
            image_url,
            created_at,
            likes_count,
            replies_count,
            reposts_count,
            likes,
            replies,
            reposts
          `
        )
        .eq(
          "author_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      /*
       * Some versions of the table may only
       * have likes/replies/reposts or only
       * the *_count fields.
       *
       * If that exact mixed select fails,
       * retry with the fields visible in
       * your current schema.
       */
      if (postsError) {
        const {
          data: fallbackPosts,
          error:
            fallbackError,
        } = await supabase
          .from("posts")
          .select(
            `
              id,
              content,
              image_url,
              created_at,
              likes,
              replies,
              reposts
            `
          )
          .eq(
            "author_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (fallbackError) {
          throw fallbackError;
        }

        setPosts(
          fallbackPosts || []
        );
      } else {
        setPosts(
          postData || []
        );
      }
    } catch (loadError) {
      console.error(
        "Profile loading failed:",
        loadError
      );

      setError(
        "We couldn't load your profile right now."
      );
    } finally {
      setLoading(false);
    }
  }

  function openEditProfile() {
    const current =
      profile || {
        name:
          getFallbackName(user),

        username:
          getFallbackUsername(
            user
          ),

        bio:
          getFallbackBio(user),

        avatarUrl:
          getFallbackAvatar(
            user
          ),
      };

    setEditName(
      current.name || ""
    );

    setEditUsername(
      current.username || ""
    );

    setEditBio(
      current.bio || ""
    );

    setEditAvatarUrl(
      current.avatarUrl || ""
    );

    setAvatarFile(null);

    setAvatarPreview(
      current.avatarUrl || ""
    );

    setEditError("");
    setEditMessage("");
    setEditOpen(true);
  }

  function closeEditProfile() {
    if (savingProfile) {
      return;
    }

    setEditOpen(false);
    setEditError("");
    setEditMessage("");

    if (
      avatarPreview?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        avatarPreview
      );
    }

    setAvatarFile(null);
    setAvatarPreview("");
  }

  function handleAvatarChange(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setEditError("");
    setEditMessage("");

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setEditError(
        "Please choose an image file."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setEditError(
        "Profile picture must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    if (
      avatarPreview?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        avatarPreview
      );
    }

    const previewUrl =
      URL.createObjectURL(
        file
      );

    setAvatarFile(file);
    setAvatarPreview(
      previewUrl
    );
  }

  function removeSelectedAvatar() {
    if (
      avatarPreview?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        avatarPreview
      );
    }

    setAvatarFile(null);
    setAvatarPreview("");
    setEditAvatarUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  }

  async function uploadAvatar(
    file
  ) {
    if (!file) {
      return editAvatarUrl || "";
    }

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";

    const safeExtension =
      [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif",
      ].includes(
        extension
      )
        ? extension
        : "jpg";

    const filePath =
      `${user.id}/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("avatars")
      .upload(
        filePath,
        file,
        {
          cacheControl:
            "3600",
          upsert: false,
          contentType:
            file.type,
        }
      );

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from("avatars")
      .getPublicUrl(
        filePath
      );

    return (
      publicUrlData?.publicUrl ||
      ""
    );
  }

  async function saveProfile(
    event
  ) {
    event.preventDefault();

    if (savingProfile) {
      return;
    }

    setSavingProfile(true);
    setEditError("");
    setEditMessage("");

    try {
      const name =
        editName.trim();

      const username =
        cleanUsername(
          editUsername
        );

      const bio =
        editBio
          .trim()
          .slice(0, 160);

      if (!name) {
        throw new Error(
          "Please enter your name."
        );
      }

      if (name.length > 60) {
        throw new Error(
          "Name can be up to 60 characters."
        );
      }

      if (!username) {
        throw new Error(
          "Please choose a valid username."
        );
      }

      if (username.length < 3) {
        throw new Error(
          "Username must be at least 3 characters."
        );
      }

      const {
        data: existingProfiles,
        error:
          usernameError,
      } = await supabase
        .from("profiles")
        .select("id")
        .eq(
          "username",
          username
        )
        .neq(
          "id",
          user.id
        )
        .limit(1);

      if (usernameError) {
        throw usernameError;
      }

      if (
        existingProfiles &&
        existingProfiles.length >
          0
      ) {
        throw new Error(
          "That username is already taken."
        );
      }

      let avatarUrl =
        editAvatarUrl || "";

      if (avatarFile) {
        avatarUrl =
          await uploadAvatar(
            avatarFile
          );
      }

      const {
        error:
          profileUpdateError,
      } = await supabase
        .from("profiles")
        .update({
          display_name:
            name,

          username,

          bio,

          avatar_url:
            avatarUrl ||
            null,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          user.id
        );

      if (profileUpdateError) {
        throw profileUpdateError;
      }

      await supabase.auth.updateUser(
        {
          data: {
            display_name:
              name,
            username,
            bio,
            avatar_url:
              avatarUrl ||
              null,
          },
        }
      );

      setProfile({
        name,
        username,
        bio:
          bio ||
          "Building things, learning things, and making the internet a little less boring.",
        avatarUrl,
      });

      setEditAvatarUrl(
        avatarUrl
      );

      setAvatarFile(null);

      setEditMessage(
        "Profile updated successfully."
      );

      setTimeout(() => {
        setEditOpen(false);
        setEditMessage("");
      }, 700);
    } catch (saveError) {
      console.error(
        "Profile update failed:",
        saveError
      );

      const message =
        saveError?.message ||
        "";

      if (
        message
          .toLowerCase()
          .includes("duplicate")
      ) {
        setEditError(
          "That username is already taken."
        );
      } else {
        setEditError(
          message ||
            "Couldn't update your profile. Please try again."
        );
      }
    } finally {
      setSavingProfile(
        false
      );
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-loading-avatar" />

          <div className="profile-loading-lines">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  const displayProfile =
    profile || {
      name:
        getFallbackName(
          user
        ),
      username:
        getFallbackUsername(
          user
        ),
      bio:
        getFallbackBio(
          user
        ),
      avatarUrl:
        getFallbackAvatar(
          user
        ),
    };

  return (
    <div className="profile-page">
      {error && (
        <div className="profile-error">
          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={
              loadProfile
            }
          >
            Try again
          </button>
        </div>
      )}

      <section className="profile-header">
        <div className="profile-avatar-wrap">
          <ProfileSquare
            name={
              displayProfile.name
            }
            size={92}
            src={
              displayProfile.avatarUrl ||
              ""
            }
          />

          <span
            className="profile-status"
            aria-label="Online"
          />
        </div>

        <div className="profile-main">
          <div className="profile-name-row">
            <div>
              <h1>
                {displayProfile.name}
              </h1>

              <span>
                @
                {
                  displayProfile.username
                }
              </span>
            </div>

            <button
              type="button"
              className="profile-follow-button following"
              onClick={
                openEditProfile
              }
            >
              Edit profile
            </button>
          </div>

          <p className="profile-bio">
            {
              displayProfile.bio
            }
          </p>

          <div className="profile-stats">
            <button type="button">
              <strong>
                {stats.posts}
              </strong>
              <span>
                posts
              </span>
            </button>

            <button type="button">
              <strong>
                {
                  stats.followers
                }
              </strong>
              <span>
                followers
              </span>
            </button>

            <button type="button">
              <strong>
                {
                  stats.following
                }
              </strong>
              <span>
                following
              </span>
            </button>
          </div>
        </div>
      </section>

      <nav
        className="profile-tabs"
        aria-label="Profile sections"
      >
        {[
          "Posts",
          "Replies",
          "Likes",
        ].map(
          (tab) => (
            <button
              type="button"
              key={tab}
              className={
                activeTab ===
                tab
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(
                  tab
                )
              }
            >
              {tab}
            </button>
          )
        )}
      </nav>

      {activeTab ===
        "Posts" && (
        <div className="profile-posts">
          {posts.length >
          0 ? (
            posts.map(
              (
                post,
                index
              ) => {
                const likes =
                  Number(
                    post.likes ??
                      post.likes_count ??
                      0
                  );

                const replies =
                  Number(
                    post.replies ??
                      post.replies_count ??
                      0
                  );

                const reposts =
                  Number(
                    post.reposts ??
                      post.reposts_count ??
                      0
                  );

                return (
                  <article
                    className="profile-post"
                    key={
                      post.id
                    }
                  >
                    <div className="profile-post-top">
                      <span>
                        {String(
                          index +
                            1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <small>
                        {formatTime(
                          post.created_at
                        )}
                      </small>
                    </div>

                    {post.content && (
                      <p>
                        {
                          post.content
                        }
                      </p>
                    )}

                    {post.image_url && (
                      <div
                        className="profile-post-image"
                        style={{
                          width:
                            "100%",
                          marginTop:
                            post.content
                              ? "14px"
                              : "4px",
                          overflow:
                            "hidden",
                          borderRadius:
                            "10px",
                          border:
                            "1px solid var(--line)",
                          background:
                            "var(--surface-2)",
                        }}
                      >
                        <img
                          src={
                            post.image_url
                          }
                          alt="Post attachment"
                          loading="lazy"
                          style={{
                            display:
                              "block",
                            width:
                              "100%",
                            maxHeight:
                              "460px",
                            objectFit:
                              "contain",
                            background:
                              "var(--surface-2)",
                          }}
                        />
                      </div>
                    )}

                    <div className="profile-post-bottom">
                      <span>
                        ♡{" "}
                        {likes}
                      </span>

                      <span>
                        ○{" "}
                        {replies}
                      </span>

                      <span>
                        ↻{" "}
                        {reposts}
                      </span>
                    </div>
                  </article>
                );
              }
            )
          ) : (
            <div className="quiet-state">
              <strong>
                No posts yet.
              </strong>

              <span>
                Your posts will appear here when you start sharing.
              </span>
            </div>
          )}
        </div>
      )}

      {activeTab ===
        "Replies" && (
        <div className="quiet-state">
          <strong>
            No replies yet.
          </strong>

          <span>
            Replies you make will appear here.
          </span>
        </div>
      )}

      {activeTab ===
        "Likes" && (
        <div className="quiet-state">
          <strong>
            No liked posts yet.
          </strong>

          <span>
            Posts you like will appear here.
          </span>
        </div>
      )}

      {editOpen && (
        <div
          className="profile-edit-overlay"
          role="presentation"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditProfile();
            }
          }}
        >
          <section
            className="profile-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-edit-title"
          >
            <div className="profile-edit-header">
              <div>
                <span className="profile-edit-kicker">
                  YOUR PROFILE
                </span>

                <h2 id="profile-edit-title">
                  Edit profile
                </h2>

                <p>
                  Make your corner feel like yours.
                </p>
              </div>

              <button
                type="button"
                className="profile-edit-close"
                onClick={
                  closeEditProfile
                }
                disabled={
                  savingProfile
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              className="profile-edit-form"
              onSubmit={
                saveProfile
              }
            >
              <div className="profile-edit-avatar-section">
                <div
                  className="profile-edit-avatar"
                  style={{
                    width:
                      "min(180px, 100%)",
                    aspectRatio:
                      "1 / 1",
                    overflow:
                      "hidden",
                    flex:
                      "0 0 auto",
                  }}
                >
                  <ProfileSquare
                    name={
                      editName ||
                      "User"
                    }
                    responsive
                    src={
                      avatarPreview ||
                      ""
                    }
                    className="profile-edit-avatar-image"
                  />
                </div>

                <div className="profile-edit-avatar-actions">
                  <strong>
                    Profile picture
                  </strong>

                  <span>
                    JPG, PNG, WEBP or GIF. Max 5 MB.
                  </span>

                  <div>
                    <button
                      type="button"
                      className="profile-edit-secondary"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      disabled={
                        savingProfile
                      }
                    >
                      {avatarPreview
                        ? "Change photo"
                        : "Upload photo"}
                    </button>

                    {avatarPreview && (
                      <button
                        type="button"
                        className="profile-edit-remove"
                        onClick={
                          removeSelectedAvatar
                        }
                        disabled={
                          savingProfile
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={
                      handleAvatarChange
                    }
                    hidden
                  />
                </div>
              </div>

              <label className="profile-edit-field">
                <span>
                  Name
                </span>

                <input
                  type="text"
                  value={
                    editName
                  }
                  onChange={(
                    event
                  ) =>
                    setEditName(
                      event.target
                        .value
                    )
                  }
                  placeholder="Your name"
                  maxLength={60}
                  autoComplete="name"
                  disabled={
                    savingProfile
                  }
                />

                <small>
                  {editName.length}/60
                </small>
              </label>

              <label className="profile-edit-field">
                <span>
                  Username
                </span>

                <div className="profile-edit-username">
                  <b>
                    @
                  </b>

                  <input
                    type="text"
                    value={
                      editUsername
                    }
                    onChange={(
                      event
                    ) =>
                      setEditUsername(
                        event.target
                          .value
                      )
                    }
                    placeholder="yourname"
                    maxLength={24}
                    autoComplete="username"
                    disabled={
                      savingProfile
                    }
                  />
                </div>

                <small>
                  Letters, numbers and underscores only.
                </small>
              </label>

              <label className="profile-edit-field">
                <span>
                  Bio
                </span>

                <textarea
                  value={
                    editBio
                  }
                  onChange={(
                    event
                  ) =>
                    setEditBio(
                      event.target.value.slice(
                        0,
                        160
                      )
                    )
                  }
                  placeholder="Tell people a little about you..."
                  maxLength={160}
                  rows={4}
                  disabled={
                    savingProfile
                  }
                />

                <small>
                  {editBio.length}/160
                </small>
              </label>

              {editError && (
                <div className="profile-edit-message error">
                  {
                    editError
                  }
                </div>
              )}

              {editMessage && (
                <div className="profile-edit-message success">
                  {
                    editMessage
                  }
                </div>
              )}

              <div className="profile-edit-footer">
                <button
                  type="button"
                  className="profile-edit-cancel"
                  onClick={
                    closeEditProfile
                  }
                  disabled={
                    savingProfile
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-edit-save"
                  disabled={
                    savingProfile
                  }
                >
                  {savingProfile
                    ? "Saving..."
                    : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function NotificationsPage() {
  return (
    <div className="activity-page">
      <div className="utility-bar">
        <span>
          Activity
        </span>
      </div>

      <div className="quiet-state">
        <strong>
          No notifications yet.
        </strong>

        <span>
          When someone interacts with your posts, you'll see it here.
        </span>
      </div>
    </div>
  );
}

export default function BasicPage({
  type,
  user,
}) {
  if (
    type ===
    "notifications"
  ) {
    return (
      <NotificationsPage />
    );
  }

  if (
    type ===
    "profile"
  ) {
    return (
      <ProfilePage
        user={user}
      />
    );
  }

  return null;
}