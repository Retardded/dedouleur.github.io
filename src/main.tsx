import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import Admin from "./admin/Admin";

const isAdminPath = window.location.pathname === "/x9k2m8p7q4n6";

/* Safari 26 Liquid Glass: sync viewport height when address bar shows/hides */
function setViewportHeight() {
  const vh = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}
setViewportHeight();
window.addEventListener("resize", setViewportHeight);
window.visualViewport?.addEventListener("resize", setViewportHeight);
window.visualViewport?.addEventListener("scroll", setViewportHeight);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>{isAdminPath ? <Admin /> : <App />}</React.StrictMode>,
);
