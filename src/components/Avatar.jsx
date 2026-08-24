export default function Avatar({
  name = "User",
  size = "md",
  src = "",
}) {
  const initial =
    name?.trim()?.slice(0, 1)?.toUpperCase() || "U";

  if (src) {
    return (
      <span
        className={`avatar avatar-${size} avatar-image`}
      >
        <img
          src={src}
          alt={name}
          loading="lazy"
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