declare module "approvalApp/ApprovalApp" {
  import React from "react";
  const ApprovalApp: React.ComponentType<{ isStandalone?: boolean }>;
  export default ApprovalApp;
}

declare module "approvalApp/ApprovalWidget" {
  import React from "react";
  const ApprovalWidget: React.ComponentType<{ pendingCount?: number }>;
  export default ApprovalWidget;
}

declare module "integrationApp/IntegrationApp" {
  import React from "react";
  const IntegrationApp: React.ComponentType;
  export default IntegrationApp;
}

declare module "integrationApp/LegacySyncWidget" {
  import React from "react";
  export interface LegacySyncWidgetProps {
    documentCode: string;
    legacyVoucherId?: string;
    status?: "SUCCESS" | "PENDING";
  }
  const LegacySyncWidget: React.ComponentType<LegacySyncWidgetProps>;
  export default LegacySyncWidget;
}
