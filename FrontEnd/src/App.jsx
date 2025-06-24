import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { fetchAuthSession, signIn, signOut } from "aws-amplify/auth";

function App({ signOut, user }) {
  async function callAPI() {
    const session = await fetchAuthSession();
    const token = session.getIdToken().getJWTToken();

    const response = await fetch("http://localhost:8000/api/protected/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      console.error("API call failed:", response.statusText);
      return;
    }

    const data = await response.json();
    alert(`API Response: ${JSON.stringify(data)}`);
  }

  return (
    <>
      <div>
        <h2>Welcome {user.username}</h2>
        <button onClick={callAPI}>Call Django API</button>
        <button onClick={signOut}>Sign Out</button>
      </div>
    </>
  );
}

export default withAuthenticator(App);
