// FrontEnd/src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth"; // Path to your useAuth hook

// ProtectedRoute component handles authentication and optional role-based access.
// Props:
// - requiredRole: 'student' or 'faculty' (optional). If provided, checks user's role.
const ProtectedRoute = ({ requiredRole }) => {
  const { isAuthenticated, loading, user } = useAuth(); // Get auth state and user from context

  // Display a loading spinner or message while authentication status is being determined
  if (loading) {
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

  // If not authenticated, redirect to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, check for role-based access if a role is required
  if (requiredRole) {
    // Determine if the user has the required role
    const isStudent = !user?.is_staff; // Assume non-staff is student
    const isFaculty = user?.is_staff;

    if (requiredRole === "student" && !isStudent) {
      // If student role is required but user is not a student (e.g., is faculty), redirect
      return <Navigate to="/faculty-dashboard" replace />; // Redirect faculty to their dashboard
    }
    if (requiredRole === "faculty" && !isFaculty) {
      // If faculty role is required but user is not faculty (e.g., is student), redirect
      return <Navigate to="/student-dashboard" replace />; // Redirect student to their dashboard
    }
  }

  // If authenticated and role checks pass (or no role required), render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
