import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
// This is the correct import for fetching the session in Amplify v6+
import { fetchAuthSession } from "aws-amplify/auth";
import { useState } from "react";

function App() {
  // State to hold the API response message
  const [apiMessage, setApiMessage] = useState(
    "Click the button to call the protected API."
  );

  // Correctly gets the ID token using the modern fetchAuthSession function
  async function getToken() {
    try {
      // fetchAuthSession returns a session object containing the tokens
      const { idToken } = (await fetchAuthSession()).tokens ?? {};
      if (!idToken) {
        throw new Error("ID Token not found");
      }
      console.log("ID Token:", idToken);
      return idToken.toString(); // The token is an object, convert it to a string
    } catch (error) {
      console.error("Error getting token:", error);
      setApiMessage(`Error getting token: ${error.message}`);
      return null;
    }
  }

  // Calls the protected Django API
  async function callApi() {
    setApiMessage("Calling API...");
    const token = await getToken();

    // Only proceed if the token was successfully retrieved
    if (!token) {
      setApiMessage("Could not get auth token. Please sign in again.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/protected/", {
        method: "GET",
        headers: {
          // Send the validated token in the Authorization header
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Handle non-2xx responses from the API
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `API returned status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("API Response:", data);
      setApiMessage(data.message || "Successfully fetched data!");
    } catch (error) {
      console.error("Error calling API:", error);
      setApiMessage(`Error calling API: ${error.message}`);
    }
  }

  return (
    // The Authenticator component handles sign-in, sign-up, and sign-out states
    <Authenticator>
      {({ signOut, user }) => (
        <div style={styles.container}>
          <header style={styles.header}>
            <h1 style={styles.title}>Hello, {user.username}!</h1>
            <p style={styles.apiMessage}>{apiMessage}</p>
            <div style={styles.buttonGroup}>
              <button style={styles.button} onClick={callApi}>
                Call Protected API
              </button>
              <button style={styles.button} onClick={signOut}>
                Sign Out
              </button>
            </div>
          </header>
        </div>
      )}
    </Authenticator>
  );
}

// Simple styling
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    textAlign: "center",
    backgroundColor: "#f0f2f5",
  },
  header: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  title: {
    margin: 0,
    color: "#333",
  },
  apiMessage: {
    margin: "20px 0",
    color: "#555",
    fontFamily: "monospace",
    backgroundColor: "#eee",
    padding: "10px",
    borderRadius: "4px",
  },
  buttonGroup: {
    marginTop: "20px",
  },
  button: {
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    padding: "10px 20px",
    margin: "0 10px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

// We only need to export the App component itself, not wrapped in the HOC
export default App;
