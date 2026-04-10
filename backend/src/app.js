// ================================================
// File: src/app.js
// Mục đích: Cấu hình Express App
//   Nơi ghép tất cả các thành phần lại với nhau:
//   - Middleware toàn cục (cors, helmet, json parser)
//   - Route cho từng API group
//   - Error Handler (phải đặt CUỐI CÙNG)
// ================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const flashsaleRoutes = require('./routes/v1/flashsale.routes');
// const authRoutes  = require('./routes/v1/auth.routes');
// const userRoutes  = require('./routes/v1/user.routes');
const errorHandler = require('./middlewares/errorHandler');
const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})); // CORS: Cho phép frontend ở domain khác kết nối (Frontend ở localhost:5173, Backend ở localhost:3000)

app.use(express.json());
// API Flash Sale: /api/v1/flashsale/*
app.use('/api/v1/flashsale', flashsaleRoutes);
// API còn lại
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/user', userRoutes);
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server đang chạy!' });
});
app.use(errorHandler);

module.exports = app;
