import { useEffect, useState } from "react";
export default function ThemeButton() {
  const [dark, setDark] = useState(() => localStorage.getItem("social-theme") !== "light");
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; localStorage.setItem("social-theme", dark ? "dark" : "light"); }, [dark]);
  return <button className="plain-icon" onClick={() => setDark(v => !v)} aria-label="Toggle theme">{dark ? "☼" : "◐"}</button>;
}
