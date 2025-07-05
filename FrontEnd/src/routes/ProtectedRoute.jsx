// FrontEnd/src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ProtectedRoute = ({ role }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after they login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based access check
  if (role) {
    let hasRequiredRole = false;
    if (role === "student" && user?.role === "student") {
      hasRequiredRole = true;
    } else if (
      role === "faculty" &&
      (user?.role === "faculty" || user?.role === "administrator")
    ) {
      // Faculty route allows both 'faculty' and 'administrator' roles
      hasRequiredRole = true;
    } else if (role === "administrator" && user?.role === "administrator") {
      hasRequiredRole = true;
    }

    if (!hasRequiredRole) {
      // User is authenticated but doesn't have the required role.
      // Redirect them to their respective dashboard based on their actual role.
      let destination = "/"; // Default redirect
      if (user?.role === "student") {
        destination = "/student-dashboard";
      } else if (user?.role === "faculty" || user?.role === "administrator") {
        destination = "/faculty-dashboard"; // Faculty and Admin go to faculty dashboard
      }
      return <Navigate to={destination} replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
