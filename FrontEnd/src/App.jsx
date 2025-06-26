// FrontEnd/src/App.jsx (Updated to use Bootstrap classes, removing inline styles)
import React, { useState, useEffect } from "react";
import useAuth from "./hooks/useAuth"; // Import the custom useAuth hook
import api from "./api/api"; // Import the configured Axios instance
import { useNavigate } from "react-router-dom"; // For programmatic navigation

function App() {
  const { user, isAuthenticated, loading, signOut, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [apiMessage, setApiMessage] = useState(
    "Click the button to call the protected API."
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log("User not authenticated, please sign in.");
      // Optionally redirect to /login if you have a separate login route
      // navigate('/login');
    } else if (!loading && isAuthenticated) {
      console.log("User is authenticated:", user);
      // Optionally navigate to a dashboard or protected page after successful login
      // navigate('/dashboard');
    }
  }, [loading, isAuthenticated, user, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const result = await signIn(username, password);
      if (result.isSignedIn) {
        console.log("Sign in successful!");
      } else {
        console.log("Next step in sign-in process:", result.nextStep);
        setAuthError(
          `Sign-in requires next step: ${result.nextStep.signInStep}`
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(
        error.message || "An unknown error occurred during sign-in."
      );
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const result = await signUp(username, password, email);
      if (result.isSignUpComplete) {
        console.log("Sign up complete! Please sign in.");
        setIsSignUpMode(false);
        setUsername("");
        setPassword("");
        setEmail("");
      } else {
        console.log("Next step in sign-up process:", result.nextStep);
        setAuthError(
          `Sign-up requires next step: ${result.nextStep.signUpStep}`
        );
      }
    } catch (error) {
      console.error("Sign up error:", error);
      setAuthError(
        error.message || "An unknown error occurred during sign-up."
      );
    }
  };

  async function callApi() {
    setApiMessage("Calling API...");
    try {
      const response = await api.get("/api/protected/");
      console.log("API Response:", response.data);
      setApiMessage(response.data.message || "Successfully fetched data!");
    } catch (error) {
      console.error("Error calling API:", error);
      setApiMessage(`Error calling API: ${error.message}`);
      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 403)
      ) {
        setApiMessage(
          "Authentication required or token expired. Please sign in."
        );
      }
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <h2 className="text-dark">Loading...</h2>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      {isAuthenticated ? (
        <header className="card shadow-sm p-4 rounded text-center bg-white">
          <h1 className="mb-3 text-dark">Welcome, {user.username}!</h1>
          <p className="alert alert-info my-3">{apiMessage}</p>
          <div className="d-grid gap-2 col-6 mx-auto mt-4">
            <button className="btn btn-primary" onClick={callApi}>
              Call Protected API
            </button>
            <button className="btn btn-outline-danger" onClick={signOut}>
              Sign Out
            </button>
          </div>
        </header>
      ) : (
        <div
          className="card shadow-sm p-4 rounded text-center bg-white"
          style={{ maxWidth: "400px", width: "90%" }}
        >
          <h2 className="mb-4 text-dark">
            {isSignUpMode ? "Create Account" : "Sign In"}
          </h2>
          {authError && (
            <div className="alert alert-danger" role="alert">
              {authError}
            </div>
          )}
          <form
            onSubmit={isSignUpMode ? handleSignUpSubmit : handleLoginSubmit}
          >
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {isSignUpMode && (
              <div className="mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="d-grid gap-2">
              <button type="submit" className="btn btn-primary">
                {isSignUpMode ? "Sign Up" : "Sign In"}
              </button>
            </div>
          </form>
          <p className="mt-3 text-muted">
            {isSignUpMode
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              type="button"
              className="btn btn-link p-0 border-0"
              onClick={() => setIsSignUpMode(!isSignUpMode)}
            >
              {isSignUpMode ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
