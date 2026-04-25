const paymentService = require('../services/payment.service');
const { catchAsync } = require('../middlewares/errorHandler');

class PaymentController {
    /**
     * POST /api/payment/create_url
     * Người dùng click nút "Thanh toán bằng PayOS"
     * Body: { orderId: 1 }
     */
    createPaymentUrl = catchAsync(async (req, res) => {
        const { orderId } = req.body;
        
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Tham số orderId là bắt buộc' });
        }

        const url = await paymentService.createPaymentUrl(orderId, req);

        res.json({
            success: true,
            data: { url }
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
}

module.exports = new PaymentController();
