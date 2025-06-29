// FrontEnd/src/pages/HomePage.jsx
import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="text-center p-5">
      <h1 className="display-4 text-primary mb-4">
        Welcome to the Project Submission Portal
      </h1>
      <p className="lead mb-4">
        Your platform for managing academic project submissions and evaluations.
      </p>
      <div className="d-grid gap-3 col-md-6 mx-auto">
        <Link to="/login" className="btn btn-primary btn-lg">
          Login
        </Link>
        <Link to="/register" className="btn btn-outline-secondary btn-lg">
          Register
        </Link>
        <Link to="/leaderboard" className="btn btn-info btn-lg">
          View Leaderboard (Public)
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
