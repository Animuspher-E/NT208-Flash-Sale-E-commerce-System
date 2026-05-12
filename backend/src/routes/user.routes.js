// src/routes/user.routes.js
// User API routes - Get/Update profile, view orders, statistics

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authMiddleware } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const userSchemas = require('../validations/user.schema');

/**
 * GET /api/users/profile
 * Lấy profile user hiện tại
 * 
 * Headers:
 *   Authorization: Bearer <token>
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "id": 1,
 *       "email": "user@test.com",
 *       "name": "John Doe",
 *       "phone": "0123456789",
 *       "address": "123 Main St",
 *       "createdAt": "2024-01-01T00:00:00Z"
 *     }
 *   }
 */
router.get(
  '/profile',
  authMiddleware,
  userController.getProfile
);

/**
 * PUT /api/users/profile
 * Cập nhật profile user
 * 
 * Headers:
 *   Authorization: Bearer <token>
 *   Content-Type: application/json
 * 
 * Body:
 *   {
 *     "name": "Jane Doe",
 *     "phone": "0987654321",
 *     "address": "456 Oak Ave"
 *   }
 * 
 * Response:
 *   {
 *     "success": true,
 *     "message": "Profile updated successfully",
 *     "data": { updated user object }
 *   }
 */
router.put(
  '/profile',
  authMiddleware,
  validate(userSchemas.updateProfileSchema),
  userController.updateProfile
);

/**
 * GET /api/users/orders
 * Lấy danh sách đơn hàng của user
 * 
 * Headers:
 *   Authorization: Bearer <token>
 * 
 * Query Parameters:
 *   page (default: 1)      - Page number
 *   limit (default: 10)    - Items per page
 *   status (optional)      - Filter by status: pending, confirmed, paid, shipped, delivered, completed, cancelled
 * 
 * Examples:
 *   /api/users/orders
 *   /api/users/orders?page=2&limit=20
 *   /api/users/orders?status=pending
 *   /api/users/orders?page=1&limit=10&status=completed
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "orders": [
 *         {
 *           "id": 1,
 *           "orderNumber": "ORD-1704067200000-1",
 *           "status": "pending",
 *           "totalPrice": 199.99,
 *           "finalPrice": 199.99,
 *           "items": [
 *             {
 *               "id": 1,
 *               "quantity": 2,
 *               "unitPrice": 99.99,
 *               "product": {
 *                 "id": 1,
 *                 "name": "Product Name",
 *                 "price": 99.99,
 *                 "image": "url"
 *               }
 *             }
 *           ],
 *           "createdAt": "2024-01-01T00:00:00Z"
 *         }
 *       ],
 *       "total": 25,
 *       "page": 1,
 *       "limit": 10,
 *       "totalPages": 3
 *     }
 *   }
 */
router.get(
  '/orders',
  authMiddleware,
  userController.getOrders
);

const orderController = require('../controllers/order.controller');

/**
 * GET /api/users/orders/:orderId
 * Lấy chi tiết 1 đơn hàng
 * 
 * Headers:
 *   Authorization: Bearer <token>
 * 
 * URL Parameters:
 *   orderId (required) - Order ID
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "id": 1,
 *       "orderNumber": "ORD-...",
 *       "status": "pending",
 *       "totalPrice": 199.99,
 *       "items": [ ... ],
 *       "payments": [ ... ],
 *       "user": { ... },
 *       "createdAt": "2024-01-01T00:00:00Z"
 *     }
 *   }
 */
router.get(
  '/orders/:orderId',
  authMiddleware,
  userController.getOrderDetail
);

/**
 * POST /api/users/orders/:orderId/cancel
 * Hủy đơn hàng (chỉ dành cho đơn hàng có trạng thái pending)
 */
router.post(
  '/orders/:orderId/cancel',
  authMiddleware,
  orderController.cancelOrder
);

/**
 * GET /api/users/statistics
 * Lấy thống kê của user (tổng order, tổng chi tiêu, etc.)
 * 
 * Headers:
 *   Authorization: Bearer <token>
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "user": {
 *         "id": 1,
 *         "name": "John Doe",
 *         "email": "user@test.com",
 *         "memberSince": "2024-01-01T00:00:00Z"
 *       },
 *       "orders": {
 *         "total": 5,
 *         "pending": 1,
 *         "completed": 3,
 *         "cancelled": 1
 *       },
 *       "spending": {
 *         "total": 1000.00,
 *         "average": 200.00,
 *         "highest": 300.00,
 *         "lastPurchase": "2024-01-15T00:00:00Z"
 *       }
 *     }
 *   }
 */
router.get(
  '/statistics',
  authMiddleware,
  userController.getStatistics
);

module.exports = router;

/*
============================================
USAGE EXAMPLES:
============================================

1. Get user profile:
   GET /api/users/profile
   Headers: Authorization: Bearer eyJ...

2. Update profile:
   PUT /api/users/profile
   Headers: Authorization: Bearer eyJ..., Content-Type: application/json
   Body: {
     "name": "New Name",
     "phone": "0123456789",
     "address": "New Address"
   }

3. Get orders (page 1, 10 per page):
   GET /api/users/orders
   GET /api/users/orders?page=1&limit=10

4. Get orders with status filter:
   GET /api/users/orders?status=pending
   GET /api/users/orders?status=completed&page=2

5. Get order detail:
   GET /api/users/orders/123

6. Get user statistics:
   GET /api/users/statistics

============================================
*/

/*
============================================
ERROR RESPONSES:
============================================

401 Unauthorized:
{
  "success": false,
  "error": "Missing or invalid authorization header"
}

400 Bad Request (validation error):
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "phone",
      "message": "Phone must be 10-11 digits"
    }
  ]
}

404 Not Found:
{
  "success": false,
  "error": "Record not found"
}

429 Too Many Requests (rate limit):
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "retryAfter": 900
}

============================================
*/
