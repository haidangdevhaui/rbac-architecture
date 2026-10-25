import React, { useState } from "react";
import { Button, Card, Badge } from "@enterprise/shared-ui";
import {
  FileCheck,
  Check,
  X,
  Send,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";

export interface DocumentItem {
  id: number;
  documentCode: string;
  title: string;
  description: string;
  amount: number;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  currentStep: number;
  totalSteps: number;
  creatorName: string;
}

const initialDocuments: DocumentItem[] = [
  {
    id: 1,
    documentCode: "DOC-MF-001",
    title: "Tờ trình thanh toán kinh phí bản quyền hạ tầng Cloud",
    description: "Thanh toán định kỳ hóa đơn AWS & Kubernetes cluster theo hợp đồng khung Q4.",
    amount: 145000000,
    status: "PENDING_APPROVAL",
    currentStep: 2,
    totalSteps: 3,
    creatorName: "Nguyễn Văn Hùng",
  },
  {
    id: 2,
    documentCode: "DOC-MF-002",
    title: "Đề xuất mua sắm 5 máy tính hiệu năng cao cho bộ phận AI",
    description: "Trang bị workstation đào tạo mô hình ngôn ngữ nội bộ cho phòng nghiên cứu.",
    amount: 280000000,
    status: "PENDING_APPROVAL",
    currentStep: 1,
    totalSteps: 4,
    creatorName: "Trần Thị Mai",
  },
  {
    id: 3,
    documentCode: "DOC-MF-003",
    title: "Kế hoạch kinh phí tổ chức Hội nghị khách hàng năm 2026",
    description: "Dự toán chi phí hội trường, truyền thông và quà tặng đại biểu tham dự.",
    amount: 95000000,
    status: "APPROVED",
    currentStep: 3,
    totalSteps: 3,
    creatorName: "Lê Hoàng Long",
  },
];

export function ApprovalApp({ isStandalone = false }: { isStandalone?: boolean }) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [filter, setFilter] = useState<string>("ALL");

  const handleApprove = (id: number) => {
    setDocuments((docs) =>
      docs.map((doc) => (doc.id === id ? { ...doc, status: "APPROVED", currentStep: doc.totalSteps } : doc))
    );
  };

  const handleReject = (id: number) => {
    setDocuments((docs) =>
      docs.map((doc) => (doc.id === id ? { ...doc, status: "REJECTED" } : doc))
    );
  };

  const filteredDocs = documents.filter((d) => {
    if (filter === "ALL") return true;
    return d.status === filter;
  });

  const pendingCount = documents.filter((d) => d.status === "PENDING_APPROVAL").length;
  const approvedCount = documents.filter((d) => d.status === "APPROVED").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Banner info */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-blue-200">
              Federated Remote Component
            </span>
          </div>
          <h2 className="text-xl font-bold mt-1">
            Hồ Sơ & Quy Trình Phê Duyệt (Team 1 Remote)
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            Được tải động qua mạng bởi Module Federation 2.0 • Không reload trang • Tương tác trực tiếp
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="info" className="bg-white/20 text-white border-white/30 text-xs">
            Port: 3001
          </Badge>
          <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-xs">
            Remote: approvalApp
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-slate-500 uppercase">Hồ sơ chờ ký duyệt</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{pendingCount}</h3>
          <span className="text-[11px] text-amber-600 font-medium">Cần thẩm định phê duyệt</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-500 uppercase">Đã hoàn tất duyệt</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{approvedCount}</h3>
          <span className="text-[11px] text-emerald-600 font-medium">Sẵn sàng hạch toán</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-slate-500 uppercase">Tổng số hồ sơ</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{documents.length}</h3>
          <span className="text-[11px] text-blue-600 font-medium">Trong kỳ báo cáo</span>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {["ALL", "PENDING_APPROVAL", "APPROVED", "REJECTED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                filter === tab
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab === "ALL" && "Tất cả hồ sơ"}
              {tab === "PENDING_APPROVAL" && "Chờ duyệt"}
              {tab === "APPROVED" && "Đã duyệt"}
              {tab === "REJECTED" && "Từ chối"}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setDocuments(initialDocuments)}
          className="text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Khôi phục ban đầu
        </Button>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {filteredDocs.map((doc) => (
          <Card key={doc.id} className="p-5 hover:shadow-md transition space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {doc.documentCode}
                  </span>
                  <h4 className="font-semibold text-sm text-slate-900">{doc.title}</h4>
                  {doc.status === "APPROVED" && <Badge variant="success">Đã Ký Duyệt</Badge>}
                  {doc.status === "PENDING_APPROVAL" && <Badge variant="warning">Chờ Phê Duyệt</Badge>}
                  {doc.status === "REJECTED" && <Badge variant="danger">Bị Từ Chối</Badge>}
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{doc.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                  <span>Người tạo: <strong className="text-slate-600">{doc.creatorName}</strong></span>
                  <span>•</span>
                  <span>Kinh phí: <strong className="text-slate-700">{doc.amount.toLocaleString("vi-VN")} VNĐ</strong></span>
                  <span>•</span>
                  <span>Tiến độ: Cấp {doc.currentStep}/{doc.totalSteps}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {doc.status === "PENDING_APPROVAL" && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApprove(doc.id)}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Phê Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(doc.id)}
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Từ Chối
                    </Button>
                  </>
                )}
                {doc.status === "APPROVED" && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Đã hoàn tất
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ApprovalApp;
