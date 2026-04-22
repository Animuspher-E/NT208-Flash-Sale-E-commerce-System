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
const flashsaleRoutes = require('./routes/flashsale.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const paymentRoutes = require('./routes/payment.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Routes
app.use('/api/flashsale', flashsaleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server đang chạy!' });
});

app.use(errorHandler);

module.exports = app;
