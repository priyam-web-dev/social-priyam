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

function QyvraDrawer({ open, onClose, onCreate, user, onLogout }) {
  if (!open) return null;

  return (
    <div
      className="qyvra-drawer-layer"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="qyvra-drawer" aria-label="QYVRA navigation">
        <div className="qyvra-drawer-head">
          <button
            type="button"
            className="qyvra-brand qyvra-drawer-brand"
            onClick={() => onClose()}
            aria-label="Close navigation"
          >
            <QyvraMark />
            <span>QYVRA</span>
          </button>

          <button
            type="button"
            className="qyvra-drawer-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        <div className="qyvra-drawer-intro">
          <span className="eyebrow">YOUR SPACE</span>
          <h2>Choose where the conversation goes.</h2>
        </div>

        <nav className="qyvra-drawer-nav" aria-label="Main navigation">
          {primaryNav.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                isActive ? "active" : ""
              }
            >
              <span className="drawer-nav-index">0{index + 1}</span>
              <span className="drawer-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <strong>{item.label}</strong>
              <span className="drawer-nav-arrow">↗</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="drawer-create" onClick={onCreate}>
          <span>＋</span>
          <div>
            <strong>Create something.</strong>
            <small>Start a post · Ctrl N</small>
          </div>
          <span>↗</span>
        </button>

        <div className="drawer-account">
          <Avatar name={getDisplayName(user)} size="sm" />
          <div>
            <strong>{getDisplayName(user)}</strong>
            <span>@{getUsername(user)}</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Log out"
            title="Log out"
          >
            ↗
          </button>
        </div>
      </aside>
    </div>
  );
}

function AppShell({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);
  const displayName = getDisplayName(user);

  useEffect(() => {
    setCreateOpen(false);
    setCommandOpen(false);
    setDrawerOpen(false);
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
        setDrawerOpen(false);
        setCommandOpen(true);
      }
      if (modifier && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setDrawerOpen(false);
        setCreateOpen(true);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setCreateOpen(false);
        setDrawerOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function openCreate() {
    setCommandOpen(false);
    setDrawerOpen(false);
    setCreateOpen(true);
  }

  const currentItem =
    primaryNav.find((item) =>
      item.path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.path)
    ) || primaryNav[0];

  return (
    <div className="app-shell qyvra-new-shell">
      <header className="qyvra-minimal-header">
        <div className="header-left-cluster">
          <button
            type="button"
            className="qyvra-menu-trigger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
          >
            <span className="qyvra-menu-mark">
              <span />
              <span />
              <span />
            </span>
          </button>

          <button
            type="button"
            className="qyvra-brand"
            onClick={() => navigate("/")}
            aria-label="QYVRA home"
          >
            <QyvraMark />
            <span>QYVRA</span>
          </button>
        </div>

        <div className="header-context">
          <span className="header-context-kicker">NOW VIEWING</span>
          <strong>{currentItem.label}</strong>
        </div>

        <div className="qyvra-header-actions">
          <button
            type="button"
            className="header-search"
            onClick={() => setCommandOpen(true)}
            aria-label="Open QYVRA search"
          >
            <span>⌕</span>
            <span className="header-search-text">Search QYVRA</span>
            <kbd>⌘ K</kbd>
          </button>

          <button
            type="button"
            className="header-create-compact"
            onClick={openCreate}
          >
            <span>＋</span>
            <span>Create</span>
          </button>

          <ThemeButton />

          <button
            type="button"
            className="header-profile"
            onClick={() => navigate("/profile")}
          >
            <Avatar name={displayName} size="sm" />
            <span>{displayName}</span>
          </button>
        </div>
      </header>

      <div className="qyvra-new-frame">
        <aside className="qyvra-side-identity">
          <div className="side-rule" />
          <span>QYVRA</span>
          <small>social / conversation</small>
        </aside>

        <main className="qyvra-new-main">
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
        </main>

        <PulseRail />
      </div>

      <nav className="mobile-bottom-nav qyvra-mobile-nav" aria-label="Mobile navigation">
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
        <NavLink to="/saved">
          <span>◇</span>
          <small>Saved</small>
        </NavLink>
      </nav>

      <button
        type="button"
        className="mobile-create qyvra-mobile-create"
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

      <QyvraDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreate={openCreate}
        user={user}
        onLogout={onLogout}
      />

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
