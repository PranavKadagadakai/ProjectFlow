import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import { BrowserRouter as Router } from "react-router-dom";

// Import Bootstrap CSS and Icons
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css"; // For theme toggle icons
import "./index.css"; // Custom global styles, including theme variables

import App from "./App.jsx"; // App will contain the main routing logic
import amplifyConfig from "./config/amplifyConfig.js";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext.jsx"; // Import ThemeProvider

Amplify.configure(amplifyConfig);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router>
      {/* ThemeProvider wraps everything to provide theme context globally */}
      <ThemeProvider>
        {/* AuthProvider wraps App to provide authentication context */}
        <AuthProvider>
          <App />{" "}
          {/* App component handles all routes and conditional rendering */}
        </AuthProvider>
      </ThemeProvider>
    </Router>
  </StrictMode>
);
