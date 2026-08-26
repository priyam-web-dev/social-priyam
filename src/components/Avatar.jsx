import { useEffect, useState } from "react";

export default function Avatar({
  name = "User",
  size = "md",
  src = "",
}) {
  const initial =
    name?.trim()?.slice(0, 1)?.toUpperCase() || "U";

  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const hasImage = Boolean(src) && !imageFailed;

  if (hasImage) {
    return (
      <span
        className={`avatar avatar-${size} avatar-image`}
        aria-label={name}
      >
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={`avatar avatar-${size}`}
      aria-label={name}
    >
      {initial}
    </span>
  );
}