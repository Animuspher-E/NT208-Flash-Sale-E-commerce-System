const paymentService = require('../services/payment.service');
const { catchAsync } = require('../middlewares/errorHandler');

class PaymentController {
    /**
     * POST /api/payment/create_url
     * Người dùng click nút "Thanh toán bằng VNPay"
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
     * GET /api/payment/vnpay_ipn
     * Webhook/IPN url để VNPay tự động gọi đến Server (Backend to Backend) nhằm xác thực giao dịch
     */
    vnpayIpn = catchAsync(async (req, res) => {
        const result = await paymentService.vnpayIpn(req.query);
        
        // VNPay yêu cầu trả về theo đúng mẫu của họ "{ rspCode: '00', Message: '...' }"
        // Không bọc lại trong { success: true }
        res.status(200).json({
            RspCode: result.code,
            Message: result.Message
        });
    });
}

module.exports = new PaymentController();
