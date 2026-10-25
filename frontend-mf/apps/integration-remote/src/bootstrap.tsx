import React from "react";
import ReactDOM from "react-dom/client";
import { ShellLayout } from "@enterprise/shared-ui";
import { IntegrationApp } from "./IntegrationApp";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ShellLayout
        activePath="/integrations"
        currentTeam="Team 2: Integration Remote (Standalone Dev - Port 3002)"
      >
        <IntegrationApp />
      </ShellLayout>
    </React.StrictMode>
  );
}
