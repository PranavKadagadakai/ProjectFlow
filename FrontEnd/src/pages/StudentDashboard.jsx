// FrontEnd/src/pages/StudentDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="card shadow-sm p-4 rounded text-center">
      <h2 className="mb-4">Welcome, {user?.username}!</h2>
      <p className="lead mb-4">
        This is your student dashboard. Submit new projects and track your
        results.
      </p>
      <div className="d-grid gap-3 col-md-8 mx-auto">
        <Link to="/submit-project" className="btn btn-success btn-lg">
          Submit a New Project
        </Link>
        <Link to="/my-submissions" className="btn btn-info btn-lg">
          View My Submissions & Results
        </Link>
        <Link to="/leaderboard" className="btn btn-secondary btn-lg">
          View Leaderboard
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
