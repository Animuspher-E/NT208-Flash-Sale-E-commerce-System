// ================================================
// File: src/server.js
// Mục đích: Điểm khởi đầu của toàn bộ ứng dụng
//   Đây là file chạy đầu tiên khi gõ: node server.js
//
// Thứ tự khởi động (quan trọng!):
//   1. Load biến môi trường từ .env
//   2. Kết nối Redis
//   3. Kết nối Database (MySQL/Prisma) - của dev1
//   4. Tạo HTTP Server từ Express App
//   5. Đính kèm Socket.io vào HTTP Server
//   6. Bắt đầu lắng nghe cổng
// ================================================

require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectRedis } = require('./config/redis');
const { connectSocket } = require('./config/socket');
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('[Server] Đang kết nối Redis...');
    connectRedis(); // Kết nối Redis
    // Kết nối Database (MySQL qua Prisma)
    // const { connectDatabase } = require('./config/database');
    // await connectDatabase();
    const httpServer = http.createServer(app); // Tạo HTTP Server từ Express App
    connectSocket(httpServer); // Đính kèm Socket.io vào HTTP Server
    httpServer.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log(`Server đang chạy tại: http://localhost:${PORT}`);
      console.log(`Socket.io:             ws://localhost:${PORT}`);
      console.log(`Môi trường:            ${process.env.NODE_ENV || 'development'}`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('Khởi động server thất bại:', error.message);
    process.exit(1);
  }
}

startServer();
