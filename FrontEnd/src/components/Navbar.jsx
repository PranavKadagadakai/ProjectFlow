// FrontEnd/src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useTheme } from "../contexts/ThemeContext"; // Import useTheme

const Navbar = () => {
  const { isAuthenticated, user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme(); // Use theme context
  const navigate = useNavigate();

  // Handler for signing out, includes navigation redirection
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login"); // Redirect to login page after successful sign out
    } catch (error) {
      console.error("Error signing out:", error);
      // Optionally display an error message to the user
    }
  };

  return (
    // Navbar using Bootstrap classes, background color dynamically set by CSS variables
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        {/* Brand/Logo Link */}
        <Link className="navbar-brand" to="/">
          Project Portal
        </Link>

        {/* Toggler for responsive navbar on small screens */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Collapse Content */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {isAuthenticated ? (
              // Links for Authenticated Users (conditional on role)
              <>
                {user?.is_staff ? ( // Faculty Specific Links
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/faculty-dashboard">
                        Faculty Dashboard
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/create-project">
                        Create Project
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/faculty-submissions">
                        View Submissions
                      </Link>
                    </li>
                    {/* Add more faculty-specific links here, e.g., view rubrics for projects */}
                  </>
                ) : (
                  // Student Specific Links
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/student-dashboard">
                        Student Dashboard
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/submit-project">
                        Submit Project
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/student-profile">
                        Profile
                      </Link>
                    </li>
                    {/* Add more student-specific links here, e.g., "My Submissions" */}
                  </>
                )}
                {/* Common Protected Links */}
                <li className="nav-item">
                  <Link className="nav-link" to="/leaderboard">
                    Leaderboard
                  </Link>
                </li>
              </>
            ) : (
              // Links for Public/Unauthenticated Users
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/">
                    Home
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>

          {/* Right-aligned items: User Greeting, Theme Toggle, Sign Out */}
          <div className="d-flex align-items-center">
            {isAuthenticated && (
              <span className="navbar-text me-3">Hello, {user?.username}!</span>
            )}

            {/* Theme Toggle Button using Bootstrap Icons */}
            <button
              className="theme-toggle-button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <i className="bi bi-moon-fill"></i> // Moon icon for switching to dark theme
              ) : (
                <i className="bi bi-sun-fill"></i> // Sun icon for switching to light theme
              )}
            </button>

            {/* Sign Out Button (only visible when authenticated) */}
            {isAuthenticated && (
              <button className="btn btn-danger ms-3" onClick={handleSignOut}>
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
