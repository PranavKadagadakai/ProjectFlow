// FrontEnd/src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    setSignUpSuccess(false); // Reset success state on new attempt
    try {
      const result = await signUp(username, password, email);
      if (result.isSignUpComplete) {
        setSignUpSuccess(true);
        // Navigate to login after successful sign up
        navigate("/login", {
          state: { message: "Registration successful! Please log in." },
        });
      } else {
        setAuthError(
          `Sign-up requires next step: ${result.nextStep.signUpStep}`
        );
      }
    } catch (error) {
      console.error("Sign up error:", error);
      setAuthError(
        error.message || "An unknown error occurred during sign-up."
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
      <h2 className="mb-4 text-dark">Register</h2>
      {authError && (
        <div className="alert alert-danger" role="alert">
          {authError}
        </div>
      )}
      {signUpSuccess && (
        <div className="alert alert-success" role="alert">
          Registration successful! Please check your email for a confirmation
          code if required, then login.
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
            type="email"
            className="form-control"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Registering..." : "Register"}
          </button>
        </div>
      </form>
      <p className="mt-3 text-muted">
        Already have an account?{" "}
        <Link to="/login" className="btn btn-link p-0 border-0">
          Login
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
