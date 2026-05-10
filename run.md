# 🚀 Hướng dẫn chạy dự án KHÔNG dùng Docker (Windows)

Dự án cần **4 dịch vụ** chạy đồng thời:

| # | Dịch vụ       | Mục đích          | Port mặc định |
|---|---------------|--------------------|----------------|
| 1 | PostgreSQL    | Database chính     | `5432`         |
| 2 | Redis         | Cache / Session    | `6379`         |
| 3 | RabbitMQ      | Message Queue      | `5672`, `15672` |
| 4 | Node.js (Backend) | API Server     | `3000`         |

> Frontend là file HTML tĩnh, mở trực tiếp bằng trình duyệt hoặc dùng Live Server.

---

## 📋 Yêu cầu hệ thống

- **Node.js** >= 18.x — [Tải tại đây](https://nodejs.org/)
- **PostgreSQL** >= 15 — [Tải tại đây](https://www.postgresql.org/download/windows/)
- **Redis** (cho Windows) — [Tải Memurai](https://www.memurai.com/) hoặc dùng [Redis qua WSL](#cách-b-dùng-redis-qua-wsl)
- **RabbitMQ** + Erlang — [Tải tại đây](https://www.rabbitmq.com/install-windows.html)

---

## Bước 1: Cài đặt PostgreSQL

### 1.1. Tải và cài đặt

1. Tải PostgreSQL installer tại: https://www.postgresql.org/download/windows/
2. Chạy installer, trong quá trình cài đặt:
   - **Ghi nhớ password** bạn đặt cho user `postgres` (ví dụ: `123456`)
   - Giữ port mặc định: `5432`
   - Chọn cài **pgAdmin 4** (công cụ quản lý giao diện, tùy chọn)
3. Hoàn tất cài đặt

### 1.2. Tạo database

Mở **Command Prompt** hoặc **PowerShell** rồi chạy:

```powershell
# Mở psql (nhập password khi được hỏi)
psql -U postgres

# Trong psql, tạo database:
CREATE DATABASE flashsale_db;

# Kiểm tra đã tạo thành công:
\l

# Thoát:
\q
```

> **Lưu ý:** Nếu lệnh `psql` không tìm thấy, thêm đường dẫn PostgreSQL vào PATH:
> `C:\Program Files\PostgreSQL\15\bin` (thay `15` bằng phiên bản bạn cài)

---

## Bước 2: Cài đặt Redis

### Cách A: Dùng Memurai (dễ nhất cho Windows)

1. Tải Memurai tại: https://www.memurai.com/get-memurai
2. Cài đặt, Memurai sẽ tự chạy như Windows Service trên port `6379`
3. Kiểm tra:

```powershell
# Mở PowerShell
memurai-cli ping
# Kết quả: PONG
```

### Cách B: Dùng Redis qua WSL

```powershell
# Bật WSL (chạy PowerShell với quyền Admin)
wsl --install

# Sau khi cài WSL, mở Ubuntu terminal:
sudo apt update
sudo apt install redis-server -y

# Khởi động Redis:
sudo service redis-server start

# Kiểm tra:
redis-cli ping
# Kết quả: PONG
```

> Redis chạy trên WSL vẫn truy cập được từ Windows qua `localhost:6379`.

---

## Bước 3: Cài đặt RabbitMQ

### 3.1. Cài Erlang (bắt buộc)

1. Tải Erlang tại: https://www.erlang.org/downloads
2. Cài đặt, chọn tất cả tùy chọn mặc định

### 3.2. Cài RabbitMQ

1. Tải tại: https://www.rabbitmq.com/install-windows.html
2. Cài đặt, RabbitMQ sẽ tự chạy như Windows Service

### 3.3. Bật giao diện quản lý (tùy chọn)

```powershell
# Mở PowerShell với quyền Admin
cd "C:\Program Files\RabbitMQ Server\rabbitmq_server-<version>\sbin"

# Bật plugin quản lý:
.\rabbitmq-plugins.bat enable rabbitmq_management
```

Sau đó truy cập: http://localhost:15672
- Username: `guest`
- Password: `guest`

### 3.4. Kiểm tra RabbitMQ đang chạy

```powershell
# Kiểm tra trạng thái
sc query RabbitMQ
```

---

## Bước 4: Cấu hình file `.env` (Backend)

Mở file `backend/.env` và sửa lại cho đúng thông tin trên máy bạn:

```env
NODE_ENV=development
PORT=3000

# DATABASE - Sửa password cho đúng với PostgreSQL của bạn
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/flashsale_db?schema=public"

# JWT
JWT_SECRET="your_super_secret_jwt_key_change_this_in_production"
JWT_EXPIRES_IN="7d"

# REDIS
REDIS_URL="redis://localhost:6379"

# RABBITMQ - Mặc định RabbitMQ trên Windows dùng guest/guest
RABBITMQ_URL="amqp://guest:guest@localhost:5672"

# FRONTEND
FRONTEND_URL="http://localhost:5173"

# PAYOS (giữ nguyên hoặc thay bằng key của bạn)
PAYOS_CLIENT_ID=acb0c1a2-3daa-456c-9878-9f049bb23ba7
PAYOS_API_KEY=c9f038b2-0505-4f99-8cc4-822013626636
PAYOS_CHECKSUM_KEY=d357c810496f26f64d1e87a51ad9ad0363c5c373f7e6993d4f4402382b53fcf1

# EMAIL
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# ADMIN
ADMIN_EMAIL=admin@flashsale.com
ADMIN_PASSWORD=password123

# OTHER
BCRYPT_ROUNDS=10
LOG_LEVEL=info
```

> ⚠️ **QUAN TRỌNG:** Thay `YOUR_PASSWORD` bằng password PostgreSQL bạn đặt lúc cài đặt!

---

## Bước 5: Cài đặt và khởi động Backend

Mở **PowerShell** tại thư mục gốc dự án:

```powershell
# 1. Vào thư mục backend
cd backend

# 2. Cài đặt dependencies
npm install

# 3. Generate Prisma Client
npx prisma generate

# 4. Chạy migration (tạo bảng trong database)
npx prisma migrate dev --name init

# 5. Seed dữ liệu mẫu (tùy chọn)
npm run db:seed

# 6. Khởi động server ở chế độ dev
npm run dev
```

### Kết quả khi chạy thành công:

```
[Server] Đang kết nối Redis...
[Server] Đang kết nối RabbitMQ...
[Redis] Kết nối Redis thành công!
✅ RabbitMQ Connected Successfully
Đã tạo/kiểm tra Queue: order_processing_queue
[Worker] Khởi động: Lắng nghe queue 'order_processing_queue'...
[Server] Kết nối Database thành công (Prisma)...

Server đang chạy tại: http://localhost:3000
Socket.io:             ws://localhost:3000
Môi trường:            development
```

---

## Bước 6: Mở Frontend

Frontend là các file HTML tĩnh, bạn có thể mở bằng một trong hai cách:

### Cách 1: Dùng Live Server (VS Code)

1. Cài extension **Live Server** trong VS Code
2. Click chuột phải vào `frontend/index.html` → **Open with Live Server**
3. Trình duyệt sẽ tự mở tại `http://127.0.0.1:5500`

### Cách 2: Mở trực tiếp

Mở file `frontend/index.html` trực tiếp bằng trình duyệt (không khuyến khích vì có thể bị lỗi CORS).

---

## 🔧 Xử lý lỗi thường gặp

### ❌ Lỗi: `Authentication failed against database server`

**Nguyên nhân:** Password PostgreSQL trong `.env` không đúng.

**Cách sửa:** Mở `backend/.env`, sửa `DATABASE_URL` với password đúng:
```
DATABASE_URL="postgresql://postgres:PASSWORD_ĐÚNG@localhost:5432/flashsale_db?schema=public"
```

---

### ❌ Lỗi: `connect ECONNREFUSED 127.0.0.1:6379`

**Nguyên nhân:** Redis chưa chạy.

**Cách sửa:**
```powershell
# Nếu dùng Memurai:
net start Memurai

# Nếu dùng WSL:
wsl sudo service redis-server start
```

---

### ❌ Lỗi: `connect ECONNREFUSED 127.0.0.1:5672`

**Nguyên nhân:** RabbitMQ chưa chạy.

**Cách sửa:**
```powershell
# Khởi động RabbitMQ service
net start RabbitMQ
```

---

### ❌ Lỗi: `psql: command not found`

**Cách sửa:** Thêm PostgreSQL vào PATH:
1. Tìm **"Edit environment variables"** trong Start menu
2. Trong **System Variables** → chọn `Path` → **Edit**
3. Thêm: `C:\Program Files\PostgreSQL\15\bin`
4. Restart terminal

---

### ❌ Lỗi: `P1001: Can't reach database server`

**Nguyên nhân:** PostgreSQL chưa chạy.

**Cách sửa:**
```powershell
# Khởi động PostgreSQL service
net start postgresql-x64-15
# (thay 15 bằng phiên bản bạn cài)
```

---

## 📁 Cấu trúc thư mục chính

```
NT208-Flash-Sale-E-commerce-System/
├── backend/
│   ├── .env                    ← Cấu hình (CẦN SỬA)
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma       ← Schema database
│   │   └── seeders/
│   │       └── data.seed.js    ← Dữ liệu mẫu
│   └── src/
│       └── server.js           ← Entry point
├── frontend/
│   ├── index.html              ← Trang chủ
│   └── pages/
│       ├── admin.html
│       ├── auth.html
│       ├── cart.html
│       ├── home.html
│       ├── orders.html
│       └── profile.html
└── run.md                      ← File này
```

---

## ⚡ Tóm tắt nhanh (cho lần chạy tiếp theo)

Sau khi đã cài đặt xong tất cả, các lần chạy tiếp theo chỉ cần:

```powershell
# Đảm bảo PostgreSQL, Redis, RabbitMQ đang chạy (thường tự start cùng Windows)

# Vào thư mục backend và chạy
cd backend
npm run dev
```

Sau đó mở frontend bằng Live Server hoặc trình duyệt.
