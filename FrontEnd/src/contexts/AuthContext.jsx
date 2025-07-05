// FrontEnd/src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import {
  fetchAuthSession,
  signOut as amplifySignOut,
  signIn,
  signUp,
  confirmSignIn,
  confirmSignUp,
} from "aws-amplify/auth";
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCurrentUser();
  }, []);
  const checkCurrentUser = async () => {
    try {
      const { idToken } = (await fetchAuthSession()).tokens ?? {};
      if (idToken) {
        // Extract the 'custom:role' from the ID token payload
        const userRole = idToken.payload["custom:role"] || "student"; // Default to 'student' if not present
        setUser({
          username:
            idToken.payload["cognito:username"] || idToken.payload.email,
          email: idToken.payload.email,
          role: userRole, // Set the user's role (string: 'student', 'faculty', 'administrator')
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error checking current user:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };
  const handleSignIn = async (username, password) => {
    try {
      const { isSignedIn, nextStep } = await signIn({
        username,
        password,
      });
      if (isSignedIn) {
        await checkCurrentUser(); // Re-check user to get updated role
      }
      return {
        isSignedIn,
        nextStep,
      };
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };
  const handleSignOut = async () => {
    try {
      await amplifySignOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };
  // Modified signUp function to accept a role
  const handleSignUp = async (username, email, password, role) => {
    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username,
        password,
        options: {
          // Use options for attributes in Amplify v6
          userAttributes: {
            email,
            "custom:role": role, // Pass the selected role string as 'custom:role'
          },
        },
      });
      return {
        isSignUpComplete,
        nextStep,
      };
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };
  const handleConfirmSignUp = async (username, confirmationCode) => {
    try {
      await confirmSignUp({
        username,
        confirmationCode,
      });
      // After successful confirmation, you might want to automatically sign in the user
      // or simply let them navigate to the login page.
    } catch (error) {
      console.error("Error confirming sign up:", error);
      throw error;
    }
  };
  const handleConfirmSignIn = async (
    user, // This 'user' parameter is typically from the previous signIn call's result.nextStep.signInUser
    confirmationCode,
    challengeResponse // This is the actual response for the challenge
  ) => {
    try {
      const { isSignedIn, nextStep } = await confirmSignIn({
        challengeResponse,
      });
      if (isSignedIn) {
        await checkCurrentUser();
      }
      return {
        isSignedIn,
        nextStep,
      };
    } catch (error) {
      console.error("Error confirming sign in:", error);
      throw error;
    }
  };
  const value = {
    user,
    isAuthenticated,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    signUp: handleSignUp,
    confirmSignIn: handleConfirmSignIn,
    confirmSignUp: handleConfirmSignUp,
    getToken: async () => {
      try {
        const { idToken } = (await fetchAuthSession()).tokens ?? {};
        return idToken ? idToken.toString() : null;
      } catch (error) {
        console.error("Error getting token from AuthContext:", error);
        return null;
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
