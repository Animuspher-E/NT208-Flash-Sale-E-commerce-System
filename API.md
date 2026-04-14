# Tổng hợp API Hệ thống Flash Sale

## Nhóm 1: Quản lý Bảo mật và Truy cập (Access Control)

| Chức năng           | Method | Endpoint               | Chức năng chi tiết                                          |
|---------------------|:------:|------------------------|-------------------------------------------------------------|
| Đăng ký             | POST   | /api/auth/register     | Tiếp nhận email, tên, mật khẩu. Kiểm tra trùng lặp và lưu.  |
| Đăng nhập           | POST   | /api/auth/login        | So khớp mật khẩu, trả về JWT Token để truy cập API khác.    |
| Sức khỏe hệ thống   | GET    | /health                | Kiểm tra trạng thái online của Server, Database và Redis.   |

---

## Nhóm 2: Quản lý Người dùng (User Management)

| Chức năng           | Method | Endpoint                | Chức năng chi tiết                                          |
|---------------------|:------:|-------------------------|-------------------------------------------------------------|
| Hồ sơ cá nhân       | GET    | /api/users/profile      | Lấy danh tính, email, ngày tham gia từ Token cung cấp.      |
| Cập nhật profile    | PUT    | /api/users/profile      | Cho phép thay đổi thông tin liên lạc và địa chỉ nhận hàng.  |
| Danh sách đơn hàng  | GET    | /api/users/orders       | Hiển thị tất cả các đơn hàng đã mua của người dùng.         |
| Thống kê chi tiêu   | GET    | /api/users/statistics   | Tổng hợp số tiền, đơn hàng thành công và thất bại.          |

---

## Nhóm 3: Flash Sale (High Concurrency)

| Chức năng           | Method | Endpoint                  | Chức năng chi tiết                                          |
|---------------------|:------:|---------------------------|-------------------------------------------------------------|
| DS Flash Sale       | GET    | /api/flashsale/products   | Hiển thị các sản phẩm đang có ưu đãi kèm đồng hồ đếm ngược. |
| Check tồn kho       | GET    | /api/flashsale/stock/:id  | Lấy số lượng hàng còn lại trực tiếp từ Redis.               |
| Đặt hàng thần tốc   | POST   | /api/flashsale/buy        | Trừ tồn kho bằng Redis Lua Script và ghi đơn qua DB Trans.  |

---

## Nhóm 4: Quản trị và Giám sát (Admin and Monitoring)

| Công cụ             | Giao diện              | Mục đích sử dụng                                            |
|---------------------|------------------------|-------------------------------------------------------------|
| Adminer             | http://localhost:8080  | Xem cấu trúc bảng, dữ liệu User/Product trực quan.          |
| Redis Commander     | http://localhost:8081  | Quan sát sự thay đổi của các Key tồn kho trên RAM.          |
| Nginx Gateway       | https://localhost      | Cổng vào chịu trách nhiệm xác thực SSL và Rate Limit.       |
