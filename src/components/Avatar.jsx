export default function Avatar({ name = "Priyam", size = "md" }) {
  return <span className={`avatar avatar-${size}`}>{name.slice(0, 1).toUpperCase()}</span>;
}
