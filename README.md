# 🚀 Flash Sale E-commerce System

Hệ thống thương mại điện tử chuyên biệt cho các sự kiện **Flash Sale**, tập trung vào việc xử lý lưu lượng truy cập lớn (High Concurrency) và đảm bảo tính chính xác của tồn kho theo thời gian thực.

---

## 🛠 Tech Stack

* **Frontend:** HTML, Vanilla CSS, Javascript.
* **Backend:** Node.js (Express.js).
* **Database:** PostgreSQL (Prisma ORM).
* **Caching:** Redis (Lưu trữ tồn kho tạm thời).
* **Message Queue:** RabbitMQ (Xử lý đơn hàng bất đồng bộ).
* **Real-time:** Socket.io (Cập nhật trạng thái tức thì).

---

## ✨ Tính năng nổi bật

### 1. Giao diện Admin tối giản (Minimalist Admin Dashboard)
* **Thiết kế hiện đại:** Loại bỏ hoàn toàn icon rườm rà, tập trung vào trải nghiệm văn bản và dữ liệu thuần túy, chuyên nghiệp.
* **Quản lý Flash Sale chuyên biệt:** Phân hệ Flash Sale được tách thành tab riêng, cho phép quản trị viên thêm sản phẩm vào chương trình bằng ID, thiết lập thời gian và mức giảm giá một cách nhanh chóng.
* **Bật/Tắt nhanh:** Hỗ trợ toggle trạng thái Flash Sale trực tiếp ngay tại danh sách sản phẩm.
* **Cache Warm-up:** Nạp dữ liệu lên Redis ngay trên giao diện Admin để chuẩn bị cho sự kiện.

### 2. Trải nghiệm người dùng (User Experience)
* **Tìm kiếm thời gian thực:** Thanh tìm kiếm tại trang chủ hoạt động tức thì khi gõ (Real-time search) với kỹ thuật Debounce tối ưu hiệu năng.
* **Đồng hồ đếm ngược:** Cập nhật thời gian kết thúc Flash Sale chính xác đến từng giây.
* **Thanh toán QR:** Tích hợp cổng PayOS giúp thanh toán qua ngân hàng cực nhanh.

---

## 🏗 Kiến trúc hệ thống

1. **Inventory Caching (Redis):** Trừ tồn kho trên RAM trước để đảm bảo phản hồi cực nhanh.
2. **Asynchronous Processing (RabbitMQ):** Đưa đơn hàng vào hàng đợi để xử lý vào Database, tránh nghẽn cổ chai khi lượng truy cập lớn.
3. **Concurrency Control:** Sử dụng Database Transactions để đảm bảo không bao giờ xảy ra tình trạng "bán lố" (overselling).

---

## 🚥 Hướng dẫn cài đặt & Chạy

### Cài đặt môi trường
Bạn cần cài đặt sẵn: Node.js, PostgreSQL, Redis, RabbitMQ.

1.  **Cấu hình Backend:**
    * Vào thư mục `backend/`, chạy `npm install`.
    * Cập nhật file `.env` (đặc biệt là `DATABASE_URL` và mật khẩu Postgres).
2.  **Khởi tạo Database:**
    ```bash
    npx prisma db push
    npm run db:seed
    ```
3.  **Chạy ứng dụng:**
    * Backend: `npm run dev`
    * Frontend: Mở `frontend/index.html` hoặc dùng **Live Server**.

### Truy cập quản trị (Admin)
* Đường dẫn: `frontend/pages/admin.html`
* Tài khoản mặc định: `admin@flashsale.com` / `password123`

---

## 🛠 Lệnh hữu ích
* **Nạp dữ liệu (Warm-up):** Có thể thực hiện qua giao diện Admin hoặc gọi API: `POST /api/flashsale/warmup`
* **Xem dữ liệu trực quan:** Sử dụng pgAdmin (DB), Redis Commander (Cache), hoặc RabbitMQ Management (Queue).