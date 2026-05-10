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
const adminRoutes = require('./routes/admin.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      origin === 'null' ||
      /^file:\/\//.test(origin) ||
      /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
      origin === (process.env.FRONTEND_URL || '')
    ) {
      return callback(null, true);
    }
    // Production: chỉ cho phép FRONTEND_URL
    if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
      return callback(new Error('Not allowed by CORS'));
    }
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Routes
app.use('/api/flashsale', flashsaleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server đang chạy!' });
});

app.use(errorHandler);

module.exports = app;
