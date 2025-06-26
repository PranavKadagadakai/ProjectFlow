// FrontEnd/src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth"; // Path to your useAuth hook

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Applying Bootstrap classes for a centered loading spinner and text
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-dark">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render the child routes, otherwise navigate to the login page
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
