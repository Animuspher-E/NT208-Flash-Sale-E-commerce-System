// ================================================
// File: src/controllers/user.controller.js
// Mục đích: Xử lý user requests: profile, orders, statistics
// ================================================

const userService = require('../services/user.service');
const logger = require('../utils/logger');
const { catchAsync } = require('../middlewares/errorHandler');

class UserController {
    /**
     * GET /users/orders
     * Lấy lịch sử đơn hàng của user
     * Query: ?page=1&limit=10&status=pending
     */
    getOrders = catchAsync(async (req, res) => {
        const userId = req.userId;
        const { page, limit, status } = req.query;

        const result = await userService.getOrders(userId, {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            status,
        });

        res.json({
            success: true,
            data: result,
        });
    });

    /**
     * GET /users/orders/:orderId
     * Lấy chi tiết 1 đơn hàng
     */
    getOrderDetail = catchAsync(async (req, res) => {
        const userId = req.userId;
        const { orderId } = req.params;

        const order = await userService.getOrderDetail(parseInt(orderId), userId);

        res.json({
            success: true,
            data: order,
        });
    });

    /**
     * GET /users/profile
     * Lấy profile user
     */
    getProfile = catchAsync(async (req, res) => {
        const userId = req.userId;

        const profile = await userService.getUserProfile(userId);

        res.json({
            success: true,
            data: profile,
        });
    });

    /**
     * PUT /users/profile
     * Cập nhật profile
     */
    updateProfile = catchAsync(async (req, res) => {
        const userId = req.userId;
        const updateData = req.body;

        const updatedProfile = await userService.updateUserProfile(userId, updateData);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedProfile,
        });
    });

    /**
     * GET /users/statistics
     * Lấy thống kê user (tổng order, total spend, etc.)
     */
    getStatistics = catchAsync(async (req, res) => {
        const userId = req.userId;

        const stats = await userService.getUserStatistics(userId);

        res.json({
            success: true,
            data: stats,
        });
    });
}

module.exports = new UserController();
