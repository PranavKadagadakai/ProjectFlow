import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useTheme } from "../contexts/ThemeContext";

const Navbar = () => {
  const { isAuthenticated, user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isFacultyOrAdmin =
    user?.role === "faculty" || user?.role === "administrator";
  const isStudent = user?.role === "student";

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          ProjectFlow
        </Link>
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
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {isAuthenticated ? (
              <>
                {isFacultyOrAdmin && (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/faculty-dashboard">
                        Dashboard
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/my-projects">
                        My Projects
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/submissions">
                        Submissions
                      </Link>
                    </li>
                  </>
                )}
                {isStudent && (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/student-dashboard">
                        Dashboard
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/my-submissions">
                        My Submissions
                      </Link>
                    </li>
                  </>
                )}
                <li className="nav-item">
                  <Link className="nav-link" to="/leaderboard">
                    Leaderboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to={`/profile/${user?.username}`}>
                    Profile
                  </Link>
                </li>
              </>
            ) : (
              <>
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
          <div className="d-flex align-items-center">
            {isAuthenticated && (
              <span className="navbar-text me-3">Hello, {user?.username}!</span>
            )}
            <button
              className="theme-toggle-button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <i className="bi bi-moon-fill"></i>
              ) : (
                <i className="bi bi-sun-fill"></i>
              )}
            </button>
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
