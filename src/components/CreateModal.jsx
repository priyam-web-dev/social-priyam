import {
  useEffect,
  useRef,
  useState,
} from "react";

import Avatar from "./Avatar";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const MAX_LENGTH = 500;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const TARGET_COMPRESSION_RATIO = 0.7;

function getDisplayName(user) {
  return (
    user?.user_metadata?.display_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User"
  );
}

function getUsername(user) {
  return (
    user?.user_metadata?.username ||
    user?.email?.split("@")[0] ||
    "user"
  );
}

function getAvatarUrl(user) {
  return (
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    ""
  );
}

function getFileExtension(file) {
  const extension =
    file?.name?.split(".").pop()?.toLowerCase() ||
    "jpg";

  if (extension === "jpeg") {
    return "jpg";
  }

  return extension;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl =
      URL.createObjectURL(file);

    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "The selected image couldn't be read."
        )
      );
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(
  canvas,
  type,
  quality
) {
  return new Promise((resolve) => {
    canvas.toBlob(
      resolve,
      type,
      quality
    );
  });
}

async function compressImage(file) {
  /*
   * Do not convert GIFs.
   * Canvas would flatten animated GIFs.
   */
  if (file.type === "image/gif") {
    return file;
  }

  /*
   * Small files are already small.
   */
  if (file.size <= 200 * 1024) {
    return file;
  }

  const image =
    await loadImage(file);

  if (
    !image.naturalWidth ||
    !image.naturalHeight
  ) {
    return file;
  }

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    image.naturalWidth;

  canvas.height =
    image.naturalHeight;

  const context =
    canvas.getContext(
      "2d"
    );

  if (!context) {
    return file;
  }

  context.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const targetSize =
    file.size *
    TARGET_COMPRESSION_RATIO;

  /*
   * Try progressively lower WebP quality.
   */
  const qualities = [
    0.82,
    0.76,
    0.70,
    0.64,
    0.58,
  ];

  let bestBlob = null;

  for (const quality of qualities) {
    const blob =
      await canvasToBlob(
        canvas,
        "image/webp",
        quality
      );

    if (!blob) {
      continue;
    }

    /*
     * Never use a compressed file if it
     * became larger than the original.
     */
    if (blob.size >= file.size) {
      continue;
    }

    bestBlob = blob;

    /*
     * Target approximately 30% reduction.
     */
    if (
      blob.size <= targetSize
    ) {
      break;
    }
  }

  if (!bestBlob) {
    return file;
  }

  /*
   * Keep original dimensions and aspect ratio.
   */
  return new File(
    [bestBlob],
    `${file.name.replace(
      /\.[^/.]+$/,
      ""
    )}.webp`,
    {
      type: "image/webp",
      lastModified: Date.now(),
    }
  );
}

export default function CreateModal({
  onClose,
}) {
  const { user } = useAuth();

  const [text, setText] =
    useState("");

  const [imageFile, setImageFile] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [posting, setPosting] =
    useState(false);

  const [error, setError] =
    useState("");

  const textareaRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  const displayName =
    getDisplayName(user);

  const username =
    getUsername(user);

  const avatarUrl =
    getAvatarUrl(user);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (
        event.key === "Escape" &&
        !posting
      ) {
        onClose();
      }

      if (
        (event.metaKey ||
          event.ctrlKey) &&
        event.key === "Enter"
      ) {
        event.preventDefault();

        if (!posting) {
          publishPost();
        }
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    posting,
    text,
    imageFile,
  ]);

  useEffect(() => {
    return () => {
      if (
        imagePreview?.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          imagePreview
        );
      }
    };
  }, [imagePreview]);

  function handleImageChange(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    if (
      !ALLOWED_TYPES.includes(
        file.type
      )
    ) {
      setError(
        "Please choose a JPG, PNG, WEBP or GIF image."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size > MAX_FILE_SIZE
    ) {
      setError(
        "Image must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    if (
      imagePreview?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    setImageFile(file);
    setImagePreview(previewUrl);
  }

  function removeImage() {
    if (
      imagePreview?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setImageFile(null);
    setImagePreview("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  }

  async function uploadImage() {
    if (
      !imageFile ||
      !user?.id
    ) {
      return "";
    }

    /*
     * Compression happens HERE,
     * before Supabase Storage upload.
     */
    const uploadFile =
      await compressImage(
        imageFile
      );

    const extension =
      getFileExtension(
        uploadFile
      );

    const filePath =
      `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const {
      data,
      error: uploadError,
    } =
      await supabase.storage
        .from("posts")
        .upload(
          filePath,
          uploadFile,
          {
            cacheControl: "3600",
            contentType:
              uploadFile.type,
            upsert: false,
          }
        );

    if (uploadError) {
      console.error(
        "Supabase image upload failed:",
        uploadError
      );

      throw new Error(
        uploadError.message ||
          "Image upload failed."
      );
    }

    if (!data?.path) {
      throw new Error(
        "Image uploaded, but Supabase did not return a file path."
      );
    }

    const {
      data: publicUrlData,
    } =
      supabase.storage
        .from("posts")
        .getPublicUrl(
          data.path
        );

    const publicUrl =
      publicUrlData?.publicUrl ||
      "";

    if (!publicUrl) {
      throw new Error(
        "Image uploaded, but a public image URL could not be created."
      );
    }

    return publicUrl;
  }

  async function publishPost() {
    const cleanText =
      text.trim();

    if (
      (!cleanText &&
        !imageFile) ||
      posting
    ) {
      return;
    }

    if (!user?.id) {
      setError(
        "You need to be logged in to post."
      );

      return;
    }

    setPosting(true);
    setError("");

    try {
      /*
       * STEP 1
       * Compress + upload image.
       */
      const imageUrl =
        await uploadImage();

      /*
       * STEP 2
       * Save image_url in database.
       */
      const postPayload = {
        author_id: user.id,
        author_name: displayName,
        author_username: username,
        author_avatar:
          avatarUrl || null,
        content: cleanText,
        image_url:
          imageUrl || null,
        likes: 0,
        replies: 0,
        reposts: 0,
      };

      const {
        data: savedPost,
        error: insertError,
      } =
        await supabase
          .from("posts")
          .insert(
            postPayload
          )
          .select("*")
          .single();

      if (insertError) {
        console.error(
          "Post insert failed:",
          insertError
        );

        throw new Error(
          insertError.message ||
            "Couldn't save your post."
        );
      }

      /*
       * STEP 3
       * Tell Home/Profile.
       */
      window.dispatchEvent(
        new CustomEvent(
          "social:post-created",
          {
            detail: savedPost,
          }
        )
      );

      /*
       * STEP 4
       * Reset.
       */
      setText("");
      removeImage();

      window.setTimeout(() => {
        onClose();
      }, 150);
    } catch (postError) {
      console.error(
        "Failed to publish post:",
        postError
      );

      setError(
        postError?.message ||
          "Couldn't publish your post. Please try again."
      );
    } finally {
      setPosting(false);
    }
  }

  function handleBackdropClick(
    event
  ) {
    if (
      event.target ===
        event.currentTarget &&
      !posting
    ) {
      onClose();
    }
  }

  const remaining =
    MAX_LENGTH - text.length;

  const hasContent =
    Boolean(text.trim()) ||
    Boolean(imageFile);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={
        handleBackdropClick
      }
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
            <span className="create-kicker">
              SHARE SOMETHING
            </span>

            <h2 id="create-post-title">
              New post.
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={posting}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="create-author">
          <Avatar
            name={displayName}
            src={
              avatarUrl ||
              undefined
            }
          />

          <div>
            <strong>
              {displayName}
            </strong>

            <small>
              @{username}
            </small>
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) =>
            setText(
              event.target.value.slice(
                0,
                MAX_LENGTH
              )
            )
          }
          maxLength={MAX_LENGTH}
          placeholder="Say something worth stopping for..."
          aria-label="Post text"
        />

        {imagePreview && (
          <div
            className="create-image-preview"
            style={{
              position:
                "relative",
              width: "100%",
              marginTop: "14px",
              overflow: "hidden",
              borderRadius: "12px",
              border:
                "1px solid var(--line)",
              background:
                "var(--surface-2)",
            }}
          >
            <img
              src={imagePreview}
              alt="Selected post"
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                maxHeight: "420px",
                objectFit: "contain",
                background:
                  "var(--surface-2)",
              }}
            />

            <button
              type="button"
              className="create-image-remove"
              onClick={
                removeImage
              }
              disabled={posting}
              aria-label="Remove selected image"
              style={{
                position:
                  "absolute",
                top: "10px",
                right: "10px",
                width: "32px",
                height: "32px",
                border:
                  "1px solid var(--line)",
                borderRadius:
                  "50%",
                background:
                  "rgba(0,0,0,.72)",
                color: "#fff",
                fontSize: "20px",
                lineHeight: 1,
                cursor:
                  "pointer",
              }}
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="create-error">
            {error}
          </div>
        )}

        <footer className="create-footer">
          <div className="create-tools">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={
                handleImageChange
              }
              hidden
            />

            <button
              type="button"
              aria-label="Add image"
              title="Add image"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={posting}
            >
              +
            </button>

            <button
              type="button"
              aria-label="Add emoji"
              title="Emoji coming soon"
              disabled
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
              disabled={
                !hasContent ||
                posting
              }
              onClick={
                publishPost
              }
            >
              {posting
                ? imageFile
                  ? "Uploading..."
                  : "Posting..."
                : "Post"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}