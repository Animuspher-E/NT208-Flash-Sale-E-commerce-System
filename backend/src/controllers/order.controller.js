// ================================================
// File: src/controllers/order.controller.js
// Mục đích: Xử lý order requests: buy product, cancel order
// ================================================

const orderService = require('../services/order.service');
const logger = require('../config/logger');
const { catchAsync } = require('../middlewares/errorHandler');

class OrderController {
    /**
     * POST /orders/buy
     * Mua sản phẩm (Flash Sale)
     * Body: { productId, quantity }
     */
    buyProduct = catchAsync(async (req, res) => {
        const userId = req.userId;
        const { productId, quantity } = req.validated;

        const result = await orderService.buyProduct(userId, productId, quantity);

        res.status(202).json({
            success: true,
            message: 'Đơn hàng đang được hệ thống xử lý ngầm (RabbitMQ)',
            data: result,
        });
    });

    /**
     * POST /orders/:orderId/cancel
     * Hủy đơn hàng
     */
    cancelOrder = catchAsync(async (req, res) => {
        const userId = req.userId;
        const { orderId } = req.params;

        const updatedOrder = await orderService.cancelOrder(
            parseInt(orderId),
            userId
        );

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: updatedOrder,
        });
    });

    /**
     * POST /orders/:orderId/confirm-payment
     * Xác nhận thanh toán (Admin only)
     */
    confirmPayment = catchAsync(async (req, res) => {
        const { orderId } = req.params;

        const order = await orderService.confirmPayment(parseInt(orderId));

        res.json({
            success: true,
            message: 'Payment confirmed',
            data: order,
        });
    });
}

module.exports = new OrderController();
