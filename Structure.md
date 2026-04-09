## Backend (Node.js/Express)
```
backend/
├── prisma/                 # Quản trị database (Tầng dữ liệu gốc)
│   ├── schema.prisma       # Chứa các Model: User, Product, Inventory, Order
│   ├── migrations/         # Lịch sử thay đổi cấu trúc bảng
│   └── seeders/            # Script tạo 10,000 dữ liệu ảo để test chịu tải
│       └── data.seed.js    
├── src/
│   ├── config/             # Cấu hình hạ tầng (Khởi tạo kết nối)
│   │   ├── database.js     # Khởi tạo Prisma Client (Connection Pool)
│   │   ├── redis.js        # Khởi tạo Redis Client
│   │   └── socket.js       # Khởi tạo WebSockets (Socket.io)
│   ├── routes/             # Tầng Routing (Định tuyến API)
│   │   └── v1/
│   │       ├── auth.routes.js      # VD: POST /api/v1/auth/login
│   │       ├── flashsale.routes.js # VD: POST /api/v1/flashsale/buy
│   │       └── user.routes.js      # VD: GET /api/v1/user/orders
│   ├── controllers/        # Tầng giao tiếp (Chỉ nhận Request, giao cho Service, trả Response)
│   │   ├── auth.controller.js
│   │   ├── flashsale.controller.js # Nhận ID sản phẩm -> Gọi Service -> Trả về JSON 
│   │   └── user.controller.js
│   ├── services/           # Tầng nghiệp vụ cốt lõi (Business Logic)
│   │   ├── auth.service.js       # Gọi hàm Hash/JWT, kiểm tra DB User
│   │   ├── cache.service.js      # Logic đẩy thông tin sản phẩm từ MySQL lên Redis
│   │   ├── flashsale.service.js  # LÕI TỐC ĐỘ: Trừ tồn kho trực tiếp trên RAM bằng Redis
│   │   └── order.service.js      # LÕI DỮ LIỆU: Mở Prisma Transaction ghi vào MySQL an toàn
│   ├── middlewares/        # Cổng bảo vệ (Security Layer)
│   │   ├── auth.js               # Giải mã JWT Token từ Header
│   │   ├── rateLimit.js          # Dùng Redis chặn IP/User spam (VD: > 2 req/giây -> Chặn)
│   │   ├── validate.js           # Chạy Zod validation. Lỗi -> Đá văng ra ngoài không cho vào Controller
│   │   └── errorHandler.js       # Hứng toàn bộ lỗi catch() của hệ thống, trả JSON chuẩn
│   ├── validations/        # Định nghĩa khuôn mẫu dữ liệu đầu vào
│   │   ├── auth.schema.js        # Zod schema cho Login/Register
│   │   └── order.schema.js       # Zod schema kiểm tra ID sản phẩm, số lượng
│   ├── utils/              # Hàm tiện ích dùng chung
│   │   ├── logger.js             # Hàm ghi log hệ thống
│   │   └── response.js           # Hàm chuẩn hóa format API (success, data, message)
│   ├── app.js              # Khai báo Express app, gắn các Middleware global, gắn Routes
│   └── server.js           # Điểm cuối: Khởi động Express Server, đính kèm Socket.io
├── .env                    # Lưu biến môi trường (PORT, DB_URL, REDIS_URL, JWT_SECRET)
└── package.json
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