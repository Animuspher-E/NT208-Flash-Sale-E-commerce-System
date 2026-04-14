# 🚀 Flash Sale E-commerce System

Hệ thống thương mại điện tử chuyên biệt cho các sự kiện **Flash Sale**, tập trung vào việc xử lý lưu lượng truy cập lớn (High Concurrency) và đảm bảo tính chính xác của tồn kho theo thời gian thực.

---

## 🛠 Tech Stack

* **Frontend:** React.js.
* **Backend:** Node.js (Express.js).
* **Database:** MySQL (Relational Database).
* **ORM:** Prisma (Type-safe database client).
* **Caching & Queue:** Redis (Lưu trữ tồn kho tạm thời & hàng đợi xử lý).
* **Real-time:** Socket.io (Cập nhật trạng thái sản phẩm tức thì).
* **Proxy Server:** Nginx (Reverse Proxy, Load Balancer & Chống Spam vòng ngoài).
* **Validation:** Zod (Kiểm soát chặt chẽ dữ liệu đầu vào).
* **Auth:** JWT & bcrypt (Xác thực và bảo mật người dùng).

---

## 🏗 Kiến trúc hệ thống (System Architecture)

Để giải quyết bài toán hàng nghìn người cùng nhấn "Mua" một món hàng trong cùng 1 giây, hệ thống áp dụng mô hình xử lý phân lớp:

1. **Proxy & Filtering (Nginx):** Nginx đóng vai trò là "tấm khiên" đầu tiên tiếp nhận luồng traffic. Nó xử lý phân tải, chặn các IP độc hại và giới hạn tần suất truy cập (Rate Limit) cấp độ mạng trước khi request lọt vào tầng ứng dụng.
2. **Inventory Caching (Redis):** Số lượng hàng tồn kho của các sản phẩm Flash Sale được đồng bộ lên Redis. Khi người dùng mua, hệ thống trừ số lượng trên RAM (Redis) trước để đảm bảo phản hồi cực nhanh (< 10ms) và chống Over-selling tuyệt đối.
3. **Concurrency Control:** Sử dụng cơ chế **Database Transactions** của Prisma để đảm bảo tính nguyên tử: "Trừ tồn kho thật trong MySQL" và "Tạo đơn hàng" phải cùng thành công hoặc cùng thất bại.
4. **Real-time Synchronization:** Sử dụng **Socket.io** qua cấu hình WebSocket của Nginx để phát tín hiệu cập nhật số lượng hàng còn lại tới tất cả các Client đang truy cập mà không cần load lại trang.

---

## ✨ Tính năng chính

- [x] **Flash Sale Countdown:** Đếm ngược thời gian bắt đầu sự kiện.
- [x] **Smart Inventory:** Chống lỗi **Over-selling** (bán quá số lượng tồn kho) bằng Redis Lock.
- [x] **Real-time Stock:** Cập nhật số lượng sản phẩm còn lại theo thời gian thực.
- [x] **Order Management:** Quy trình tạo đơn hàng an toàn với Prisma Transaction.
- [x] **Security:** Chống DDoS cơ bản với Nginx, chặn spam request, mã hóa mật khẩu và xác thực qua Token.

---

## 🚥 Cài đặt và Chạy thử (Với Docker)

Hệ thống đã được đóng gói hoàn toàn trong Docker. Bạn có thể triển khai nhanh chóng theo các bước sau:

### 1. Chuẩn bị
*   Máy tính đã cài đặt **Docker** và **Docker Desktop**.
*   Sao chép file `.env.example` thành `.env` trong thư mục `backend/` (Thông số mặc định đã khớp với Docker).

### 2. Triển khai với Docker Compose
Mở terminal tại thư mục gốc của dự án và chạy lệnh:
```bash
docker-compose up -d --build
```
Lệnh này sẽ tự động tải các Image và khởi chạy 6 dịch vụ: **Backend, MySQL, Redis, Nginx, Adminer, Redis-Commander**.

### 3. Khởi tạo Cơ sở dữ liệu
Sau khi các container đã ở trạng thái "Running", hãy chạy lệnh sau để khởi tạo các bảng dữ liệu:
```bash
docker exec -it nt208-backend npx prisma db push
```

### 4. Truy cập hệ thống
*   **API chính (HTTPS):** [https://localhost](https://localhost)
*   **Trang quản lý MySQL (Adminer):** [http://localhost:8080](http://localhost:8080)
    *   *System: MySQL | Server: mysql | User: root | Pass: password*
*   **Trang quản lý Redis:** [http://localhost:8081](http://localhost:8081)

---

## 🛠 Lệnh hữu ích thường dùng

*   **Xem logs của Backend:** `docker logs -f nt208-backend`
*   **Dừng hệ thống:** `docker-compose down`
*   **Khởi động lại:** `docker-compose restart`
*   **Cập nhật code mới vào Docker:** `docker-compose up -d --build backend`