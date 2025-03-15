import "regenerator-runtime/runtime"; // Import regenerator runtime for Safari compatibility
import "core-js/stable";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Finding the root element
const rootElement = document.getElementById("root");

// Handle potential errors during initial rendering
const renderApp = () => {
  try {
    // Ensure we have a root element
    if (!rootElement) {
      const newRoot = document.createElement("div");
      newRoot.id = "root";
      document.body.appendChild(newRoot);

      createRoot(newRoot).render(<App />);
      console.log("Created new root element for rendering");
    } else {
      createRoot(rootElement).render(<App />);
      console.log("Rendered into existing root element");
    }
  } catch (error) {
    console.error("Failed to render application:", error);

    // Create fallback error UI directly
    const errorElement = document.createElement("div");
    errorElement.style.position = "fixed";
    errorElement.style.top = "0";
    errorElement.style.left = "0";
    errorElement.style.width = "100%";
    errorElement.style.height = "100%";
    errorElement.style.backgroundColor = "white";
    errorElement.style.display = "flex";
    errorElement.style.flexDirection = "column";
    errorElement.style.alignItems = "center";
    errorElement.style.justifyContent = "center";
    errorElement.style.padding = "16px";
    errorElement.style.textAlign = "center";

    errorElement.innerHTML = `
      <div style="max-width: 90%; width: 400px;">
        <h2 style="color: #ff0000; margin-bottom: 16px;">Unable to start application</h2>
        <p style="margin-bottom: 16px;">An error occurred while initializing the app. Please try refreshing the page.</p>
        <button style="padding: 8px 16px; background: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.location.reload()">Refresh Page</button>
      </div>
    `;

    document.body.appendChild(errorElement);
  }
};

// Ensure the viewport is properly set for mobile devices and Safari
const setMobileViewport = () => {
  let viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    viewportMeta = document.createElement("meta");
    viewportMeta.setAttribute("name", "viewport");
    document.head.appendChild(viewportMeta);
  }
  // Add Safari-specific viewport settings
  viewportMeta.setAttribute(
    "content",
    "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, shrink-to-fit=no"
  );

  // Add web-app-capable meta tag for iOS Safari
  let webAppCapableMeta = document.querySelector(
    'meta[name="apple-mobile-web-app-capable"]'
  );
  if (!webAppCapableMeta) {
    webAppCapableMeta = document.createElement("meta");
    webAppCapableMeta.setAttribute("name", "apple-mobile-web-app-capable");
    webAppCapableMeta.setAttribute("content", "yes");
    document.head.appendChild(webAppCapableMeta);
  }

  // Add status bar style for iOS Safari
  let statusBarMeta = document.querySelector(
    'meta[name="apple-mobile-web-app-status-bar-style"]'
  );
  if (!statusBarMeta) {
    statusBarMeta = document.createElement("meta");
    statusBarMeta.setAttribute("name", "apple-mobile-web-app-status-bar-style");
    statusBarMeta.setAttribute("content", "black-translucent");
    document.head.appendChild(statusBarMeta);
  }
};

// Execute viewport adjustment and app rendering
setMobileViewport();
renderApp();
