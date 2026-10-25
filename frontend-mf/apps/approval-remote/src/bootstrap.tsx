import React from "react";
import ReactDOM from "react-dom/client";
import { ShellLayout } from "@enterprise/shared-ui";
import { ApprovalApp } from "./ApprovalApp";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ShellLayout
        activePath="/approvals"
        currentTeam="Team 1: Approval Remote (Local Standalone - Port 3001)"
      >
        <ApprovalApp isStandalone />
      </ShellLayout>
    </React.StrictMode>
  );
}
