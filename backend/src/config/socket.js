// ================================================
// File: src/config/socket.js
// Mục đích: Khởi tạo Socket.io Server
//   Socket.io cho phép server đẩy dữ liệu xuống client
//   mà không cần client phải hỏi trước (real-time)
//
// Cách hoạt động:
//   1. Client mở trang web -> tự động kết nối Socket
//   2. Khi có người mua hàng -> server emit sự kiện STOCK_UPDATED
//   3. Tất cả browser đang mở trang đều nhận được và cập nhật UI
//
// Ví dụ:
//   Server: io.emit('STOCK_UPDATED', { productId: 1, stock: 99 })
//   Client: socket.on('STOCK_UPDATED', (data) => setStock(data.stock))
// ================================================

const { Server } = require('socket.io');
let io = null;

function connectSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client kết nối: ${socket.id}`);
    socket.join('flashsale_room');
    console.log(`[Socket.io] Client ${socket.id} vào phòng flashsale_room`);
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client ngắt kết nối: ${socket.id} - Lý do: ${reason}`);
    });
  });
  console.log('[Socket.io] Socket.io đã khởi động!');
  return io;
}

function getSocketIO() {
  if (!io) {
    throw new Error('[Socket.io] Chưa khởi tạo! Hãy gọi connectSocket() trước.');
  }
  return io;
}
module.exports = { connectSocket, getSocketIO };
