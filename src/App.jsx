import { useEffect, useState } from "react";
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

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Messages from "./pages/Messages";
import BasicPage from "./pages/BasicPage";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    setCreateOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleKeyboard(event) {
      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigate("/explore");
      }

      if (event.key === "Escape") {
        setCreateOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [navigate]);

  function openCreate() {
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
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
          <b>S</b>
          <span>social</span>
        </button>

        <div className="topbar-actions">
          <button
            type="button"
            className="search-trigger"
            onClick={() => navigate("/explore")}
            aria-label="Search"
          >
            <span>⌕</span>
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
            <Avatar name="Priyam" size="sm" />
            <span>Priyam</span>
          </button>
        </div>
      </header>

      <div className="page-grid">
        <aside className="sidebar">
          <nav className="side-nav" aria-label="Main navigation">
            {navigation.map((item) => (
              <NavLink
                key={item.label}
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
            ＋ Create
          </button>

          <button
            type="button"
            className="account-card"
            onClick={() => navigate("/profile")}
          >
            <Avatar name="Priyam" />

            <span>
              <strong>Priyam</strong>
              <small>@priyam</small>
            </span>

            <b>···</b>
          </button>
        </aside>

        <main className="main-column">
          <Routes>
            <Route
              path="/"
              element={<Home onCreate={openCreate} />}
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
                  title="Activity."
                  description="The things that happened while you were away."
                />
              }
            />

            <Route
              path="/profile"
              element={
                <BasicPage
                  type="profile"
                  title="Priyam."
                  description="@priyam · building things and figuring them out."
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
        </main>

        <RightRail />
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.slice(0, 4).map((item) => (
          <NavLink
            key={item.label}
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
          ＋
        </button>
      </nav>

      {createOpen && (
        <CreateModal
          onClose={closeCreate}
        />
      )}
    </div>
  );
}