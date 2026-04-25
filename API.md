# Tổng hợp API Hệ thống Flash Sale

Tài liệu này cung cấp danh sách toàn bộ các API (Endpoints) hiện có thể gọi được trong hệ thống Backend.

---

## Nhóm 1: Quản lý Bảo mật và Truy cập (Authentication)
*Đường dẫn gốc: `/api/auth`*

| Chức năng           | Method | Endpoint                     | Chức năng chi tiết                                          | Cần Token |
|---------------------|:------:|------------------------------|-------------------------------------------------------------|:---------:|
| Đăng ký             | POST   | /api/auth/register           | Tiếp nhận email, tên, mật khẩu. Kiểm tra trùng lặp và lưu.  | Không     |
| Đăng nhập           | POST   | /api/auth/login              | So khớp mật khẩu, trả về JWT Token để truy cập API khác.    | Không     |
| Lấy Profile         | GET    | /api/auth/me                 | Lấy nhanh thông tin tài khoản đang đăng nhập.               | Có        |
| Cấp lại Token       | POST   | /api/auth/refresh-token      | Cấp lại JWT Token mới khi token cũ vừa hết hạn.             | Có        |
| Đổi mật khẩu        | POST   | /api/auth/change-password    | Thay đổi mật khẩu tài khoản đang đăng nhập.                 | Có        |
| Đăng xuất           | POST   | /api/auth/logout             | Xóa token, đăng xuất người dùng khỏi hệ thống.              | Có        |
| Khôi phục mật khẩu  | POST   | /api/auth/forgot-password    | Yêu cầu cấp lại MK, hệ thống gửi email xác nhận.            | Không     |
| Cài lại mật khẩu    | POST   | /api/auth/reset-password/:token| Đặt lại mật khẩu mới dựa trên link/token trong email.       | Không     |

---

## Nhóm 2: Quản lý Người dùng (User Management)
*Đường dẫn gốc: `/api/users`*

| Chức năng           | Method | Endpoint                | Chức năng chi tiết                                          | Cần Token |
|---------------------|:------:|-------------------------|-------------------------------------------------------------|:---------:|
| Hồ sơ cá nhân       | GET    | /api/users/profile      | Xem thông tin chi tiết: tên, SĐT, địa chỉ nhận hàng.        | Có        |
| Cập nhật profile    | PUT    | /api/users/profile      | Cho phép thay đổi thông tin liên lạc và địa chỉ nhận hàng.  | Có        |
| Danh sách đơn hàng  | GET    | /api/users/orders       | Xem lịch sử mua sắm (hỗ trợ phân trang, lọc theo status).   | Có        |
| Chi tiết đơn hàng   | GET    | /api/users/orders/:id   | Lấy dữ liệu chi tiết của 1 đơn hàng cụ thể.                 | Có        |
| Thống kê chi tiêu   | GET    | /api/users/statistics   | Trích xuất số đơn thành công, tổng tiền đã tiêu, v.v...     | Có        |

---

## Nhóm 3: Flash Sale - Săn Deal Siêu Tốc
*Đường dẫn gốc: `/api/flashsale`*

| Chức năng           | Method | Endpoint                  | Chức năng chi tiết                                          | Cần Token |
|---------------------|:------:|---------------------------|-------------------------------------------------------------|:---------:|
| DS Flash Sale       | GET    | /api/flashsale/products   | Hiển thị các sản phẩm đang có ưu đãi kèm đồng hồ đếm ngược. | Không     |
| Check tồn kho       | GET    | /api/flashsale/stock/:id  | Lấy số lượng thực thụ còn lại trên RAM của Server.          | Không     |
| Chốt đơn            | POST   | /api/flashsale/buy        | Trừ tồn kho bằng Redis và đẩy giao dịch vào RabbitMQ.       | Có        |
| Nạp dữ liệu         | POST   | /api/flashsale/warmup     | (Dành cho Admin) Bơm dữ liệu từ MySQL lên Redis để chuẩn bị.| Có (Admin)|

---

## Nhóm 4: Cổng Thanh Toán PayOS (Xử lý QR Code)
*Đường dẫn gốc: `/api/payment`*

| Chức năng           | Method | Endpoint                  | Chức năng chi tiết                                          | Cần Token |
|---------------------|:------:|---------------------------|-------------------------------------------------------------|:---------:|
| Tạo Link Giao Dịch  | POST   | /api/payment/create_url   | Tạo link thanh toán/QR Code chuyển sang cổng PayOS.         | Có        |
| Bắt Webhook         | POST   | /api/payment/payos_webhook| Đồng bộ trạng thái đơn hàng khi người dùng chuyển khoản xong.| Không     |

---

## Nhóm 5: Hệ thống chung & Monitoring

| Công cụ / API       | Dạng   | Endpoint / Giao diện   | Mục đích sử dụng                                            |
|---------------------|--------|------------------------|-------------------------------------------------------------|
| Health Check        | GET    | /health                | Trả về `{ status: 'OK' }`. Bot giám sát gọi tự động.        |
| Adminer             | UI     | http://localhost:8080  | Quản trị cơ sở dữ liệu MySQL bằng giao diện trực quan.      |
| Redis Commander     | UI     | http://localhost:8081  | Quản sát sự thay đổi nhanh như chớp của tồn kho trên Redis. |
| RabbitMQ Management | UI     | http://localhost:15672 | Theo dõi số lượng đơn đang chờ xử lý trong Queue (Hàng đợi).|
| Nginx Gateway       | HTTPS  | https://localhost      | Cổng Reverse Proxy, đảm nhiệm SSL và chặn Spam ở biên hệ thống.|
