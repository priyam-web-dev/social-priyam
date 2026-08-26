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
      style={{
        position: "relative",
        display: "inline-flex",
        flexShrink: 0,
        overflow: "hidden",
        aspectRatio: "1 / 1",
        borderRadius: "50%",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          draggable="false"
          style={{
            position: "absolute",
            inset: 0,
            display: "block",
            width: "100%",
            height: "100%",
            minWidth: "100%",
            minHeight: "100%",
            maxWidth: "none",
            maxHeight: "none",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      ) : (
        initial
      )}
    </span>
  );
}