# 🚀 Flash Sale E-commerce System

Hệ thống thương mại điện tử chuyên biệt cho các sự kiện **Flash Sale**, tập trung vào việc xử lý lưu lượng truy cập lớn (High Concurrency) và đảm bảo tính chính xác của tồn kho theo thời gian thực.

---

## 🛠 Tech Stack

* **Frontend:** HTML, Vanilla CSS, Javascript.
* **Backend:** Node.js (Express.js).
* **Database:** PostgreSQL (Relational Database).
* **ORM:** Prisma (Type-safe database client).
* **Caching:** Redis (Lưu trữ tồn kho tạm thời).
* **Message Queue:** RabbitMQ (Xử lý đơn hàng bất đồng bộ).
* **Real-time:** Socket.io (Cập nhật trạng thái sản phẩm tức thì).
* **Proxy Server:** Nginx (Reverse Proxy & Chống Spam vòng ngoài).
* **Auth:** JWT & bcrypt.

---

## 🏗 Kiến trúc hệ thống (System Architecture)

Hệ thống áp dụng mô hình xử lý phân lớp để giải quyết bài toán High Concurrency:

1. **Proxy & Filtering (Nginx):** Tiếp nhận traffic, giới hạn tần suất truy cập (Rate Limit).
2. **Inventory Caching (Redis):** Trừ tồn kho trên RAM trước để đảm bảo phản hồi < 10ms.
3. **Asynchronous Processing (RabbitMQ):** Đưa đơn hàng vào hàng đợi để xử lý dần vào Database, tránh nghẽn cổ chai.
4. **Concurrency Control:** Sử dụng **Database Transactions** của Prisma để đảm bảo tính nhất quán.

---

## 🚥 Hướng dẫn cài đặt

### Cách 1: Sử dụng Docker (Khuyên dùng)
Hệ thống đã được đóng gói hoàn toàn trong Docker.

1.  **Chuẩn bị:** Sao chép file `.env.example` thành `.env` trong thư mục `backend/`.
2.  **Khởi chạy:** `docker-compose up -d --build`
3.  **Khởi tạo Database:** 
    ```bash
    docker exec -it nt208-backend npx prisma db push
    docker exec -it nt208-backend npm run db:seed
    ```
4.  **Truy cập:** 
    * Frontend: Mở `frontend/index.html` (hoặc qua Nginx `http://localhost`).
    * Backend API: `http://localhost:3000`.

### Cách 2: Cài đặt thủ công (Không dùng Docker)
Bạn cần cài đặt sẵn: Node.js, PostgreSQL, Redis, RabbitMQ.

1.  **Thiết lập Dịch vụ:** Đảm bảo các dịch vụ PostgreSQL, Redis, RabbitMQ đang chạy trên máy.
2.  **Cấu hình Backend:**
    * Vào thư mục `backend/`, chạy `npm install`.
    * Tạo file `.env` và cập nhật `DATABASE_URL`, `REDIS_URL`, `RABBITMQ_URL` khớp với máy của bạn.
3.  **Khởi tạo Database:**
    ```bash
    npx prisma generate
    npx prisma db push
    npm run db:seed
    ```
4.  **Chạy ứng dụng:**
    * Backend: `npm run dev` (tại thư mục `backend`).
    * Frontend: Mở file `frontend/index.html` bằng trình duyệt (hoặc dùng Live Server).

---

## 🛠 Lệnh hữu ích
* **Seed dữ liệu:** `npm run db:seed`
* **Xác nhận Warm-up (Admin):** `curl -X POST http://localhost:3000/api/flashsale/warmup`
* **Xem log Docker:** `docker logs -f nt208-backend`