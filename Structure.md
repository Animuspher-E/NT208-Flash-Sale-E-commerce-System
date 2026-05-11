# 🏗 Cấu trúc Chi tiết Hệ thống Flash Sale E-commerce

Tài liệu này mô tả chi tiết toàn bộ cây thư mục và chức năng của từng file trong hệ thống.

---

## 📁 Sơ đồ Cây Thư mục Toàn dự án

```text
NT208-Flash-Sale-E-commerce-System/
├── backend/                        # MÃ NGUỒN SERVER (NODE.JS/EXPRESS)
│   ├── prisma/                     # Quản trị Database (ORM)
│   │   ├── schema.prisma           # Định nghĩa cấu trúc các bảng DB
│   │   ├── migrations/             # Lịch sử thay đổi cấu trúc DB
│   │   └── seeders/                
│   │       └── data.seed.js        # Script tạo dữ liệu mẫu (SP, User)
│   ├── src/
│   │   ├── app.js                  # Cấu hình Express, Middleware chung
│   │   ├── server.js               # File khởi chạy server & kết nối Socket.io
│   │   ├── config/                 # Kết nối hạ tầng
│   │   │   ├── database.js         # Kết nối PostgreSQL (Prisma)
│   │   │   ├── redis.js            # Kết nối Redis (Cache tồn kho)
│   │   │   ├── rabbitmq.js         # Kết nối Message Queue
│   │   │   ├── socket.js           # Cấu hình Real-time updates
│   │   │   ├── payos.js            # Cấu hình cổng thanh toán
│   │   │   └── response.js         # Chuẩn hóa định dạng trả về API
│   │   ├── controllers/            # Tiếp nhận & Điều phối Request
│   │   │   ├── admin.controller.js # Logic quản trị sản phẩm & thống kê
│   │   │   ├── auth.controller.js  # Logic đăng ký/đăng nhập/mật khẩu
│   │   │   ├── flashsale.controller.js # Logic mua hàng & warmup
│   │   │   └── user.controller.js  # Logic profile & lịch sử đơn hàng
│   │   ├── services/               # Xử lý nghiệp vụ lõi (Nghiêm ngặt)
│   │   │   ├── flashsale.service.js# Trừ tồn kho Atomic trên Redis
│   │   │   ├── order.service.js    # Tạo đơn hàng & lưu DB
│   │   │   ├── order.worker.js     # Worker xử lý đơn hàng từ RabbitMQ
│   │   │   ├── cache.service.js    # Quản lý Warm-up dữ liệu
│   │   │   └── mailer.service.js   # Gửi email thông báo/reset pass
│   │   ├── routes/                 # Định nghĩa các điểm cuối API
│   │   │   ├── admin.routes.js     # /api/admin/*
│   │   │   ├── auth.routes.js      # /api/auth/*
│   │   │   └── flashsale.routes.js # /api/flashsale/*
│   │   ├── middlewares/            # Tầng kiểm duyệt
│   │   │   ├── auth.js             # Check Token & Phân quyền
│   │   │   ├── rateLimit.js        # Chống Spam & Brute-force
│   │   │   └── errorHandler.js     # Hứng lỗi & Rollback dữ liệu
│   │   └── validations/            # Kiểm tra tính hợp lệ dữ liệu
│   │       ├── auth.schema.js      
│   │       └── order.schema.js
│   ├── .env                        # Biến môi trường (DB_URL, Keys...)
│   └── package.json                # Quản lý thư viện Backend
│
├── frontend/                       # GIAO DIỆN NGƯỜI DÙNG (VANILLA JS)
│   ├── index.html                  # Trang điều hướng gốc
│   ├── pages/                      # Các trang giao diện chính
│   │   ├── home.html               # Trang chủ săn sale
│   │   ├── admin.html              # Dashboard quản trị (tối giản)
│   │   ├── auth.html               # Trang đăng nhập/đăng ký
│   │   ├── cart.html               # Giỏ hàng
│   │   ├── orders.html             # Lịch sử mua hàng
│   │   └── profile.html            # Hồ sơ cá nhân
│   ├── assets/
│   │   ├── css/                    # Giao diện & Style
│   │   │   ├── home.css            # Style trang chủ
│   │   │   ├── profile.css         # Style trang cá nhân
│   │   │   └── ecommerce.css       # Style chung toàn hệ thống
│   │   ├── js/                     # Logic xử lý Frontend
│   │   │   ├── admin/
│   │   │   │   └── dashboard.js    # Logic Tab Flash Sale & Quản lý SP
│   │   │   ├── home/
│   │   │   │   ├── main.js         # Khởi tạo trang chủ
│   │   │   │   ├── render.js       # Render SP từ API ra HTML
│   │   │   │   ├── search.js       # Tìm kiếm thời gian thực (Debounce)
│   │   │   │   └── cart.js         # Logic giỏ hàng & mua hàng
│   │   │   ├── profile/
│   │   │   │   └── user.js         # Xử lý thông tin cá nhân
│   │   │   └── ecommerce-common.js # Các hàm dùng chung (API, Toast)
│   │   └── img/                    # Hình ảnh & Assets
│   │       └── category/           # Icon các danh mục sản phẩm
├── docker-compose.yml              # Triển khai nhanh qua Docker
├── README.md                       # Giới thiệu dự án
├── API.md                          # Tài liệu các API Endpoints
└── Structure.md                    # Tài liệu này

```

---

## 🔍 Chức năng chính các thành phần quan trọng

1.  **`backend/src/services/order.worker.js`**: Thành phần quan trọng nhất để xử lý hàng nghìn đơn hàng cùng lúc mà không làm treo Database. Nó lắng nghe RabbitMQ và lưu đơn hàng một cách tuần tự.
2.  **`backend/src/services/flashsale.service.js`**: Đảm bảo việc trừ tồn kho diễn ra trong chưa đầy 1ms bằng cách thao tác trực tiếp trên Redis RAM.
3.  **`frontend/assets/js/admin/dashboard.js`**: Trung tâm điều khiển của Admin, cho phép quản lý sản phẩm và Flash Sale trong một giao diện tối giản, tập trung vào hiệu suất.