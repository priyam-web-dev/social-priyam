import { useEffect, useRef, useState } from "react";

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

function cleanUsername(value = "") {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

/* =========================================================
   IMAGE COMPRESSION
   Compress client-side before Supabase storage upload.
   Target is roughly 30% storage reduction while preserving
   the original aspect ratio. Small files are never inflated.
   ========================================================= */
async function compressImageForUpload(file, targetRatio = 0.7) {
  if (!file || !file.type?.startsWith("image/")) {
    return file;
  }

  if (file.size < 150 * 1024) {
    return file;
  }

  const bitmap = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the selected image."));
    };

    image.src = url;
  });

  const maxDimension = 2400;
  const sourceWidth = bitmap.naturalWidth || bitmap.width;
  const sourceHeight = bitmap.naturalHeight || bitmap.height;
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    return file;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);

  const mimeType = "image/webp";
  const targetBytes = Math.floor(file.size * targetRatio);

  const makeBlob = (quality) =>
    new Promise((resolve) =>
      canvas.toBlob(resolve, mimeType, quality)
    );

  let best = await makeBlob(0.86);

  if (!best) {
    return file;
  }

  if (best.size > targetBytes) {
    for (const quality of [0.82, 0.78, 0.74, 0.70, 0.66, 0.62, 0.58, 0.54]) {
      const candidate = await makeBlob(quality);
      if (!candidate) continue;
      best = candidate;
      if (candidate.size <= targetBytes) break;
    }
  }

  // Never replace an image with a larger file.
  if (best.size >= file.size) {
    return file;
  }

  const baseName =
    file.name.replace(/\.[^.]+$/, "") || "image";

  return new File(
    [best],
    `${baseName}.webp`,
    {
      type: mimeType,
      lastModified: Date.now(),
    }
  );
}

function getPostImageUrl(post) {
  const candidates = [
    post?.image_url,
    post?.imageUrl,
    post?.media_url,
    post?.mediaUrl,
    post?.attachment_url,
    post?.attachmentUrl,
  ];

  const explicit = candidates.find(
    (value) => typeof value === "string" && value.trim()
  );

  if (explicit) return explicit.trim();

  const content =
    typeof post?.content === "string"
      ? post.content.trim()
      : "";

  if (/^https?:\/\/.+\.(?:jpe?g|png|webp|gif)(?:[?#].*)?$/i.test(content)) {
    return content;
  }

  return "";
}

function isImageOnlyPost(post) {
  const imageUrl = getPostImageUrl(post);
  const content =
    typeof post?.content === "string"
      ? post.content.trim()
      : "";

  return Boolean(
    imageUrl &&
    content === imageUrl &&
    /^https?:\/\//i.test(content)
  );
}

function ProfilePage({ user }) {
  const [activeTab, setActiveTab] = useState("Posts");

  const [profile, setProfile] = useState(null);

  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });

  const [posts, setPosts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    loadProfile();
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      /*
       * ------------------------------------------
       * 1. LOAD REAL PROFILE
       * ------------------------------------------
       */

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
          getFallbackUsername(user),

        bio:
          profileData?.bio ||
          getFallbackBio(user),

        avatarUrl:
          profileData?.avatar_url ||
          getFallbackAvatar(user),
      });

      /*
       * ------------------------------------------
       * 2. LOAD POST COUNT
       * ------------------------------------------
       */

      const {
        count: postCount,
        error: postCountError,
      } = await supabase
        .from("posts")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("author_id", user.id);

      if (postCountError) {
        console.error(
          "Post count error:",
          postCountError
        );
      }

      /*
       * ------------------------------------------
       * 3. LOAD FOLLOWER COUNT
       * ------------------------------------------
       */

      const {
        count: followerCount,
        error: followerError,
      } = await supabase
        .from("follows")
        .select("follower_id", {
          count: "exact",
          head: true,
        })
        .eq("following_id", user.id);

      if (followerError) {
        console.error(
          "Follower count error:",
          followerError
        );
      }

      /*
       * ------------------------------------------
       * 4. LOAD FOLLOWING COUNT
       * ------------------------------------------
       */

      const {
        count: followingCount,
        error: followingError,
      } = await supabase
        .from("follows")
        .select("following_id", {
          count: "exact",
          head: true,
        })
        .eq("follower_id", user.id);

      if (followingError) {
        console.error(
          "Following count error:",
          followingError
        );
      }

      setStats({
        posts: postCount || 0,
        followers: followerCount || 0,
        following: followingCount || 0,
      });

      /*
       * ------------------------------------------
       * 5. LOAD REAL POSTS
       * ------------------------------------------
       */

      const {
        data: postData,
        error: postsError,
      } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (postsError) {
        console.error(
          "Posts loading error:",
          postsError
        );

        setPosts([]);
      } else {
        setPosts(postData || []);
      }
    } catch (err) {
      console.error(
        "Profile loading failed:",
        err
      );

      setError(
        "We couldn't load your profile right now."
      );
    } finally {
      setLoading(false);
    }
  }

  function openEditProfile() {
    const current = profile || {
      name: getFallbackName(user),
      username: getFallbackUsername(user),
      bio: getFallbackBio(user),
      avatarUrl: getFallbackAvatar(user),
    };

    setEditName(current.name || "");
    setEditUsername(current.username || "");
    setEditBio(current.bio || "");
    setEditAvatarUrl(current.avatarUrl || "");

    setAvatarFile(null);
    setAvatarPreview(current.avatarUrl || "");

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

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(null);
    setAvatarPreview("");
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setEditError("");
    setEditMessage("");

    if (!file.type.startsWith("image/")) {
      setEditError(
        "Please choose an image file."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditError(
        "Profile picture must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setAvatarFile(file);
    setAvatarPreview(previewUrl);
  }

  function removeSelectedAvatar() {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(null);
    setAvatarPreview("");
    setEditAvatarUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadAvatar(file) {
    if (!file) {
      return editAvatarUrl || "";
    }

    const compressedFile =
      await compressImageForUpload(file, 0.7);

    const extension =
      compressedFile.name.split(".").pop()?.toLowerCase() ||
      "webp";

    const safeExtension = [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif",
    ].includes(extension)
      ? extension
      : "webp";

    /*
     * Each upload gets its own filename.
     * This avoids stale browser/CDN cache.
     */
    const filePath =
      `${user.id}/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("avatars")
      .upload(filePath, compressedFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: compressedFile.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || "";
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (savingProfile) {
      return;
    }

    setSavingProfile(true);
    setEditError("");
    setEditMessage("");

    try {
      const name = editName.trim();
      const username = cleanUsername(editUsername);
      const bio = editBio.trim().slice(0, 160);

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

      /*
       * ------------------------------------------
       * CHECK USERNAME AVAILABILITY
       * ------------------------------------------
       */

      const {
        data: existingProfiles,
        error: usernameError,
      } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", user.id)
        .limit(1);

      if (usernameError) {
        throw usernameError;
      }

      if (
        existingProfiles &&
        existingProfiles.length > 0
      ) {
        throw new Error(
          "That username is already taken."
        );
      }

      /*
       * ------------------------------------------
       * UPLOAD NEW AVATAR
       * ------------------------------------------
       */

      let avatarUrl = editAvatarUrl || "";

      if (avatarFile) {
        avatarUrl = await uploadAvatar(
          avatarFile
        );
      }

      /*
       * ------------------------------------------
       * UPDATE PROFILES TABLE
       * ------------------------------------------
       */

      const {
        error: profileUpdateError,
      } = await supabase
        .from("profiles")
        .update({
          display_name: name,
          username,
          bio,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileUpdateError) {
        throw profileUpdateError;
      }

      /*
       * ------------------------------------------
       * KEEP SUPABASE AUTH METADATA IN SYNC
       * ------------------------------------------
       */

      const {
        error: metadataError,
      } = await supabase.auth.updateUser({
        data: {
          display_name: name,
          username,
          bio,
          avatar_url: avatarUrl || null,
        },
      });

      if (metadataError) {
        console.warn(
          "Auth metadata update failed:",
          metadataError
        );
      }

      /*
       * ------------------------------------------
       * UPDATE UI IMMEDIATELY
       * ------------------------------------------
       */

      setProfile({
        name,
        username,
        bio:
          bio ||
          "Building things, learning things, and making the internet a little less boring.",
        avatarUrl,
      });

      setEditAvatarUrl(avatarUrl);
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
        saveError?.message || "";

      if (
        message
          .toLowerCase()
          .includes("duplicate")
      ) {
        setEditError(
          "That username is already taken."
        );
      } else if (
        message
          .toLowerCase()
          .includes("row-level security")
      ) {
        setEditError(
          "You don't have permission to update this profile."
        );
      } else {
        setEditError(
          message ||
            "Couldn't update your profile. Please try again."
        );
      }
    } finally {
      setSavingProfile(false);
    }
  }

  function formatTime(dateString) {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);
    const now = new Date();

    const difference =
      now.getTime() - date.getTime();

    const minutes = Math.floor(
      difference / 60000
    );

    if (minutes < 1) {
      return "now";
    }

    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours}h`;
    }

    const days = Math.floor(
      hours / 24
    );

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

  const displayProfile = profile || {
    name: getFallbackName(user),
    username: getFallbackUsername(user),
    bio: getFallbackBio(user),
    avatarUrl: getFallbackAvatar(user),
  };

  return (
    <div className="profile-page">
      {error && (
        <div className="profile-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadProfile}
          >
            Try again
          </button>
        </div>
      )}

      <section className="profile-header">
        <div className="profile-avatar-wrap">
          <Avatar
            name={displayProfile.name}
            size="lg"
            src={
              displayProfile.avatarUrl ||
              undefined
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
              <h1>{displayProfile.name}</h1>

              <span>
                @{displayProfile.username}
              </span>
            </div>

            <button
              type="button"
              className="profile-follow-button following"
              onClick={openEditProfile}
            >
              Edit profile
            </button>
          </div>

          <p className="profile-bio">
            {displayProfile.bio}
          </p>

          <div className="profile-stats">
            <button type="button">
              <strong>{stats.posts}</strong>
              <span>posts</span>
            </button>

            <button type="button">
              <strong>
                {stats.followers}
              </strong>
              <span>followers</span>
            </button>

            <button type="button">
              <strong>
                {stats.following}
              </strong>
              <span>following</span>
            </button>
          </div>
        </div>
      </section>

      <nav
        className="profile-tabs"
        aria-label="Profile sections"
      >
        {["Posts", "Replies", "Likes"].map(
          (tab) => (
            <button
              type="button"
              key={tab}
              className={
                activeTab === tab
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(tab)
              }
            >
              {tab}
            </button>
          )
        )}
      </nav>

      {activeTab === "Posts" && (
        <div className="profile-posts">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <article
                className="profile-post"
                key={post.id}
              >
                <div className="profile-post-top">
                  <span>
                    {String(
                      index + 1
                    ).padStart(2, "0")}
                  </span>

                  <small>
                    {formatTime(
                      post.created_at
                    )}
                  </small>
                </div>

                <div className="profile-post-content">
                  {getPostImageUrl(post) && (
                    <div className="profile-post-image-wrap">
                      <img
                        className="profile-post-image"
                        src={getPostImageUrl(post)}
                        alt={
                          isImageOnlyPost(post)
                            ? "Post image"
                            : "Attached post image"
                        }
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}

                  {!isImageOnlyPost(post) && post.content && (
                    <p>{post.content}</p>
                  )}
                </div>

                <div className="profile-post-bottom">
                  <span>
                    ♡{" "}
                    {post.likes_count || 0}
                  </span>

                  <span>
                    ○{" "}
                    {post.replies_count ||
                      0}
                  </span>

                  <span>
                    ↻{" "}
                    {post.reposts_count ||
                      0}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="quiet-state">
              <strong>
                No posts yet.
              </strong>

              <span>
                Your posts will appear here
                when you start sharing.
              </span>
            </div>
          )}
        </div>
      )}

      {activeTab === "Replies" && (
        <div className="quiet-state">
          <strong>
            No replies yet.
          </strong>

          <span>
            Replies you make will appear
            here.
          </span>
        </div>
      )}

      {activeTab === "Likes" && (
        <div className="quiet-state">
          <strong>
            No liked posts yet.
          </strong>

          <span>
            Posts you like will appear
            here.
          </span>
        </div>
      )}

      {editOpen && (
        <div
          className="profile-edit-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
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
                  Make your corner feel like
                  yours.
                </p>
              </div>

              <button
                type="button"
                className="profile-edit-close"
                onClick={closeEditProfile}
                disabled={savingProfile}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              className="profile-edit-form"
              onSubmit={saveProfile}
            >
              <div className="profile-edit-avatar-section">
                <div className="profile-edit-avatar">
                  <Avatar
                    name={editName || "User"}
                    size="lg"
                    src={
                      avatarPreview ||
                      undefined
                    }
                  />
                </div>

                <div className="profile-edit-avatar-actions">
                  <strong>
                    Profile picture
                  </strong>

                  <span>
                    JPG, PNG, WEBP or GIF.
                    Max 5 MB.
                  </span>

                  <div>
                    <button
                      type="button"
                      className="profile-edit-secondary"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      disabled={savingProfile}
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
                    ref={fileInputRef}
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
                <span>Name</span>

                <input
                  type="text"
                  value={editName}
                  onChange={(event) =>
                    setEditName(
                      event.target.value
                    )
                  }
                  placeholder="Your name"
                  maxLength={60}
                  autoComplete="name"
                  disabled={savingProfile}
                />

                <small>
                  {editName.length}/60
                </small>
              </label>

              <label className="profile-edit-field">
                <span>Username</span>

                <div className="profile-edit-username">
                  <b>@</b>

                  <input
                    type="text"
                    value={editUsername}
                    onChange={(event) =>
                      setEditUsername(
                        event.target.value
                      )
                    }
                    placeholder="yourname"
                    maxLength={24}
                    autoComplete="username"
                    disabled={savingProfile}
                  />
                </div>

                <small>
                  Letters, numbers and
                  underscores only.
                </small>
              </label>

              <label className="profile-edit-field">
                <span>Bio</span>

                <textarea
                  value={editBio}
                  onChange={(event) =>
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
                  disabled={savingProfile}
                />

                <small>
                  {editBio.length}/160
                </small>
              </label>

              {editError && (
                <div className="profile-edit-message error">
                  {editError}
                </div>
              )}

              {editMessage && (
                <div className="profile-edit-message success">
                  {editMessage}
                </div>
              )}

              <div className="profile-edit-footer">
                <button
                  type="button"
                  className="profile-edit-cancel"
                  onClick={closeEditProfile}
                  disabled={savingProfile}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-edit-save"
                  disabled={savingProfile}
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
        <span>Activity</span>
      </div>

      <div className="quiet-state">
        <strong>
          No notifications yet.
        </strong>

        <span>
          When someone interacts with
          your posts, you'll see it here.
        </span>
      </div>
    </div>
  );
}

export default function BasicPage({
  type,
  user,
}) {
  if (type === "notifications") {
    return <NotificationsPage />;
  }

  if (type === "profile") {
    return (
      <ProfilePage user={user} />
    );
  }

  return null;
}