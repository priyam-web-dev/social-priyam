export default function Avatar({
  name = "Priyam",
  size = "md",
  src = "",
}) {
  const initial =
    name?.trim()?.slice(0, 1)?.toUpperCase() || "U";

  return (
    <span
      className={`avatar avatar-${size} ${
        src ? "avatar-has-image" : ""
      }`}
      aria-label={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="avatar-image"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        initial
      )}
    </span>
  );
}