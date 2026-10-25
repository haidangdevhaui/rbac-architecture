import React from "react";
import {
  FileCheck,
  RefreshCw,
  Sliders,
  LayoutDashboard,
  ShieldCheck,
  User,
  LogIn,
  LogOut,
} from "lucide-react";

export interface ShellUser {
  name?: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
}

export interface ShellLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  currentTeam?: string;
  onNavigate?: (path: string) => void;
  user?: ShellUser | null;
  isAuthenticated?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function ShellLayout({
  children,
  activePath = "/",
  currentTeam = "Module Federation 2.0 Host Portal",
  onNavigate,
  user,
  isAuthenticated = false,
  onLogin,
  onLogout,
}: ShellLayoutProps) {
  const menuItems = [
    { label: "Tổng Quan Hệ Thống", path: "/", icon: LayoutDashboard },
    { label: "Team 1: Duyệt Đơn (Approval)", path: "/approvals", icon: FileCheck },
    { label: "Team 2: Tích Hợp (Integration)", path: "/integrations", icon: RefreshCw },
    { label: "Team 3: Cấu Hình (System)", path: "/system", icon: Sliders },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">ENTERPRISE MF</h1>
            <p className="text-[10px] text-blue-400 font-mono">Module Federation 2.0</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => onNavigate?.(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Runtime info footer */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-400">Kiến trúc: Rspack + MF 2.0</p>
          <p className="text-[10px] text-emerald-400">● Dynamic Runtime Linking</p>
          <p className="text-[10px] text-slate-500">Zero Page Reload (SPA)</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {currentTeam}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">{user?.name || "Người Dùng Keycloak"}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">{user?.role || "Đã Xác Thực"}</p>
                </div>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Đăng xuất khỏi Keycloak"
                    className="p-1.5 ml-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : onLogin ? (
              <button
                type="button"
                onClick={onLogin}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập Keycloak</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">Ban Giám Đốc</p>
                  <p className="text-[10px] text-slate-400">Administrator</p>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
