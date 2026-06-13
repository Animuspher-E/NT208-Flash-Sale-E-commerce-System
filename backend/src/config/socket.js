const { Server } = require('socket.io');
let io = null;

function connectSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true
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

