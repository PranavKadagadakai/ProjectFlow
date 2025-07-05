// FrontEnd/src/pages/FacultyDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const FacultyDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="card shadow-sm p-4 rounded text-center">
      <h2 className="mb-4">Welcome, {user?.username} (Faculty)!</h2>
      <p className="lead mb-4">
        Manage projects, define rubrics, and evaluate student submissions from
        here.
      </p>
      <div className="d-grid gap-3 col-md-8 mx-auto">
        <Link to="/create-project" className="btn btn-primary btn-lg">
          Create New Project
        </Link>
        <Link to="/submissions" className="btn btn-info btn-lg">
          View All Submissions
        </Link>
        <Link to="/leaderboard" className="btn btn-secondary btn-lg">
          View Leaderboard
        </Link>
      </div>
    </div>
  );
};

export default FacultyDashboard;
