// FrontEnd/src/App.jsx (Updated to use useAuth hook, removing Authenticator component)
import React, { useState, useEffect } from "react";
import useAuth from "./hooks/useAuth"; // Import the custom useAuth hook
import api from "./api/api"; // Import the configured Axios instance
import { useNavigate } from "react-router-dom"; // For programmatic navigation

function App() {
  const { user, isAuthenticated, loading, signOut, signIn, signUp } = useAuth(); // Destructure values from the AuthContext
  const navigate = useNavigate(); // Initialize navigate hook

  const [apiMessage, setApiMessage] = useState(
    "Click the button to call the protected API."
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(""); // For signup
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Effect to redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Optionally redirect to a specific login page or show login form
      // For this example, we'll show the login form directly in App.jsx
      console.log("User not authenticated, please sign in.");
    } else if (!loading && isAuthenticated) {
      console.log("User is authenticated:", user);
      // Optionally navigate to a dashboard or protected page after successful login
      // navigate('/dashboard'); // Uncomment if you have a dashboard route
    }
  }, [loading, isAuthenticated, user, navigate]);

  // Handle user sign in
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const result = await signIn(username, password);
      if (result.isSignedIn) {
        console.log("Sign in successful!");
        // isAuthenticated and user will be updated by AuthContext's useEffect
      } else {
        // Handle multi-factor authentication or other next steps
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

  // Handle user sign up
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const result = await signUp(username, password, email);
      if (result.isSignUpComplete) {
        console.log("Sign up complete! Please sign in.");
        setIsSignUpMode(false); // Switch to login mode
        setUsername(""); // Clear username for next login
        setPassword(""); // Clear password for next login
        setEmail(""); // Clear email
      } else {
        // Handle confirmation step if necessary
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

  // Calls the protected Django API
  async function callApi() {
    setApiMessage("Calling API...");
    try {
      // Use the 'api' Axios instance, which automatically attaches the token
      const response = await api.get("/api/protected/");
      console.log("API Response:", response.data);
      setApiMessage(response.data.message || "Successfully fetched data!");
    } catch (error) {
      console.error("Error calling API:", error);
      setApiMessage(`Error calling API: ${error.message}`);
      // If 401/403, the interceptor might have already logged it.
      // You could also specifically check error.response.status here.
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
      <div style={styles.container}>
        <h2> Loading... </h2>{" "}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {" "}
      {isAuthenticated ? (
        <header style={styles.header}>
          <h1 style={styles.title}> Welcome, {user.username}! </h1>{" "}
          <p style={styles.apiMessage}> {apiMessage} </p>{" "}
          <div style={styles.buttonGroup}>
            <button style={styles.button} onClick={callApi}>
              Call Protected API{" "}
            </button>{" "}
            <button style={styles.button} onClick={signOut}>
              Sign Out{" "}
            </button>{" "}
          </div>{" "}
        </header>
      ) : (
        <div style={styles.authContainer}>
          <h2 style={styles.authTitle}>
            {" "}
            {isSignUpMode ? "Create Account" : "Sign In"}{" "}
          </h2>{" "}
          {authError && <p style={styles.errorMessage}> {authError} </p>}{" "}
          <form
            onSubmit={isSignUpMode ? handleSignUpSubmit : handleLoginSubmit}
            style={styles.form}
          >
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />{" "}
            {isSignUpMode && (
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            )}{" "}
            <button type="submit" style={styles.button}>
              {" "}
              {isSignUpMode ? "Sign Up" : "Sign In"}{" "}
            </button>{" "}
            <p style={styles.toggleText}>
              {" "}
              {isSignUpMode
                ? "Already have an account?"
                : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignUpMode(!isSignUpMode)}
                style={styles.toggleButton}
              >
                {" "}
                {isSignUpMode ? "Sign In" : "Sign Up"}{" "}
              </button>{" "}
            </p>{" "}
          </form>{" "}
        </div>
      )}{" "}
    </div>
  );
}

// Simple styling
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    textAlign: "center",
    backgroundColor: "#f0f2f5",
  },
  header: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  title: {
    margin: 0,
    color: "#333",
  },
  apiMessage: {
    margin: "20px 0",
    color: "#555",
    fontFamily: "monospace",
    backgroundColor: "#eee",
    padding: "10px",
    borderRadius: "4px",
  },
  buttonGroup: {
    marginTop: "20px",
  },
  button: {
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    padding: "10px 20px",
    margin: "0 10px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
  authContainer: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    width: "350px",
    maxWidth: "90%",
  },
  authTitle: {
    color: "#333",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  input: {
    padding: "12px",
    borderRadius: "5px",
    border: "1px solid #ddd",
    fontSize: "16px",
  },
  errorMessage: {
    color: "red",
    marginBottom: "15px",
  },
  toggleText: {
    marginTop: "15px",
    color: "#666",
  },
  toggleButton: {
    backgroundColor: "transparent",
    color: "#007bff",
    border: "none",
    padding: "0",
    marginLeft: "5px",
    cursor: "pointer",
    fontSize: "16px",
    textDecoration: "underline",
  },
};

export default App;
