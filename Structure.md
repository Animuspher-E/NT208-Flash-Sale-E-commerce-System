## Backend (Node.js/Express)
```
project_root/
├── nginx/                  # TẦNG PROXY SERVER (Tấm khiên bảo vệ vòng ngoài)
│   ├── nginx.conf          # Cấu hình Nginx: Làm Reverse Proxy điều hướng traffic vào Node.js. 
│   │                       # Chứa logic Rate Limit cấp độ mạng và chặn IP xấu (DDoS basic).
│   └── certs/              # Chứa chứng chỉ SSL/TLS để chạy HTTPS.
│
├── backend/
│   ├── prisma/             # QUẢN TRỊ CƠ SỞ DỮ LIỆU (ORM Prisma)
│   │   ├── schema.prisma   # Khai báo cấu trúc các bảng MySQL: User, Product, Inventory, Order.
│   │   │                   # Định nghĩa các mối quan hệ (Relations) giữa các bảng.
│   │   ├── migrations/     # Thư mục tự động sinh ra khi thay đổi database (Lưu lịch sử).
│   │   └── seeders/        
│   │       └── data.seed.js# Script chạy 1 lần để tạo 10.000 user ảo và 100 sản phẩm test.
│   │
│   ├── src/
│   │   ├── config/         # TẦNG CẤU HÌNH HẠ TẦNG (Khởi tạo kết nối)
│   │   │   ├── database.js # Khởi tạo PrismaClient. Cấu hình Connection Pool để không sập MySQL.
│   │   │   ├── redis.js    # Khởi tạo RedisClient (Dùng thư viện ioredis). Xử lý reconnect.
│   │   │   └── socket.js   # Khởi tạo Server Socket.io, cấu hình CORS cho phép Frontend kết nối.
│   │   │
│   │   ├── routes/         # TẦNG ĐỊNH TUYẾN (Nơi khai báo các API Endpoints)
│   │   │   └── v1/
│   │   │       ├── auth.routes.js      # VD: router.post('/login', authController.login)
│   │   │       ├── flashsale.routes.js # VD: router.post('/buy', flashsaleController.buy)
│   │   │       └── user.routes.js      # VD: router.get('/orders', userController.getOrders)
│   │   │
│   │   ├── controllers/    # TẦNG GIAO TIẾP (Chỉ nhận Req, gọi Service, và format Res trả về)
│   │   │   ├── auth.controller.js      # Trích xuất email/pass từ Req, gọi auth.service.
│   │   │   ├── flashsale.controller.js # Trích xuất productId, userId từ Req để gọi mua hàng.
│   │   │   └── user.controller.js      # Trích xuất userId để query lịch sử đơn hàng.
│   │   │
│   │   ├── services/       # TẦNG NGHIỆP VỤ LÕI (Nơi chứa não bộ logic, xử lý dữ liệu)
│   │   │   ├── auth.service.js       # Logic: băm mật khẩu (bcrypt), kiểm tra User, tạo mã JWT.
│   │   │   ├── cache.service.js      # Logic: Query MySQL lấy danh sách sản phẩm Flash Sale 
│   │   │   │                         # rồi nạp lên Redis (Cache Warm-up) trước giờ G.
│   │   │   ├── flashsale.service.js  # LÕI TỐC ĐỘ: Chứa lệnh Redis Atomic (VD: DECR) để trừ 
│   │   │   │                         # tồn kho trực tiếp trên RAM cực nhanh. Ngăn Over-selling.
│   │   │   └── order.service.js      # LÕI DỮ LIỆU: Chứa logic prisma.$transaction. Thực thi
│   │   │                             # Insert Order + Update Product Stock cùng lúc vào MySQL.
│   │   │
│   │   ├── middlewares/    # TẦNG KIỂM DUYỆT (Lá chắn chặn request không hợp lệ)
│   │   │   ├── auth.js               # Đọc header Authorization, verify JWT token. Lấy ra userId.
│   │   │   ├── rateLimit.js          # Dùng Redis check: Nếu User này vừa click cách đây < 1s 
│   │   │   │                         # thì throw error 429 Too Many Requests (Chống spam/bot).
│   │   │   ├── validate.js           # Middleware nhận schema Zod, nếu body sai -> chặn luôn.
│   │   │   └── errorHandler.js       # Hứng MỌI lỗi catch() của app. 
│   │   │                             # ĐẶC BIỆT: Chứa logic ROLLBACK (gọi Redis INCR trả lại kho 
│   │   │                             # nếu bước ghi MySQL ở order.service bị lỗi).
│   │   │
│   │   ├── validations/    # KHUÔN MẪU DỮ LIỆU (Định nghĩa luật cho đầu vào)
│   │   │   ├── auth.schema.js        # Luật: email phải đúng định dạng, pass > 6 ký tự.
│   │   │   └── order.schema.js       # Luật: productId phải là số nguyên, quantity phải > 0.
│   │   │
│   │   ├── utils/          # HÀM TIỆN ÍCH DÙNG CHUNG
│   │   │   ├── logger.js             # Ghi log (info, error) ra file để trace bug (dùng Winston).
│   │   │   └── response.js           # Hàm gói data trả về chuẩn: { success: true, data: {...} }
│   │   │
│   │   ├── app.js          # Nơi config Express: gộp routes, gộp middlewares (cors, helmet).
│   │   └── server.js       # File khởi chạy: Gọi app.listen(), kết nối DB, đính kèm Socket.io.
│   │
│   ├── .env                # File ẩn chứa cấu hình nhạy cảm (DB_URL, REDIS_URL, JWT_SECRET).
│   └── package.json        # Chứa danh sách các thư viện (express, prisma, ioredis, jsonwebtoken).


```

## Frontend (React.js)

Giao diện phân tách rõ Component chỉ hiển thị tĩnh (Dumb) và Component chứa logic (Smart).
```
frontend/
├── public/                 
│   ├── favicon.svg         # Icon website
│   └── robots.txt          # File điều hướng bot tìm kiếm
├── src/
│   ├── assets/             # Hình ảnh, Fonts, Icon
│   ├── components/         # MẢNH GHÉP GIAO DIỆN
│   │   ├── ui/             # Dumb Components (Dùng chung toàn hệ thống, chỉ nhận Props)
│   │   │   ├── Button.jsx          # Nút bấm (có truyền prop isLoading xoay xoay)
│   │   │   ├── Input.jsx           # Ô nhập liệu chuẩn hóa
│   │   │   ├── Skeleton.jsx        # Khung xám tải trang (tránh giật lag khi chờ API)
│   │   │   ├── Badge.jsx           # Nhãn hiển thị trạng thái (VD: -50%, Hết hàng)
│   │   │   ├── Modal.jsx           # Khung pop-up thông báo chung
│   │   │   └── Toast.jsx           # Popup thông báo nhỏ ở góc màn hình
│   │   └── features/       # Smart Components (Chứa logic, gọi API)
│   │       ├── flash-sale/
│   │       │   ├── TimerClock.jsx  # Component riêng cho phần Đếm ngược
│   │       │   └── ProductCard.jsx # Thẻ sản phẩm: Chứa nút Mua, gọi API, hiển thị thanh Progress %
│   │       ├── auth/
│   │       │   ├── LoginForm.jsx   
│   │       │   └── RegisterForm.jsx
│   │       ├── cart/               # Logic Giỏ hàng tạm thời
│   │       │   ├── CartDrawer.jsx  # Khung giỏ hàng trượt từ phải sang
│   │       │   └── CartItem.jsx    # Thành phần từng món hàng
│   │       └── profile/            # Khu vực User
│   │           ├── OrderHistory.jsx# Danh sách đơn đã mua
│   │           └── UserInfo.jsx    # Thông tin tài khoản
│   ├── pages/              # TRANG GIAO DIỆN CHÍNH (Được gán vào Route)
│   │   ├── Home.jsx        
│   │   ├── FlashSale.jsx   # Trang săn sale (Nơi load danh sách ProductCard)
│   │   ├── Profile.jsx     # Trang xem lịch sử đơn hàng
│   │   ├── Cart.jsx        # Trang chi tiết giỏ hàng
│   │   └── NotFound.jsx    # Trang báo lỗi 404 (Không tìm thấy trang)
│   ├── layouts/            # Cấu trúc khung trang
│   │   ├── MainLayout.jsx  # Chứa Header, Footer, và Outlet
│   │   └── AuthLayout.jsx  # Layout tối giản cho trang Đăng nhập
│   ├── routes/             # Điều hướng React Router
│   │   ├── index.jsx           # Định nghĩa list Route
│   │   └── ProtectedRoute.jsx  # CHỐT CHẶN: Đá user về /login nếu chưa có Token
│   ├── hooks/              # Logic tái sử dụng (Custom Hooks)
│   │   ├── useSocket.js    # Quản lý kết nối Socket.io, nhận % tồn kho cập nhật Real-time
│   │   ├── useCountdown.js # Đồng bộ đếm ngược cực chuẩn bằng JS Interval
│   │   ├── useDebounce.js  # Chống spam click liên tục từ phía người dùng
│   │   └── useToast.js     # Hook gọi nhanh các thông báo Toast
│   ├── contexts/           # State Management (Hoặc có thể dùng Zustand)
│   │   └── AuthContext.jsx # Lưu chuỗi JWT Token toàn cục
│   ├── services/           # LỚP GIAO TIẾP VỚI BACKEND
│   │   ├── api.js          # Axios Instance: Tự động đính kèm Bearer Token vào Header
│   │   └── flashsale.js    # Hàm gọi API `buyProduct(id)`
│   ├── utils/              # Tiện ích frontend
│   │   ├── formatters.js   # Format VNĐ, định dạng ngày giờ
│   │   ├── validators.js   # Các hàm validate dữ liệu mẫu (email, phone)
│   │   └── constants.js    # Lưu các hằng số, biến cấu hình
│   ├── App.jsx             
│   └── main.jsx            
├── .env                    # Lưu VITE_API_URL
├── .eslintrc.cjs           # Cấu hình kiểm tra cú pháp code (ESLint)
├── .prettierrc             # Cấu hình chuẩn format code (Prettier)
├── tailwind.config.js      # Cấu hình màu sắc, theme cho TailwindCSS
├── postcss.config.js       # File cấu hình PostCSS đi kèm Tailwind
└── vite.config.js          # Công cụ đóng gói build dự án tốc độ cao
```