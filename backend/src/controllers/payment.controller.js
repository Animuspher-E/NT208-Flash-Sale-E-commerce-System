const paymentService = require('../services/payment.service');
const { catchAsync } = require('../middlewares/errorHandler');

class PaymentController {
    /**
     * POST /api/payment/create_url
     * Người dùng click nút "Thanh toán bằng PayOS"
     * Body: { orderId: 1 }
     */
    createPaymentUrl = catchAsync(async (req, res) => {
        const { orderId, returnUrl, cancelUrl } = req.body;
        
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Tham số orderId là bắt buộc' });
        }

        const paymentData = await paymentService.createPaymentUrl(orderId, req, returnUrl, cancelUrl);

        res.json({
            success: true,
            data: paymentData
        });
    });

    /**
     * POST /api/payment/payos_webhook
     * Webhook url để PayOS tự động gọi đến Server nhằm xác thực giao dịch
     */
    payosWebhook = catchAsync(async (req, res) => {
        const result = await paymentService.payosWebhook(req.body);
        
        // Trả về kết quả xử lý webhook
        res.status(200).json(result);
    });

    /**
     * POST /api/payment/verify_return
     * Cập nhật trạng thái thủ công khi frontend redirect về
     */
    verifyReturnUrl = catchAsync(async (req, res) => {
        const { orderCode } = req.body;
        if (!orderCode) {
            return res.status(400).json({ success: false, message: 'Tham số orderCode là bắt buộc' });
        }
        
        const result = await paymentService.verifyPaymentReturn(orderCode);
        res.json(result);
    });

    /**
     * POST /api/payment/sync_status
     * Kiểm tra PayOS và cập nhật DB khi user đã chuyển khoản
     */
    syncPaymentStatus = catchAsync(async (req, res) => {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Tham số orderId là bắt buộc' });
        }

        const result = await paymentService.syncPaymentByOrderId(
            parseInt(orderId, 10),
            req.userId
        );
        res.json(result);
    });
}

module.exports = new PaymentController();
