import React from "react";
import { Badge } from "@enterprise/shared-ui";
import { FileCheck } from "lucide-react";

export function ApprovalWidget({ pendingCount = 2 }: { pendingCount?: number }) {
  return (
    <div className="inline-flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
      <FileCheck className="w-4 h-4 text-blue-600" />
      <span className="text-slate-700">Team 1 Phê Duyệt:</span>
      <Badge variant="warning">{pendingCount} hồ sơ chờ xử lý</Badge>
    </div>
  );
}

export default ApprovalWidget;
