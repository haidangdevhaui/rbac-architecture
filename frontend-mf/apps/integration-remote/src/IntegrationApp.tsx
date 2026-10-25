import React, { useState } from "react";
import { Button, Card, Badge } from "@enterprise/shared-ui";
import { RefreshCw, Database, CheckCircle2, Clock, ShieldAlert, Sparkles } from "lucide-react";

interface SyncLog {
  id: number;
  voucherId: string;
  sourceDoc: string;
  targetSystem: string;
  status: "SUCCESS" | "SYNCING" | "FAILED";
  timestamp: string;
  retries: number;
}

const mockLogs: SyncLog[] = [
  {
    id: 101,
    voucherId: "VOUCHER-LEGACY-98821",
    sourceDoc: "DOC-MF-003",
    targetSystem: "Oracle EBS 11i (Hệ thống Kế toán Cũ)",
    status: "SUCCESS",
    timestamp: "19/10/2026 14:22:10",
    retries: 0,
  },
  {
    id: 102,
    voucherId: "VOUCHER-LEGACY-98822",
    sourceDoc: "DOC-MF-001",
    targetSystem: "SAP B1 (Hệ thống Quản lý Kho Cũ)",
    status: "SYNCING",
    timestamp: "19/10/2026 15:05:00",
    retries: 1,
  },
];

export function IntegrationApp() {
  const [logs, setLogs] = useState<SyncLog[]>(mockLogs);

  const triggerSync = () => {
    const newLog: SyncLog = {
      id: Date.now(),
      voucherId: `VOUCHER-LEGACY-${Math.floor(10000 + Math.random() * 90000)}`,
      sourceDoc: `DOC-MF-00${Math.floor(4 + Math.random() * 5)}`,
      targetSystem: "Oracle EBS 11i (Hệ thống Kế toán Cũ)",
      status: "SUCCESS",
      timestamp: new Date().toLocaleTimeString("vi-VN"),
      retries: 0,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-purple-300" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-purple-200">
              Federated Remote Component
            </span>
          </div>
          <h2 className="text-xl font-bold mt-1">
            Đồng Bộ & Tích Hợp Hệ Thống Cũ (Team 2 Remote)
          </h2>
          <p className="text-xs text-purple-100 mt-1">
            Anti-Corruption Layer (ACL) • Giao tiếp Oracle/SAP cũ • Quản lý Idempotency
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="info" className="bg-white/20 text-white border-white/30 text-xs">
            Port: 3002
          </Badge>
          <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-xs">
            Remote: integrationApp
          </Badge>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Nhật Ký Đồng Bộ Thời Gian Thực</h4>
          <p className="text-xs text-slate-400">Danh sách các chứng từ vừa được đẩy sang DB cũ</p>
        </div>
        <Button size="sm" variant="primary" onClick={triggerSync}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Thử Kích Hoạt Đồng Bộ (Mock)
        </Button>
      </div>

      {/* Sync Log Cards */}
      <div className="space-y-3">
        {logs.map((log) => (
          <Card key={log.id} className="p-4 flex items-center justify-between hover:shadow-xs transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-800">{log.voucherId}</span>
                  <span className="text-xs text-slate-400">({log.sourceDoc})</span>
                  {log.status === "SUCCESS" && <Badge variant="success">Thành Công</Badge>}
                  {log.status === "SYNCING" && <Badge variant="warning">Đang Đồng Bộ</Badge>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{log.targetSystem}</p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-400 font-mono">
              <span>{log.timestamp}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default IntegrationApp;
