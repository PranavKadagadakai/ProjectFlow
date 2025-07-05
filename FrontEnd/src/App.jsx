import React from "react";
import { Routes, Route } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./routes/ProtectedRoute";

// Public Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LeaderboardPage from "./pages/LeaderboardPage";

// Student Pages
import StudentDashboard from "./pages/StudentDashboard";
import SubmitProjectPage from "./pages/SubmitProjectPage";
import MySubmissionsPage from "./pages/MySubmissionsPage"; // New
import ProjectResultsPage from "./pages/ProjectResultsPage";
import StudentProfile from "./pages/StudentProfile"; // New

// Faculty Pages
import FacultyDashboard from "./pages/FacultyDashboard";
import CreateProjectPage from "./pages/CreateProjectPage";
import FacultySubmissionsView from "./pages/FacultySubmissionsView";
import EvaluateSubmissionPage from "./pages/EvaluateSubmissionPage";
import ProjectRubricsPage from "./pages/ProjectRubricsPage"; // Updated
import CreateRubricPage from "./pages/CreateRubricPage"; // Updated

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />

          {/* Student Routes */}
          <Route element={<ProtectedRoute role="student" />}>
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/student-profile" element={<StudentProfile />} />
            <Route path="/submit-project" element={<SubmitProjectPage />} />
            <Route path="/my-submissions" element={<MySubmissionsPage />} />
            <Route
              path="/results/:submissionId"
              element={<ProjectResultsPage />}
            />
          </Route>

          {/* Faculty Routes */}
          <Route element={<ProtectedRoute role="faculty" />}>
            <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
            <Route path="/create-project" element={<CreateProjectPage />} />
            <Route path="/submissions" element={<FacultySubmissionsView />} />
            <Route
              path="/evaluate/:submissionId"
              element={<EvaluateSubmissionPage />}
            />
            <Route
              path="/project/:projectId/rubrics"
              element={<ProjectRubricsPage />}
            />
            <Route
              path="/project/:projectId/create-rubric"
              element={<CreateRubricPage />}
            />
          </Route>
        </Routes>
      </div>
    </>
  );
}

export default App;
