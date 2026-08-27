import { useEffect, useMemo, useState } from "react";
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
import Post from "./components/Post";
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

const extraNavigation = {
  label: "Bookmarks",
  path: "/bookmarks",
  icon: "▾",
};

function getNavigationItems() {
  const items = Array.isArray(navigation)
    ? [...navigation]
    : [];

  const alreadyExists = items.some(
    (item) => item.path === extraNavigation.path
  );

  if (!alreadyExists) {
    items.push(extraNavigation);
  }

  return items;
}

function readBookmarks() {
  try {
    const raw = window.localStorage.getItem(
      "qyvra_bookmarks"
    );

    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState(readBookmarks);

  useEffect(() => {
    function refreshBookmarks() {
      setBookmarks(readBookmarks());
    }

    function handleStorage(event) {
      if (event.key === "qyvra_bookmarks") {
        refreshBookmarks();
      }
    }

    window.addEventListener(
      "qyvra:bookmark-changed",
      refreshBookmarks
    );
    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "qyvra:bookmark-changed",
        refreshBookmarks
      );
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  function clearBookmarks() {
    try {
      window.localStorage.removeItem(
        "qyvra_bookmarks"
      );
    } catch {
      // Ignore local storage failures.
    }

    setBookmarks([]);
    window.dispatchEvent(
      new Event("qyvra:bookmark-changed")
    );
  }

  return (
    <section className="qyvra-bookmarks-page">
      <div className="qyvra-bookmarks-head">
        <div>
          <span className="page-kicker">
            YOUR LIBRARY
          </span>
          <h1>Bookmarks</h1>
          <p>
            Keep the posts worth coming back to.
          </p>
        </div>

        {bookmarks.length > 0 && (
          <button
            type="button"
            className="qyvra-bookmarks-clear"
            onClick={clearBookmarks}
          >
            Clear all
          </button>
        )}
      </div>

      {bookmarks.length === 0 ? (
        <div className="qyvra-empty-bookmarks">
          <strong>Nothing saved yet.</strong>
          <span>
            Tap the bookmark icon on a post and it
            will stay here for you.
          </span>
        </div>
      ) : (
        <div className="qyvra-bookmark-list">
          {bookmarks.map((post) => (
            <div
              className="qyvra-bookmark-card"
              key={post.bookmarkKey}
            >
              <Post
                name={post.name}
                handle={post.handle}
                avatarUrl={post.avatarUrl}
                text={post.text}
                imageUrl={post.imageUrl}
                time={post.time}
                replies={post.replies}
                likes={post.likes}
                reposts={post.reposts}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CommandPalette({
  open,
  onClose,
  onCreate,
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const items = useMemo(
    () => [
      {
        label: "Go home",
        hint: "Open your main feed",
        icon: "⌂",
        key: "G H",
        action: () => navigate("/"),
      },
      {
        label: "Explore",
        hint: "Find people, topics and posts",
        icon: "⌕",
        key: "G E",
        action: () => navigate("/explore"),
      },
      {
        label: "Messages",
        hint: "Continue a conversation",
        icon: "○",
        key: "G M",
        action: () => navigate("/messages"),
      },
      {
        label: "Notifications",
        hint: "See what's happened",
        icon: "◇",
        key: "G N",
        action: () => navigate("/notifications"),
      },
      {
        label: "Profile",
        hint: "Open your profile",
        icon: "◎",
        key: "G P",
        action: () => navigate("/profile"),
      },
      {
        label: "Bookmarks",
        hint: "Open saved posts",
        icon: "⌄",
        key: "G B",
        action: () => navigate("/bookmarks"),
      },
      {
        label: "Create post",
        hint: "Share something new",
        icon: "+",
        key: "N",
        action: onCreate,
      },
    ],
    [navigate, onCreate]
  );

  const filteredItems = items.filter((item) => {
    const haystack = `${item.label} ${item.hint}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setQuery("");
    setSelectedIndex(0);

    const timer = window.setTimeout(() => {
      document
        .querySelector(".qyvra-command-search input")
        ?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((current) =>
          Math.min(
            current + 1,
            Math.max(filteredItems.length - 1, 0)
          )
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((current) =>
          Math.max(current - 1, 0)
        );
        return;
      }

      if (
        event.key === "Enter" &&
        filteredItems[selectedIndex]
      ) {
        event.preventDefault();
        filteredItems[selectedIndex].action();
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [
    filteredItems,
    onClose,
    open,
    selectedIndex,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="qyvra-command-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        className="qyvra-command"
        role="dialog"
        aria-modal="true"
        aria-label="QYVRA command palette"
      >
        <div className="qyvra-command-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="text"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search QYVRA"
            aria-label="Search commands"
            autoComplete="off"
          />
          <span className="qyvra-command-key">
            ESC
          </span>
        </div>

        <div className="qyvra-command-list">
          <div className="qyvra-command-group-label">
            Quick actions
          </div>

          {filteredItems.length === 0 ? (
            <div className="qyvra-command-empty">
              Nothing matches “{query}”.
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <button
                type="button"
                className={
                  index === selectedIndex
                    ? "qyvra-command-item selected"
                    : "qyvra-command-item"
                }
                key={item.label}
                onMouseEnter={() =>
                  setSelectedIndex(index)
                }
                onClick={() => {
                  item.action();
                  onClose();
                }}
              >
                <span
                  className="qyvra-command-icon"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="qyvra-command-copy">
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
                <span className="qyvra-command-key">
                  {item.key}
                </span>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function AppShell({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [commandOpen, setCommandOpen] =
    useState(false);
  const [showBackTop, setShowBackTop] =
    useState(false);

  const displayName = getDisplayName(user);
  const username = getUsername(user);
  const navItems = getNavigationItems();

  useEffect(() => {
    setCreateOpen(false);
    setCommandOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  useEffect(() => {
    function handleKeyboard(event) {
      const modifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (modifier && key === "k") {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }

      if (modifier && key === "n") {
        event.preventDefault();
        setCreateOpen(true);
        return;
      }

      if (event.key === "Escape") {
        setCreateOpen(false);
        setCommandOpen(false);
      }
    }

    function handleScroll() {
      setShowBackTop(window.scrollY > 520);
    }

    window.addEventListener(
      "keydown",
      handleKeyboard
    );
    window.addEventListener(
      "scroll",
      handleScroll,
      { passive: true }
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  function openCreate() {
    setCommandOpen(false);
    setCreateOpen(true);
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
          <span>qyvra</span>
        </button>

        <nav
          className="top-primary-nav"
          aria-label="Primary navigation"
        >
          {navItems
            .filter(
              (item) => item.path !== "/create"
            )
            .slice(0, 7)
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
              >
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="topbar-actions">
          <button
            type="button"
            className="search-trigger"
            onClick={() =>
              setCommandOpen(true)
            }
            aria-label="Search QYVRA"
          >
            <span aria-hidden="true">⌕</span>
            <span className="search-label">
              Search
            </span>
            <kbd>⌘ K</kbd>
          </button>

          <ThemeButton />

          <button
            type="button"
            className="profile-trigger"
            onClick={() => navigate("/profile")}
            aria-label="Open profile"
          >
            <Avatar
              name={displayName}
              size="sm"
            />
            <span>{displayName}</span>
          </button>
        </div>
      </header>

      <div className="page-grid">
        <aside className="sidebar">
          <nav
            className="side-nav"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="create-button"
            onClick={openCreate}
          >
            + Create
          </button>

          <button
            type="button"
            className="account-card"
            onClick={() => navigate("/profile")}
          >
            <Avatar name={displayName} />
            <span>
              <strong>{displayName}</strong>
              <small>@{username}</small>
            </span>
            <b aria-hidden="true">•••</b>
          </button>

          <button
            type="button"
            className="account-logout"
            onClick={onLogout}
          >
            Log out
          </button>
        </aside>

        <main className="main-column">
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
              path="/bookmarks"
              element={<BookmarksPage />}
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
        </main>

        <RightRail />
      </div>

      <nav
        className="mobile-nav"
        aria-label="Mobile navigation"
      >
        {navItems
          .filter(
            (item) => item.path !== "/bookmarks"
          )
          .slice(0, 4)
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
            >
              <span>{item.icon}</span>
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

      <button
        type="button"
        className={
          showBackTop
            ? "qyvra-back-top visible"
            : "qyvra-back-top"
        }
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        ↑
      </button>

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
