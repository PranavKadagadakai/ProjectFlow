import React, { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import Navbar from "./components/Navbar"; // Import the new Navbar
import ProtectedRoute from "./routes/ProtectedRoute"; // Your existing ProtectedRoute

// Public Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Protected Pages (Common for both roles, but require authentication)
import LeaderboardPage from "./pages/LeaderboardPage";
import SubmitProjectPage from "./pages/SubmitProjectPage";
import ProjectResultsPage from "./pages/ProjectResultsPage";

// Protected Pages (Student Specific)
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import EditStudentProfile from "./pages/EditStudentProfile";

// Protected Pages (Faculty Specific)
import FacultyDashboard from "./pages/FacultyDashboard";
import CreateProjectPage from "./pages/CreateProjectPage";
import FacultySubmissionsView from "./pages/FacultySubmissionsView";
import EvaluateSubmissionPage from "./pages/EvaluateSubmissionPage";
import ProjectRubricsPage from "./pages/ProjectRubricsPage";
import CreateRubricPage from "./pages/CreateRubricPage";

function App() {
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect authenticated users trying to access public pages to their respective dashboards
  useEffect(() => {
    if (!loading && isAuthenticated) {
      const publicPaths = ["/", "/login", "/register"];
      if (publicPaths.includes(location.pathname)) {
        if (user?.is_staff) {
          navigate("/faculty-dashboard", { replace: true });
        } else {
          navigate("/student-dashboard", { replace: true });
        }
      }
    }
  }, [loading, isAuthenticated, user, navigate, location.pathname]);

  if (loading) {
    // Show a global loading spinner while authentication state is being determined
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <h2 className="text-dark">Loading authentication...</h2>
      </div>
    );
  }

  return (
    <>
      <Navbar /> {/* Navbar is rendered on all pages */}
      <div className="content-wrapper">
        {" "}
        {/* Main content area for all pages */}
        <Routes>
          {/* Public Routes (accessible to anyone) */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Common Protected Routes (require any authenticated user) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/submit-project" element={<SubmitProjectPage />} />
            <Route
              path="/project-results/:submissionId"
              element={<ProjectResultsPage />}
            />
          </Route>

          {/* Student Specific Protected Routes (require authenticated student) */}
          <Route element={<ProtectedRoute requiredRole="student" />}>
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/student-profile" element={<StudentProfile />} />
            <Route
              path="/edit-student-profile"
              element={<EditStudentProfile />}
            />
          </Route>

          {/* Faculty Specific Protected Routes (require authenticated faculty) */}
          <Route element={<ProtectedRoute requiredRole="faculty" />}>
            <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
            <Route path="/create-project" element={<CreateProjectPage />} />
            <Route
              path="/faculty-submissions"
              element={<FacultySubmissionsView />}
            />
            <Route
              path="/evaluate-submission/:submissionId"
              element={<EvaluateSubmissionPage />}
            />
            <Route
              path="/projects/:projectId/rubrics"
              element={<ProjectRubricsPage />}
            />
            <Route
              path="/projects/:projectId/create-rubric"
              element={<CreateRubricPage />}
            />
          </Route>
        </Routes>
      </div>
    </>
  );
}

export default App;
