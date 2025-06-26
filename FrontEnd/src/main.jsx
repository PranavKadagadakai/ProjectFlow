import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import awsConfig from "./aws-exports.js";
import { Amplify } from "aws-amplify";

Amplify.configure(awsConfig);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
