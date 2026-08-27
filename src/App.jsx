import { useEffect, useMemo, useRef, useState } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { navigation } from "./appData";
import Avatar from "./components/Avatar";
import ThemeButton from "./components/ThemeButton";
import CreateModal from "./components/CreateModal";
import AuthScreen from "./components/AuthScreen";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Messages from "./pages/Messages";
import BasicPage from "./pages/BasicPage";
import { useAuth } from "./context/AuthContext";

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

function QyvraMark() {
  return <span className="qyvra-mark">Q</span>;
}

const primaryNav = [
  ...navigation,
  { label: "Saved", path: "/saved", icon: "◇" },
];

function CommandPalette({ open, onClose, onCreate }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo(() => {
    return [
      {
        id: "create",
        label: "Create post",
        description: "Share a thought, photo or moment",
        icon: "+",
        run: onCreate,
      },
      ...primaryNav.map((item) => ({
        id: item.path,
        label: item.label,
        description: item.path === "/" ? "Your home feed" : `Open ${item.label.toLowerCase()}`,
        icon: item.icon,
        run: () => navigate(item.path),
      })),
    ];
  }, [navigate, onCreate]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      `${item.label} ${item.description}`.toLowerCase().includes(term)
    );
  }, [items, query]);

  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [activeIndex, filtered.length]);

  if (!open) return null;

  const runItem = (item) => {
    if (!item) return;
    onClose();
    item.run();
  };

  return (
    <div
      className="command-palette-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="command-palette" role="dialog" aria-modal="true">
        <div className="command-palette-head">
          <div>
            <span className="eyebrow">QUICK NAVIGATION</span>
            <h2>Where next?</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <label className="command-palette-search-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Search QYVRA"
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onClose();
              } else if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) =>
                  filtered.length ? (index + 1) % filtered.length : 0
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) =>
                  filtered.length
                    ? (index - 1 + filtered.length) % filtered.length
                    : 0
                );
              } else if (event.key === "Enter") {
                event.preventDefault();
                runItem(filtered[activeIndex]);
              }
            }}
          />
          <kbd>ESC</kbd>
        </label>

        <div className="command-palette-list">
          {filtered.length ? (
            filtered.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`command-item ${index === activeIndex ? "active" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runItem(item)}
              >
                <span className="command-item-icon">{item.icon}</span>
                <span className="command-item-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <span className="command-item-arrow">↵</span>
              </button>
            ))
          ) : (
            <div className="command-empty">
              <strong>No matches.</strong>
              <span>Try a page or action.</span>
            </div>
          )}
        </div>

        <div className="command-palette-footer">
          <span>↑↓ move</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </section>
    </div>
  );
}

function SavedPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    function read() {
      try {
        const value = JSON.parse(
          window.localStorage.getItem("qyvra_bookmarks") || "[]"
        );
        setItems(Array.isArray(value) ? value : []);
      } catch {
        setItems([]);
      }
    }

    read();
    window.addEventListener("qyvra:bookmark-changed", read);
    return () => window.removeEventListener("qyvra:bookmark-changed", read);
  }, []);

  return (
    <section className="saved-page">
      <div className="section-kicker-row">
        <span className="eyebrow">YOUR LIBRARY</span>
        <span className="section-index">01</span>
      </div>
      <div className="page-hero-line">
        <div>
          <h1>Worth keeping.</h1>
          <p>Posts you chose not to lose in the scroll.</p>
        </div>
        <span className="page-hero-mark">◇</span>
      </div>

      {items.length === 0 ? (
        <div className="empty-product-state">
          <span className="empty-product-icon">◇</span>
          <strong>Your shelf is empty.</strong>
          <span>Save a post and it will stay here for you.</span>
        </div>
      ) : (
        <div className="saved-feed">
          {items.map((item) => (
            <article className="saved-post-card" key={item.bookmarkKey}>
              <div className="saved-post-label">SAVED</div>
              <div className="saved-post-body">
                <div className="saved-post-author">
                  <Avatar
                    name={item.name || "User"}
                    src={item.avatarUrl || undefined}
                  />
                  <div>
                    <strong>{item.name || "User"}</strong>
                    <span>@{item.handle || "user"}</span>
                  </div>
                  <time>{item.time || ""}</time>
                </div>
                {item.text && <p>{item.text}</p>}
                {item.imageUrl && (
                  <div className="saved-post-media">
                    <img
                      src={item.imageUrl}
                      alt="Saved post"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
                <div className="saved-post-meta">
                  <span>♡ {item.likes || 0}</span>
                  <span>○ {item.replies || 0}</span>
                  <span>↻ {item.reposts || 0}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PulseRail() {
  return (
    <aside className="pulse-rail">
      <section className="pulse-block pulse-primary">
        <div className="pulse-block-head">
          <span>DISCOVER</span>
          <span>01</span>
        </div>
        <h2>Find your people.</h2>
        <p>Follow conversations, not just accounts.</p>
        <NavLink className="pulse-link" to="/explore">
          Explore QYVRA <span>→</span>
        </NavLink>
      </section>

      <section className="pulse-block">
        <div className="pulse-block-head">
          <span>WHAT'S MOVING</span>
          <span>02</span>
        </div>
        <div className="pulse-topic">
          <small>01 · TRENDING</small>
          <strong>#technology</strong>
          <span>1.8K posts</span>
        </div>
        <div className="pulse-topic">
          <small>02 · TRENDING</small>
          <strong>#design</strong>
          <span>940 posts</span>
        </div>
        <div className="pulse-topic">
          <small>03 · TRENDING</small>
          <strong>#music</strong>
          <span>782 posts</span>
        </div>
      </section>

      <section className="pulse-block pulse-note">
        <div className="pulse-block-head">
          <span>QYVRA NOTE</span>
          <span>03</span>
        </div>
        <p>A small place for people, ideas and whatever happens between them.</p>
      </section>

      <div className="pulse-footer">Made for conversations.v1.0</div>
    </aside>
  );
}

function AppShell({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);
  const displayName = getDisplayName(user);

  const pageMeta = {
    "/": ["HOME", "Your space"],
    "/explore": ["EXPLORE", "Find your corner"],
    "/messages": ["MESSAGES", "Stay in touch"],
    "/notifications": ["ACTIVITY", "See what changed"],
    "/profile": ["PROFILE", "Make it yours"],
    "/saved": ["SAVED", "Worth returning to"],
  };

  const [eyebrow, title] =
    pageMeta[location.pathname] || ["QYVRA", "Stay awhile."];

  useEffect(() => {
    setCreateOpen(false);
    setCommandOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  useEffect(() => {
    function onScroll() {
      setShowTopButton(window.scrollY > 560);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onKeyDown(event) {
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (modifier && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setCreateOpen(true);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setCreateOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function openCreate() {
    setCommandOpen(false);
    setCreateOpen(true);
  }

  return (
    <div className="app-shell qyvra-product">
      <header className="qyvra-header">
        <button
          type="button"
          className="qyvra-brand"
          onClick={() => navigate("/")}
          aria-label="QYVRA home"
        >
          <QyvraMark />
          <span>QYVRA</span>
        </button>

        <nav className="qyvra-header-nav" aria-label="Primary navigation">
          {primaryNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                isActive ? "active" : ""
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="qyvra-header-actions">
          <button
            type="button"
            className="header-search"
            onClick={() => setCommandOpen(true)}
          >
            <span>⌕</span>
            <span className="header-search-text">Search QYVRA</span>
            <kbd>⌘ K</kbd>
          </button>
          <ThemeButton />
          <button
            type="button"
            className="header-profile"
            onClick={() => navigate("/profile")}
          >
            <Avatar
              name={displayName}
              size="sm"
            />
            <span>{displayName}</span>
          </button>
        </div>
      </header>

      <div className="qyvra-page">
        <main className="qyvra-main">
          <div className="page-heading">
            <div>
              <span className="eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
            </div>
            <button
              type="button"
              className="page-create-inline"
              onClick={openCreate}
            >
              <span>+</span>
              Create
            </button>
          </div>

          <div className="qyvra-content-grid">
            <section className="qyvra-content-main">
              <Routes>
                <Route path="/" element={<Home onCreate={openCreate} />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/messages" element={<Messages />} />
                <Route
                  path="/notifications"
                  element={<BasicPage type="notifications" user={user} />}
                />
                <Route
                  path="/profile"
                  element={<BasicPage type="profile" user={user} />}
                />
                <Route path="/saved" element={<SavedPage />} />
                <Route path="/create" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </section>

            <PulseRail />
          </div>
        </main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {navigation.slice(0, 4).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
          >
            <span>{item.icon}</span>
            <small>{item.label === "Notifications" ? "Activity" : item.label}</small>
          </NavLink>
        ))}
        <NavLink to="/profile">
          <span>◉</span>
          <small>Profile</small>
        </NavLink>
      </nav>

      <button
        type="button"
        className="mobile-create"
        onClick={openCreate}
        aria-label="Create post"
      >
        +
      </button>

      {showTopButton && (
        <button
          type="button"
          className="scroll-top-button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onCreate={openCreate}
      />

      {createOpen && (
        <CreateModal onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  const { user, loading, isAuthenticated, signOut } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-mark">Q</div>
        <span>Getting your space ready...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <AppShell user={user} onLogout={signOut} />;
}
