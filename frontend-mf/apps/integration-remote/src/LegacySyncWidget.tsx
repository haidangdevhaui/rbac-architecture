import React from "react";
import { Badge } from "@enterprise/shared-ui";
import { CheckCircle2, Clock, Database } from "lucide-react";

export interface LegacySyncWidgetProps {
  documentCode: string;
  legacyVoucherId?: string;
  status?: "SUCCESS" | "PENDING";
}

export function LegacySyncWidget({
  documentCode,
  legacyVoucherId,
  status = "SUCCESS",
}: LegacySyncWidgetProps) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-purple-50/70 border border-purple-200/80 text-xs">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-purple-600" />
        <span className="text-slate-600 font-medium">Oracle EBS Sync:</span>
        {status === "SUCCESS" ? (
          <span className="font-mono text-purple-900 font-bold">
            #{legacyVoucherId || "VOUCHER_LEGACY_98821"}
          </span>
        ) : (
          <span className="text-amber-600 italic">Đang chờ phê duyệt hoàn tất...</span>
        )}
      </div>

      <div>
        {status === "SUCCESS" ? (
          <Badge variant="success" className="text-[10px]">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Đã Hạch Toán
          </Badge>
        ) : (
          <Badge variant="warning" className="text-[10px]">
            <Clock className="w-3 h-3 mr-1" /> Chờ Đẩy
          </Badge>
        )}
      </div>
    </div>
  );
}

export default LegacySyncWidget;
