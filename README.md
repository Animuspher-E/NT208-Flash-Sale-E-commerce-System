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

## 🚥 Cài đặt và Chạy thử

### 1. Yêu cầu hệ thống

* Node.js v18.x trở lên.
* MySQL v8.0.
* Redis Server.
* Nginx (Cho môi trường staging/production).

### 2. Các bước cài đặt

```bash
# Clone dự án
git clone [https://github.com/Animuspher-E/NT208-Flash-Sale-E-commerce-System](https://github.com/Animuspher-E/NT208-Flash-Sale-E-commerce-System)

# 1. Cài đặt Backend
cd backend
npm install

# Khởi tạo Database Prisma (Đảm bảo đã cấu hình file .env)
npx prisma generate
npx prisma db push

# 2. Cài đặt Frontend
cd ../frontend
npm install

# 3. Cấu hình Nginx (Tùy chọn)
# Copy file cấu hình mẫu từ thư mục dự án vào hệ thống Nginx
sudo cp ../nginx/nginx.conf /etc/nginx/nginx.conf
sudo systemctl restart nginx