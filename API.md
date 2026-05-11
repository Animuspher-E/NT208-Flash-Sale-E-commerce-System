# 📘 Tài liệu API - Flash Sale System

Tài liệu này cung cấp danh sách đầy đủ các API Endpoints hiện có trong hệ thống dành cho cả người dùng và quản trị viên.

---

## 🔐 1. Xác thực (Authentication)
*Đường dẫn gốc: `/api/auth`*

| Endpoint | Method | Chức năng | Cần Token |
|---|:---:|---|:---:|
| `/register` | POST | Đăng ký tài khoản mới | Không |
| `/login` | POST | Đăng nhập hệ thống | Không |
| `/me` | GET | Lấy thông tin tài khoản hiện tại | Có |
| `/refresh-token` | POST | Cấp lại token mới khi token cũ hết hạn | Có |
| `/forgot-password` | POST | Quên mật khẩu - Gửi mail xác nhận | Không |
| `/reset-password/:token` | POST | Đặt lại mật khẩu mới qua link email | Không |
| `/change-password` | POST | Thay đổi mật khẩu (đang đăng nhập) | Có |
| `/logout` | POST | Đăng xuất khỏi hệ thống | Có |

---

## 👤 2. Người dùng (User Profile & History)
*Đường dẫn gốc: `/api/users`*

| Endpoint | Method | Chức năng | Cần Token |
|---|:---:|---|:---:|
| `/profile` | GET | Xem hồ sơ cá nhân (SĐT, Địa chỉ...) | Có |
| `/profile` | PUT | Cập nhật thông tin cá nhân | Có |
| `/orders` | GET | Xem danh sách lịch sử đơn hàng (phân trang/lọc) | Có |
| `/orders/:orderId` | GET | Xem chi tiết một đơn hàng cụ thể | Có |
| `/statistics` | GET | Xem thống kê cá nhân (Tổng chi tiêu, số đơn...) | Có |

---

## 🛒 3. Flash Sale & Mua hàng
*Đường dẫn gốc: `/api/flashsale`*

| Endpoint | Method | Chức năng | Cần Token |
|---|:---:|---|:---:|
| `/products` | GET | Lấy danh sách sản phẩm đang Flash Sale (từ Cache) | Không |
| `/stock/:productId` | GET | Kiểm tra tồn kho thực tế của sản phẩm trên RAM | Không |
| `/buy` | POST | Đặt hàng Flash Sale (Xử lý qua Redis & RabbitMQ) | Có |
| `/warmup` | POST | Kích hoạt nạp dữ liệu lên Redis (Cache Warm-up) | Có (Admin) |

---

## 🛠️ 4. Quản trị (Admin Dashboard)
*Đường dẫn gốc: `/api/admin` (Yêu cầu Role: ADMIN)*

| Endpoint | Method | Chức năng |
|---|:---:|---|
| `/stats` | GET | Thống kê toàn hệ thống (Doanh thu, biểu đồ...) |
| `/products` | GET | Danh sách toàn bộ sản phẩm (Search/Filter) |
| `/products` | POST | Thêm sản phẩm mới vào Database |
| `/products/:id` | PUT | Chỉnh sửa thông tin sản phẩm |
| `/products/:id` | DELETE | Xóa sản phẩm khỏi hệ thống |
| `/products/:id/flashsale` | PATCH | Cấu hình/Bật/Tắt trạng thái Flash Sale |
| `/categories` | GET | Lấy danh sách các danh mục hàng hóa |
| `/orders` | GET | Quản lý toàn bộ đơn hàng của khách |
| `/customers` | GET | Xem danh sách khách hàng và mức độ tương tác |

---

## 💳 5. Thanh toán (Payment Integration)
*Đường dẫn gốc: `/api/payment`*

| Endpoint | Method | Chức năng |
|---|:---:|---|
| `/create_url` | POST | Tạo link/QR Code thanh toán qua PayOS |
| `/payos_webhook` | POST | Nhận thông báo tự động khi khách trả tiền xong |

---

## 📡 6. Socket.io Events
*Cập nhật trạng thái thời gian thực*

- `product:update`: Nhận thông tin khi số lượng tồn kho thay đổi.
- `flashsale:start`: Thông báo khi sự kiện Flash Sale bắt đầu.
- `order:status`: Cập nhật trạng thái đơn hàng (đang xử lý, thành công).
