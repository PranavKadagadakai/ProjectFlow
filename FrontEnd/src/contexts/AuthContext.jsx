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
      const { idToken, accessToken } = (await fetchAuthSession()).tokens ?? {};
      if (idToken) {
        setUser({
          username:
            idToken.payload["cognito:username"] || idToken.payload.email,
          email: idToken.payload.email,
          // Add other user attributes as needed from the token
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
    setLoading(true);
    try {
      const { isSignedIn, nextStep } = await signIn({
        username,
        password,
      });
      if (isSignedIn) {
        await checkCurrentUser();
      }
      return {
        isSignedIn,
        nextStep,
      };
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await amplifySignOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (username, password, email) => {
    setLoading(true);
    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username,
        password,
        attributes: {
          email,
        },
      });
      return {
        isSignUpComplete,
        nextStep,
      };
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (username, confirmationCode) => {
    setLoading(true);
    try {
      await confirmSignUp({
        username,
        confirmationCode,
      });
      await handleSignIn(
        username /* You might need to prompt for password again or handle flow */
      );
    } catch (error) {
      console.error("Error confirming sign up:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignIn = async (
    user,
    confirmationCode,
    challengeResponse
  ) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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

  return (
    <AuthContext.Provider value={value}>
      {" "}
      {!loading && children}{" "}
    </AuthContext.Provider>
  );
};

export default AuthContext;
