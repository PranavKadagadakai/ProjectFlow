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
    const hasRole =
      (role === "faculty" && user?.is_staff) ||
      (role === "student" && !user?.is_staff);
    if (!hasRole) {
      // User is authenticated but doesn't have the required role.
      // Redirect them to their respective dashboard.
      const destination = user?.is_staff
        ? "/faculty-dashboard"
        : "/student-dashboard";
      return <Navigate to={destination} replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
