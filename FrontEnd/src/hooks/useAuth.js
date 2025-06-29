// FrontEnd/src/hooks/useAuth.js
import { useContext } from "react";
import AuthContext from "../contexts/AuthContext"; // Path to your AuthContext

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default useAuth;
