const payos = require('../config/payos');
const prisma = require('../config/database');
const logger = require('../config/logger');

class PaymentService {
    /**
     * Tạo link thanh toán qua PayOS
     */
    async createPaymentUrl(orderId, req, returnUrlClient, cancelUrlClient) {
        // 1. Kiểm tra đơn hàng có tồn tại không
        const order = await prisma.order.findUnique({ 
            where: { id: orderId },
            include: { items: { include: { product: true } } }
        });
        
        if (!order) throw new Error('Order not found');
        if (order.paymentStatus === 'paid') throw new Error('Order has already been paid');

        // 2. Chuẩn bị dữ liệu thanh toán cho PayOS
        const domain = process.env.FRONTEND_URL || 'http://localhost:5173';
        const cancelUrl = cancelUrlClient || `${domain}/payment/cancel`;
        const returnUrl = returnUrlClient || `${domain}/payment/result`;
        
        // Format: [order.id][5 digits of timestamp] -> e.g. 612345
        const timestampPart = String(Math.floor(Date.now() / 1000)).slice(-5);
        const uniqueOrderCode = Number(String(order.id) + timestampPart);

        const paymentData = {
            orderCode: uniqueOrderCode,
            amount: Math.round(order.finalPrice),
            description: `Thanh toan don hang #${order.id}`,
            cancelUrl: cancelUrl,
            returnUrl: returnUrl,
            items: order.items.map(item => ({
                name: item.product.name.substring(0, 50), // PayOS giới hạn độ dài tên item
                quantity: item.quantity,
                price: Math.round(item.unitPrice)
            }))
        };

        // 3. Gọi PayOS API để tạo link thanh toán
        try {
            const paymentLinkRes = await payos.paymentRequests.create(paymentData);
            return paymentLinkRes.checkoutUrl;
        } catch (error) {
            logger.error('PayOS Create Payment Link Error:', error);
            throw new Error(`Không thể tạo link thanh toán PayOS: ${error.message}`);
        }
    }

    /**
     * Xử lý Webhook từ PayOS gửi về để cập nhật trạng thái đơn hàng
     */
    async payosWebhook(webhookBody) {
        try {
            // 1. Xác thực dữ liệu Webhook (Tránh giả mạo)
            const data = payos.webhooks.verify(webhookBody);

            // Giải mã orderId từ uniqueOrderCode (bỏ 5 chữ số cuối là timestamp)
            const payosOrderCode = data.orderCode;
            const orderIdStr = String(payosOrderCode).slice(0, -5);
            const orderId = parseInt(orderIdStr, 10);

            // Trong PayOS Webhook, data.code === '00' hoặc 'SUCCESS' thường là thành công
            // Tuy nhiên verifyPaymentWebhookData đã trả về data sạch sau khi kiểm tra signature
            
            const order = await prisma.order.findUnique({
                where: { id: orderId }
            });

            if (order && order.paymentStatus !== 'paid') {
                await prisma.order.update({
                    where: { id: parseInt(orderId) },
                    data: {
                        paymentStatus: 'paid',
                        status: 'confirmed'
                    }
                });
                logger.info(`Xác nhận thanh toán THÀNH CÔNG qua PayOS cho Order: ${orderId}`);
                return { success: true, message: 'Thanh toán thành công' };
            }

            return { success: true, message: 'Webhook processed' };
        } catch (error) {
            logger.error('PayOS Webhook Error:', error);
            // Quan trọng: Trả về lỗi để PayOS biết và retry nếu cần, 
            // hoặc trả về success: false tuỳ theo quy định API
            throw error;
        }
    }

    /**
     * Xác minh trạng thái thanh toán trực tiếp từ PayOS (Dùng khi frontend bị redirect về)
     */
    async verifyPaymentReturn(orderCode) {
        try {
            // Lấy thông tin thanh toán từ PayOS
            const paymentInfo = await payos.paymentRequests.get(orderCode);
            
            // Giải mã orderId (bỏ 5 chữ số cuối)
            const orderIdStr = String(orderCode).slice(0, -5);
            const orderId = parseInt(orderIdStr, 10);

            if (paymentInfo.status === 'PAID') {
                const order = await prisma.order.findUnique({
                    where: { id: orderId }
                });

                if (order && order.paymentStatus !== 'paid') {
                    await prisma.order.update({
                        where: { id: orderId },
                        data: {
                            paymentStatus: 'paid',
                            status: 'confirmed'
                        }
                    });
                    logger.info(`Xác nhận thanh toán (Return) THÀNH CÔNG qua PayOS cho Order: ${orderId}`);
                }
                return { success: true, isPaid: true };
            }
            return { success: true, isPaid: false };
        } catch (error) {
            logger.error('PayOS Verify Return Error:', error);
            throw new Error(`Không thể xác minh giao dịch: ${error.message}`);
        }
    }
}

module.exports = new PaymentService();
