// FrontEnd/src/main.jsx (Updated)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import amplifyConfig from "./config/amplifyConfig.js";
import { Amplify } from "aws-amplify";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // Import for routing
import { AuthProvider } from "./contexts/AuthContext"; // Import AuthProvider
import ProtectedRoute from "./routes/ProtectedRoute.jsx"; // Import ProtectedRoute

Amplify.configure(amplifyConfig); // [cite: 78]

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} /> {/* Your main app content */}{" "}
          <Route
            path="/login"
            element={
              /* A login component if you separate it from App.jsx's Authenticator */
              <h2> Login Page </h2>
            }
          />{" "}
          {/* Example protected route */}{" "}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={<h2> Welcome to the Dashboard! </h2>}
            />{" "}
            {/* Example protected content */}{" "}
          </Route>{" "}
        </Routes>{" "}
      </AuthProvider>{" "}
    </Router>{" "}
  </StrictMode>
);
