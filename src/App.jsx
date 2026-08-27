import { useEffect, useMemo, useRef, useState } from "react";
import {
  NavLink,
  Navigate,
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

function QyvraMark({ className = "" }) {
  return (
    <span className={`qyvra-mark ${className}`.trim()}>
      Q
    </span>
  );
}

function CommandPalette({
  open,
  onClose,
  onCreate,
}) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo(() => {
    const navItems = navigation.map((item) => ({
      id: item.path,
      label: item.label,
      meta: item.path === "/" ? "Go to your feed" : `Open ${item.label.toLowerCase()}`,
      icon: item.icon,
      action: () => navigate(item.path),
    }));

    return [
      {
        id: "create",
        label: "Create post",
        meta: "Share something new",
        icon: "+",
        action: onCreate,
      },
      ...navItems,
    ];
  }, [navigate, onCreate]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return items;
    }

    return items.filter((item) =>
      `${item.label} ${item.meta}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [items, query]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setQuery("");
    setActiveIndex(0);

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 20);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (activeIndex >= filteredItems.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredItems.length]);

  if (!open) {
    return null;
  }

  function runItem(item) {
    onClose();
    item.action();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        filteredItems.length
          ? (current + 1) % filteredItems.length
          : 0
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        filteredItems.length
          ? (current - 1 + filteredItems.length) % filteredItems.length
          : 0
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const item = filteredItems[activeIndex];
      if (item) {
        runItem(item);
      }
    }
  }

  return (
    <div
      className="command-palette-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
      >
        <div className="command-palette-head">
          <div>
            <span className="command-palette-kicker">
              QUICK ACTION
            </span>
            <h2 id="command-palette-title">
              Where to?
            </h2>
          </div>

          <button
            type="button"
            className="command-palette-close"
            onClick={onClose}
            aria-label="Close command palette"
          >
            ×
          </button>
        </div>

        <div className="command-palette-search-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search QYVRA..."
            aria-label="Search QYVRA actions"
          />
          <kbd>ESC</kbd>
        </div>

        <div
          className="command-palette-list"
          role="listbox"
          aria-label="QYVRA actions"
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={
                  index === activeIndex
                    ? "command-item active"
                    : "command-item"
                }
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runItem(item)}
              >
                <span className="command-item-icon">
                  {item.icon}
                </span>

                <span className="command-item-copy">
                  <strong>{item.label}</strong>
                  <small>{item.meta}</small>
                </span>

                <span className="command-item-arrow">
                  ↵
                </span>
              </button>
            ))
          ) : (
            <div className="command-empty">
              <strong>No matches.</strong>
              <span>Try Home, Explore, Messages, Profile or Create.</span>
            </div>
          )}
        </div>

        <div className="command-palette-footer">
          <span>↑ ↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </section>
    </div>
  );
}

function AppShell({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);

  const displayName = getDisplayName(user);
  const username = getUsername(user);

  useEffect(() => {
    setCreateOpen(false);
    setCommandOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  useEffect(() => {
    function handleScroll() {
      setShowTopButton(window.scrollY > 620);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleKeyboard(event) {
      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }

      if (modifier && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setCreateOpen(true);
        return;
      }

      if (event.key === "Escape") {
        setCreateOpen(false);
        setCommandOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyboard);

    return () =>
      window.removeEventListener("keydown", handleKeyboard);
  }, []);

  function openCreate() {
    setCommandOpen(false);
    setCreateOpen(true);
  }

  function goHome() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          type="button"
          className="wordmark"
          onClick={() => navigate("/")}
          aria-label="Go home"
        >
          <QyvraMark />
          <span>QYVRA</span>
        </button>

        <nav
          className="top-navigation"
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                isActive ? "top-nav-link active" : "top-nav-link"
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="topbar-actions">
          <button
            type="button"
            className="search-trigger"
            onClick={() => setCommandOpen(true)}
            aria-label="Open search and quick actions"
          >
            <span aria-hidden="true">⌕</span>
            <span className="search-label">Search</span>
            <kbd>⌘ K</kbd>
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

      <main className="site-content-shell">
        <div className="page-grid">
          <div className="main-column">
            <Routes>
              <Route
                path="/"
                element={
                  <Home onCreate={openCreate} />
                }
              />
              <Route
                path="/explore"
                element={<Explore />}
              />
              <Route
                path="/messages"
                element={<Messages />}
              />
              <Route
                path="/notifications"
                element={
                  <BasicPage
                    type="notifications"
                    user={user}
                  />
                }
              />
              <Route
                path="/profile"
                element={
                  <BasicPage
                    type="profile"
                    user={user}
                  />
                }
              />
              <Route
                path="/create"
                element={<Navigate to="/" replace />}
              />
              <Route
                path="*"
                element={<Navigate to="/" replace />}
              />
            </Routes>
          </div>

          <RightRail />
        </div>
      </main>

      <nav
        className="mobile-nav"
        aria-label="Mobile navigation"
      >
        {navigation.slice(0, 5).map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === "/"}
          >
            <span aria-hidden="true">{item.icon}</span>
            <small>
              {item.label === "Notifications"
                ? "Alerts"
                : item.label}
            </small>
          </NavLink>
        ))}

        <button
          type="button"
          onClick={openCreate}
          aria-label="Create post"
        >
          +
        </button>
      </nav>

      {showTopButton && (
        <button
          type="button"
          className="scroll-top-button"
          onClick={goHome}
          aria-label="Back to top"
          title="Back to top"
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
        <CreateModal
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  const { user, loading, isAuthenticated, signOut } =
    useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-mark">Q</div>
        <span>loading your space...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <AppShell
      user={user}
      onLogout={signOut}
    />
  );
}
