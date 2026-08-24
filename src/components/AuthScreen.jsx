import { useState } from "react";
import { supabase } from "../lib/supabase";

function getFriendlyError(message = "") {
  const text = message.toLowerCase();

  if (text.includes("invalid login credentials")) {
    return "That email or password is incorrect.";
  }

  if (text.includes("email not confirmed")) {
    return "Please confirm your email first, then log in.";
  }

  if (text.includes("already registered")) {
    return "This email is already registered. Try logging in.";
  }

  if (text.includes("password")) {
    return message;
  }

  return message || "Something went wrong. Please try again.";
}

export default function AuthScreen() {
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isSignup = mode === "signup";

  function changeMode(nextMode) {
    setMode(nextMode);

    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (busy) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (isSignup) {
        const cleanUsername = username
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "")
          .slice(0, 24);

        if (!name.trim()) {
          throw new Error("Please enter your name.");
        }

        if (!cleanUsername) {
          throw new Error(
            "Please enter a valid username using letters, numbers or underscores."
          );
        }

        const { data, error: signupError } =
          await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
              data: {
                display_name: name.trim(),
                username: cleanUsername,
              },
              emailRedirectTo: window.location.origin,
            },
          });

        if (signupError) {
          throw signupError;
        }

        if (data.session) {
          setMessage("Account created. Welcome to Social.");
        } else {
          setMode("login");
          setPassword("");

          setMessage(
            "Account created. Check your email to confirm your account, then log in."
          );
        }

        return;
      }

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (loginError) {
        throw loginError;
      }
    } catch (submitError) {
      setError(getFriendlyError(submitError?.message));
    } finally {
      setBusy(false);
    }
  }

  async function handleOAuth(provider) {
    if (busy) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    const { error } =
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });

    if (error) {
      setError(getFriendlyError(error.message));
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">

        <div className="auth-brand">
          <div className="auth-mark">
            S
          </div>

          <span>social</span>
        </div>

        <div className="auth-intro">

          <span className="auth-kicker">
            {isSignup
              ? "CREATE ACCOUNT"
              : "WELCOME BACK"}
          </span>

          <h1>
            {isSignup
              ? "Make your corner."
              : "Welcome back."}
          </h1>

          <p>
            {isSignup
              ? "Create your identity and join the conversation."
              : "Log in to your space, people and conversations."}
          </p>

        </div>

        <div className="auth-mode-switch">

          <button
            type="button"
            className={!isSignup ? "active" : ""}
            onClick={() => changeMode("login")}
          >
            Log in
          </button>

          <button
            type="button"
            className={isSignup ? "active" : ""}
            onClick={() => changeMode("signup")}
          >
            Create account
          </button>

        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {isSignup && (
            <>
              <label>
                <span>Name</span>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>

              <label>
                <span>Username</span>

                <input
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  placeholder="priyam"
                  autoComplete="username"
                  maxLength={24}
                />
              </label>
            </>
          )}

          <label>
            <span>Email</span>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Password</span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="At least 6 characters"
              autoComplete={
                isSignup
                  ? "new-password"
                  : "current-password"
              }
              minLength={6}
              required
            />
          </label>

          {error && (
            <div className="auth-message error">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-message success">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={busy}
          >
            {busy
              ? "Working..."
              : isSignup
                ? "Create account"
                : "Continue"}
          </button>

        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="auth-oauth">

          <button
            type="button"
            onClick={() =>
              handleOAuth("github")
            }
            disabled={busy}
          >
            <strong>GH</strong>
            Continue with GitHub
          </button>

          <button
            type="button"
            onClick={() =>
              handleOAuth("google")
            }
            disabled={busy}
          >
            <strong>G</strong>
            Continue with Google
          </button>

        </div>

        <p className="auth-legal">
          Your account is secured by Supabase Auth.
        </p>

      </section>
    </main>
  );
}