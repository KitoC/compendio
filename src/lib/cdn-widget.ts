
import React from "react";
import { createRoot } from "react-dom/client";
import { ChatWidget } from "../components/chat/ChatWidget";

(function () {
  // Create container element
  const rootEl = document.createElement("div");
  rootEl.id = "skybrook-chat-widget-container";
  document.body.appendChild(rootEl);

  // Create Shadow DOM for style isolation
  const shadowRoot = rootEl.attachShadow({ mode: "open" });

  // Create a container inside the shadow DOM for React to render into
  const shadowContainer = document.createElement("div");
  shadowContainer.id = "skybrook-chat-widget-shadow-container";
  shadowRoot.appendChild(shadowContainer);

  // Determine the CSS URL
  const cssUrl =
    process.env.NODE_ENV === "development"
      ? "../dist/chat-widget.css"
      : "https://skybrook-ai.netlify.app/chat-widget.css";

  // Create a style element for Tailwind reset styles
  // These base styles ensure Tailwind works properly in Shadow DOM
  const resetStyles = document.createElement("style");
  resetStyles.textContent = `
    *, ::before, ::after {
      box-sizing: border-box;
      border-width: 0;
      border-style: solid;
      border-color: currentColor;
    }
    :host {
      line-height: 1.5;
      -webkit-text-size-adjust: 100%;
      -moz-tab-size: 4;
      tab-size: 4;
      font-family: ui-sans-serif, system-ui, sans-serif;
    }
  `;
  shadowRoot.appendChild(resetStyles);

  // Load widget-specific styles directly into the Shadow DOM
  fetch(cssUrl)
    .then((response) => response.text())
    .then((cssText) => {
      const styleElement = document.createElement("style");
      // Process the CSS to ensure it works within Shadow DOM
      // This replaces any :root selectors with :host
      const processedCss = cssText.replace(/:root/g, ":host");
      styleElement.textContent = processedCss;
      shadowRoot.appendChild(styleElement);

      // Render React component into Shadow DOM
      const root = createRoot(shadowContainer);
      root.render(
        React.createElement(ChatWidget, {
          position: "bottom-right",
          defaultOpen: false,
        })
      );
    })
    .catch((error) => {
      console.error("Failed to load chat widget styles:", error);
      // Render even if styles fail to load
      const root = createRoot(shadowContainer);
      root.render(
        React.createElement(ChatWidget, {
          position: "bottom-right",
          defaultOpen: false,
        })
      );
    });
})();
