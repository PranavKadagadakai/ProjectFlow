// FrontEnd/src/pages/LoginPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth(); // Get user object to check roles after signIn
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    try {
      const result = await signIn(username, password);
      if (result.isSignedIn) {
        console.log("Login successful!");
        // User object in AuthContext will be updated by checkCurrentUser after signIn
        // Give it a moment to update, then redirect based on role
        if (user?.is_staff) {
          navigate("/faculty-dashboard", { replace: true });
        } else {
          navigate("/student-dashboard", { replace: true });
        }
      } else {
        setAuthError(
          `Sign-in requires next step: ${result.nextStep.signInStep}`
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(
        error.message || "An unknown error occurred during sign-in."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="card shadow-sm p-4 rounded text-center bg-white"
      style={{ maxWidth: "400px", width: "90%" }}
    >
      <h2 className="mb-4 text-dark">Login</h2>
      {authError && (
        <div className="alert alert-danger" role="alert">
          {authError}
        </div>
      )}
      <form onSubmit={handleSubmit}>
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
        <div className="d-grid gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Logging In..." : "Login"}
          </button>
        </div>
      </form>
      <p className="mt-3 text-muted">
        Don't have an account?{" "}
        <Link to="/register" className="btn btn-link p-0 border-0">
          Register
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
