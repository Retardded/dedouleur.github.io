import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import Admin from "./admin/Admin";

const isAdminPath = window.location.pathname === "/x9k2m8p7q4n6";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>{isAdminPath ? <Admin /> : <App />}</React.StrictMode>,
);
