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
import RightRail from "./components/RightRail";
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

function HeaderNavigation() {
  return (
    <nav className="header-navigation" aria-label="Primary navigation">
      {navigation.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/"}
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          <span className="header-navigation-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}

      <NavLink
        to="/saved"
        className={({ isActive }) =>
          isActive ? "active" : ""
        }
      >
        <span className="header-navigation-icon" aria-hidden="true">
          ◇
        </span>
        <span>Saved</span>
      </NavLink>
    </nav>
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
      <div className="page-intro new-page-intro">
        <span className="eyebrow">YOUR LIBRARY</span>
        <h1>Saved for later.</h1>
        <p>Keep the posts worth coming back to.</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-product-state">
          <span className="empty-product-icon">◇</span>
          <strong>Nothing saved yet.</strong>
          <span>Save a post and it will live here.</span>
        </div>
      ) : (
        <div className="saved-feed">
          {items.map((item) => (
            <PostFromSaved key={item.bookmarkKey} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function PostFromSaved({ item }) {
  return (
    <article className="saved-post-card">
      <div className="saved-post-label">SAVED</div>
      <div className="saved-post-body">
        <div className="saved-post-author">
          <Avatar name={item.name || "User"} src={item.avatarUrl || undefined} />
          <div>
            <strong>{item.name || "User"}</strong>
            <span>@{item.handle || "user"}</span>
          </div>
          <time>{item.time || ""}</time>
        </div>

        {item.text && <p>{item.text}</p>}
        {item.imageUrl && (
          <div className="saved-post-media">
            <img src={item.imageUrl} alt="Saved post" loading="lazy" decoding="async" />
          </div>
        )}

        <div className="saved-post-meta">
          <span>♡ {item.likes || 0}</span>
          <span>○ {item.replies || 0}</span>
          <span>↻ {item.reposts || 0}</span>
        </div>
      </div>
    </article>
  );
}

function CommandPalette({ open, onClose, onCreate }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo(() => {
    const pageItems = navigation.map((item) => ({
      id: item.path,
      label: item.label,
      description:
        item.path === "/"
          ? "Open your feed"
          : `Open ${item.label.toLowerCase()}`,
      icon: item.icon,
      run: () => navigate(item.path),
    }));

    return [
      {
        id: "create",
        label: "Create a post",
        description: "Share something with your people",
        icon: "+",
        run: onCreate,
      },
      {
        id: "saved",
        label: "Saved",
        description: "Open your saved posts",
        icon: "◇",
        run: () => navigate("/saved"),
      },
      ...pageItems,
    ];
  }, [navigate, onCreate]);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return items;
    return items.filter((item) =>
      `${item.label} ${item.description}`.toLowerCase().includes(value)
    );
  }, [items, query]);

  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [activeIndex, filtered.length]);

  if (!open) return null;

  function execute(item) {
    onClose();
    item?.run();
  }

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
            <span className="eyebrow">QYVRA COMMANDS</span>
            <h2>Go somewhere.</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="command-palette-search-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Search pages and actions"
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
                setActiveIndex((current) =>
                  filtered.length ? (current + 1) % filtered.length : 0
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((current) =>
                  filtered.length
                    ? (current - 1 + filtered.length) % filtered.length
                    : 0
                );
              } else if (event.key === "Enter") {
                event.preventDefault();
                execute(filtered[activeIndex]);
              }
            }}
          />
          <kbd>ESC</kbd>
        </div>

        <div className="command-palette-list">
          {filtered.length ? (
            filtered.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={`command-item ${index === activeIndex ? "active" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => execute(item)}
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
              <span>Try a page name or action.</span>
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

function WorkspaceNav({ onCreate, user, onLogout }) {
  return (
    <aside className="workspace-nav" aria-label="Quick actions">
      <div className="workspace-rail-stack">
        <button
          type="button"
          className="workspace-rail-create"
          onClick={onCreate}
          aria-label="Create a post"
          title="Create a post"
        >
          +
        </button>

        <NavLink
          to="/saved"
          className={({ isActive }) =>
            `workspace-rail-button ${isActive ? "active" : ""}`
          }
          aria-label="Saved"
          title="Saved"
        >
          ◇
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `workspace-rail-avatar ${isActive ? "active" : ""}`
          }
          aria-label="Profile"
          title="Profile"
        >
          <Avatar name={getDisplayName(user)} size="sm" />
        </NavLink>
      </div>

      <div className="workspace-rail-bottom">
        <button
          type="button"
          className="workspace-rail-button workspace-rail-logout"
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
        >
          ↗
        </button>
      </div>
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
    "/": ["HOME", "Your feed"],
    "/explore": ["EXPLORE", "Find your corner"],
    "/messages": ["INBOX", "Your conversations"],
    "/notifications": ["ACTIVITY", "What changed"],
    "/profile": ["PROFILE", "Your corner"],
    "/saved": ["SAVED", "Worth returning to"],
  };

  const [eyebrow, title] = pageMeta[location.pathname] || ["QYVRA", "Stay awhile."];

  useEffect(() => {
    setCreateOpen(false);
    setCommandOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  useEffect(() => {
    function onScroll() {
      setShowTopButton(window.scrollY > 520);
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
    <div className="app-shell product-shell">
      <header className="topbar product-topbar">
        <button type="button" className="wordmark" onClick={() => navigate("/")}>
          <QyvraMark />
          <span>QYVRA</span>
        </button>

        <HeaderNavigation />

        <button
          type="button"
          className="global-search"
          onClick={() => setCommandOpen(true)}
          aria-label="Open QYVRA search"
        >
          <span>⌕</span>
          <span>Search people, posts and topics</span>
          <kbd>⌘ K</kbd>
        </button>

        <div className="topbar-actions">
          <button type="button" className="top-create" onClick={openCreate}>
            + Create
          </button>
          <ThemeButton />
          <button
            type="button"
            className="profile-trigger"
            onClick={() => navigate("/profile")}
            aria-label="Open profile"
          >
            <Avatar name={displayName} size="sm" />
            <span>{displayName}</span>
          </button>
        </div>
      </header>

      <div className="product-layout">
        <WorkspaceNav onCreate={openCreate} user={user} onLogout={onLogout} />

        <main className="product-main">
          <div className="workspace-heading">
            <div>
              <span className="eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
            </div>
            <span className="workspace-status">Online</span>
          </div>

          <div className="product-content-grid">
            <div className="main-column">
              <Routes>
                <Route path="/" element={<Home onCreate={openCreate} />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/notifications" element={<BasicPage type="notifications" user={user} />} />
                <Route path="/profile" element={<BasicPage type="profile" user={user} />} />
                <Route path="/saved" element={<SavedPage />} />
                <Route path="/create" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <div className="product-right-rail">
              <RightRail />
            </div>
          </div>
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.slice(0, 4).map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === "/"}>
            <span aria-hidden="true">{item.icon}</span>
            <small>{item.label === "Notifications" ? "Alerts" : item.label}</small>
          </NavLink>
        ))}
        <NavLink to="/saved">
          <span aria-hidden="true">◇</span>
          <small>Saved</small>
        </NavLink>
        <button type="button" onClick={openCreate} aria-label="Create post">+</button>
      </nav>

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

      {createOpen && <CreateModal onClose={() => setCreateOpen(false)} />}
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
