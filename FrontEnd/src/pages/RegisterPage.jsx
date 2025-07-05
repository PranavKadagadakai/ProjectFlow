// FrontEnd/src/pages/RegisterPage.jsx
import React, { useState, useEffect } from "react"; // Import useEffect
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student", // Default role is 'student'
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState(1); // 1 for registration, 2 for verification
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { signUp, confirmSignUp } = useAuth();
  const navigate = useNavigate();

  // Log the current step on every render to help debug
  console.log("RegisterPage - Current step (render):", step);

  // Debugging useEffect for component mount/unmount
  useEffect(() => {
    console.log("RegisterPage Mounted. Initial step:", step);
    return () => {
      console.log("RegisterPage Unmounted.");
    };
  }, []);

  // Debugging useEffect for step state changes
  useEffect(() => {
    console.log("RegisterPage - step state changed to:", step);
  }, [step]);

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
      const result = await signUp(
        formData.username,
        formData.email,
        formData.password,
        formData.role
      );

      console.log("Amplify signUp result:", result);

      // Check the nextStep to determine the flow
      if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setMessage(
          "A verification code has been sent to your email. Please enter it below."
        );
        setStep(2); // <--- This is called
        console.log("RegisterPage - Calling setStep(2)."); // Confirm this line is reached
      } else if (result.isSignUpComplete) {
        // This case might happen if auto-verification is enabled in Cognito
        setMessage("Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        // Handle other unexpected nextSteps if any
        setMessage(
          `Registration completed with an unexpected step: ${result.nextStep.signUpStep}. Please check your email for a verification code if you haven't received one.`
        );
      }
    } catch (error) {
      console.error("Registration failed:", error); // Log the full error
      setMessage(error.message || "Registration failed. Please try again.");
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
      console.error("Verification failed:", error); // Log the full error
      setMessage(
        error.message ||
          "Verification failed. Please check the code and try again."
      );
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
            <label htmlFor="username">Username</label>
            <input
              type="text"
              name="username"
              id="username"
              className="form-control"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              className="form-control"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>
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
            <label htmlFor="verificationCode">Verification Code</label>
            <input
              type="text"
              id="verificationCode"
              className="form-control"
              value={verificationCode}
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
