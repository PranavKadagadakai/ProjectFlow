// FrontEnd/src/pages/FacultyDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const FacultyDashboard = () => {
  const { user } = useAuth(); // Get user information from AuthContext

  return (
    <div className="card shadow-sm p-4 rounded text-center bg-white">
      <h2 className="mb-4 text-dark">Welcome, {user?.username} (Faculty)!</h2>
      <p className="lead mb-4">
        This is your faculty dashboard. Manage projects, rubrics, and evaluate
        student submissions.
      </p>
      <div className="d-grid gap-3 col-md-8 mx-auto">
        <Link to="/create-project" className="btn btn-primary btn-lg">
          Create New Project
        </Link>
        <Link to="/faculty-submissions" className="btn btn-info btn-lg">
          View All Submissions
        </Link>
        <Link to="/leaderboard" className="btn btn-secondary btn-lg">
          View Leaderboard
        </Link>
        {/* Add links to manage own projects, create rubrics, etc. */}
        {/* <Link to="/my-projects" className="btn btn-outline-primary btn-lg">Manage My Projects</Link> */}
      </div>
    </div>
  );
};

export default FacultyDashboard;
