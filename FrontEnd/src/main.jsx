import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import Bootstrap CSS
import "bootstrap/dist/css/bootstrap.min.css";
// Import custom global CSS after Bootstrap to allow overrides if necessary
import "./index.css";

import App from "./App.jsx";
import amplifyConfig from "./config/amplifyConfig.js";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import SubmissionForm from "./components/SubmissionForm.jsx"; // Import the SubmissionForm component

console.log("Amplify Configuration being applied:", amplifyConfig);

Amplify.configure(amplifyConfig);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <Routes>
          {/* Main App route (can be login/home or dashboard based on auth) */}
          <Route path="/" element={<App />} />

          {/* Placeholder for dedicated login/signup pages if separated from App.jsx */}
          <Route
            path="/login"
            element={
              <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                <h2 className="text-center text-dark">Login Page</h2>
              </div>
            }
          />
          <Route
            path="/signup"
            element={
              <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                <h2 className="text-center text-dark">Sign Up Page</h2>
              </div>
            }
          />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={
                <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                  <h2 className="text-center text-dark">
                    Welcome to the Dashboard!
                  </h2>
                </div>
              }
            />
            {/* New protected route for submission form */}
            <Route path="/submit-project" element={<SubmissionForm />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  </StrictMode>
);
