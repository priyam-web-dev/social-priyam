export default function Avatar({
  name = "User",
  size = "md",
  src = "",
}) {
  const initial =
    name?.trim()?.slice(0, 1)?.toUpperCase() || "U";

  return (
    <span
      className={`avatar avatar-${size}${src ? " avatar-image" : ""}`}
      aria-label={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
        />
      ) : (
        initial
      )}
    </span>
  );
}