require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectRedis } = require('./config/redis');
const { connectSocket } = require('./config/socket');
const { connectRabbitMQ } = require('./config/rabbitmq');
const PORT = process.env.PORT || 3001;
console.log(`[Server] Đang chạy tại PORT: ${PORT}`);

async function startServer() {
  try {
    console.log('[Server] Đang kết nối Redis...');
    connectRedis();

    console.log('[Server] Đang kết nối RabbitMQ...');
    await connectRabbitMQ();

    require('./services/order.worker').startWorker();

    const prisma = require('./config/database');
    await prisma.$connect();
    console.log('[Server] Kết nối Database thành công (Prisma)...');
    
    // Tự động Warm-up Cache khi khởi động server
    const { warmUpCache } = require('./services/cache.service');
    await warmUpCache();

    const httpServer = http.createServer(app);
    connectSocket(httpServer);
    httpServer.listen(PORT, () => {
      console.log('');
      console.log(`Server đang chạy tại: http://localhost:${PORT}`);
      console.log(`Socket.io:             ws://localhost:${PORT}`);
      console.log(`Môi trường:            ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Khởi động server thất bại:', error.message);
    process.exit(1);
  }
}

startServer();

