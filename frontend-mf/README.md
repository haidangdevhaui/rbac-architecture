# ENTERPRISE FRONTEND - MODULE FEDERATION 2.0 + RSPACK ARCHITECTURE

Dự án mẫu hoàn chỉnh chứng minh kiến trúc **Micro-Frontends hiện đại** sử dụng **Module Federation 2.0 (`@module-federation/enhanced`)** kết hợp với **Rspack** (Rust-based bundler) trong môi trường **Monorepo (Turborepo + pnpm)**, tích hợp **Xác thực Đơn điểm (SSO) với Keycloak OIDC**.

---

## 1. Cấu Trúc Tổng Thể

```
frontend-mf/
├── packages/
│   └── shared-ui/              # Thư viện Design System chung (@enterprise/shared-ui)
│       └── (Button, Card, Badge, ShellLayout hỗ trợ Keycloak User & Logout)
│
└── apps/
    ├── host-portal/            # [PORT 3000] Host Shell App (Nhạc trưởng nạp động remotes & SSO Master)
    │   ├── rspack.config.ts    # Khai báo remotes & silent-check-sso.html
    │   ├── src/auth/           # Module xác thực Keycloak (keycloak.ts, AuthContext.tsx)
    │   └── src/App.tsx         # SPA navigation 0ms, Error Boundary, Backend V2 Live Test
    │
    ├── approval-remote/        # [PORT 3001] Remote App của Team 1 (Approval & Workflow)
    │   ├── rspack.config.ts    # Xuất bản: ./ApprovalApp, ./ApprovalWidget
    │   └── src/ApprovalApp.tsx # Có thể chạy độc lập (Standalone) hoặc nhúng vào Host
    │
    └── integration-remote/     # [PORT 3002] Remote App của Team 2 (Integration Bridge)
        ├── rspack.config.ts    # Xuất bản: ./IntegrationApp, ./LegacySyncWidget
        └── src/                # Cung cấp widget nhúng chéo cho các team khác
```

---

## 2. Các Đặc Điểm Vượt Trội

1. **True Single Page Application (SPA):**
   - Chuyển giữa các remote apps qua mạng với **độ trễ 0ms, không reload trình duyệt, giữ nguyên trạng thái**.
2. **Xác Thực Tập Trung OIDC Với Keycloak:**
   - Host Portal đóng vai trò Auth Master, kết nối Keycloak (`http://localhost:8180`, Realm `enterprise`, Client `admin-portal`) qua PKCE S256.
   - Khi đăng nhập thành công, tự động gửi Bearer Token sang Backend V2 Gateway (`http://localhost:8080/api/v1/auth/me`) để kích hoạt JIT User Provisioning và lấy về thông tin quyền RBAC nội bộ.
3. **Độc Lập Tuyệt Đối Khi Phát Triển & Deploy:**
   - Khi Team 1 hoặc Team 2 sửa code và deploy remote, **Host App không cần build lại, không cần restart server**.
4. **Tốc Độ Build Vượt Bậc Với Rspack (Rust):**
   - Biên dịch toàn bộ 4 packages trong **dưới 3 giây** (nhanh gấp 10 lần Webpack).
5. **Khả Năng Chịu Lỗi Cục Bộ (Fault Tolerance):**
   - Tích hợp sẵn `RemoteErrorBoundary`: Nếu server của Team 2 bị sự cố mạng, Host Portal vẫn hoạt động bình thường cho các màn hình khác của Team 1.

---

## 3. Hướng Dẫn Chạy Cục Bộ (Local Development)

### Bước 1: Khởi động Backend V2 (Keycloak, Postgres, Redis, Microservices)
```bash
cd backend-v2
docker compose up -d
```

### Bước 2: Chạy Frontend Micro-Frontends
```bash
cd frontend-mf
pnpm install
pnpm dev
```
Trình duyệt sẽ mở:
- **Host Portal:** [http://localhost:3000](http://localhost:3000) (Trang chính nạp động cả 2 team + Keycloak SSO)
- **Team 1 Standalone:** [http://localhost:3001](http://localhost:3001) (Team 1 dev độc lập)
- **Team 2 Standalone:** [http://localhost:3002](http://localhost:3002) (Team 2 dev độc lập)

---

## 4. Hướng Dẫn Đăng Nhập Với Keycloak Tại Host Portal

1. Truy cập [http://localhost:3000](http://localhost:3000).
2. Nhấn nút **"Đăng nhập Keycloak"** trên thanh header hoặc banner trang chủ.
3. Trình duyệt tự động chuyển hướng đến màn hình đăng nhập Keycloak (`http://localhost:8180`):
   - **Tài khoản Super Admin:** `admin` / `admin123`
   - **Tài khoản Warehouse Manager:** `warehouse_mgr` / `pass123`
4. Sau khi đăng nhập, Keycloak chuyển hướng về lại `http://localhost:3000`:
   - Thanh header hiển thị tên người dùng (e.g. `Admin Super`) và vai trò (`ROLE_ADMIN`).
   - Host Portal tự động đồng bộ tài khoản với Backend V2 qua API Gateway, hiển thị User Code nội bộ (`USR-xxxxx`), Roles và Permissions chi tiết.
   - Có thể vào tab **"Backend V2: Quản Lý Kho & Đơn Hàng"** để test trực tiếp các API tồn kho (`inventory-service`) và duyệt đơn hàng (`order-service`) với token đã xác thực!
5. Nhấn biểu tượng **Đăng xuất** trên thanh header để kết thúc phiên làm việc với Keycloak.
