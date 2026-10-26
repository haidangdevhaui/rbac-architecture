import React from "react";
import ReactDOM from "react-dom/client";
import { ShellLayout } from "@enterprise/shared-ui";
import { PlatformApp } from "./PlatformApp";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ShellLayout
        activePath="/platform"
        currentTeam="Platform & DevOps Remote (Local Standalone - Port 3003)"
      >
        <PlatformApp isStandalone />
      </ShellLayout>
    </React.StrictMode>
  );
}
