// FrontEnd/src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student", // Default role
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState(1); // 1 for registration, 2 for verification
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { signUp, confirmSignUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await signUp(
        formData.username,
        formData.email,
        formData.password,
        formData.role
      );
      setMessage("A verification code has been sent to your email.");
      setStep(2); // Move to verification step
    } catch (error) {
      setMessage(error.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      await confirmSignUp(formData.username, verificationCode);
      setMessage("Verification successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setMessage(error.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: "500px" }}>
      <h2 className="mb-4 text-center">
        {step === 1 ? "Create Account" : "Verify Email"}
      </h2>
      {message && <div className="alert alert-info">{message}</div>}

      {step === 1 ? (
        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <label>Username</label>
            <input
              type="text"
              name="username"
              className="form-control"
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label>Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-control"
              onChange={handleChange}
              required
            />
          </div>
          {/* --- New Role Selection Dropdown --- */}
          <div className="mb-3">
            <label htmlFor="role" className="form-label">
              Register as
            </label>
            <select
              id="role"
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="administrator">Administrator</option>
            </select>
          </div>
          {/* --- End of New Code --- */}
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify}>
          <div className="mb-3">
            <label>Verification Code</label>
            <input
              type="text"
              className="form-control"
              onChange={(e) => setVerificationCode(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      )}
    </div>
  );
};

export default RegisterPage;
