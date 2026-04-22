const crypto = require('crypto');
const qs = require('qs');
const moment = require('moment');
const vnpayConfig = require('../config/vnpay');
const prisma = require('../config/database');
const logger = require('../utils/logger');

class PaymentService {
    /**
     * Tạo URL gửi sang VNPay để người dùng thanh toán
     */
    async createPaymentUrl(orderId, req) {
        // 1. Kiểm tra đơn hàng có tồn tại không
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new Error('Order not found');
        if (order.paymentStatus === 'paid') throw new Error('Order has already been paid');

        // 2. Thiết lập tham số thời gian và IP
        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const ipAddr = req.headers['x-forwarded-for'] || 
                       req.connection?.remoteAddress || 
                       req.socket?.remoteAddress || 
                       req.connection?.socket?.remoteAddress || '127.0.0.1';

        // 3. Chuẩn bị các tham số cho VNPay
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = vnpayConfig.vnp_TmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId; // Mã tham chiếu (mã đơn hàng trong hệ thống)
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD: ' + orderId;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = order.finalPrice * 100; // VNPay yêu cầu nhân 100 cho VND
        vnp_Params['vnp_ReturnUrl'] = vnpayConfig.vnp_ReturnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;

        // 4. Sắp xếp tham số theo chuẩn VNPay
        vnp_Params = this.sortObject(vnp_Params);

        // 5. Tạo chữ ký mã hóa (Signature/Checksum)
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest('hex'); 
        vnp_Params['vnp_SecureHash'] = signed;

        // 6. Hoàn thành URL
        let vnpUrl = vnpayConfig.vnp_Url;
        vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

        return vnpUrl;
    }

    /**
     * Xử lý IPN mà VNPay bắn ngầm về Backend để cập nhật DB
     */
    async vnpayIpn(vnp_Params) {
        const secureHash = vnp_Params['vnp_SecureHash'];
        const orderId = vnp_Params['vnp_TxnRef'];
        const rspCode = vnp_Params['vnp_ResponseCode'];

        // Cắt bỏ tham số hash ra khỏi vnp_Params để chuẩn bị hash lại kiểm tra
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = this.sortObject(vnp_Params);
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest('hex');     

        // Kiểm tra tính toàn vẹn của dữ liệu (tránh mạo danh)
        if (secureHash === signed) {
            const order = await prisma.order.findUnique({
                where: { id: parseInt(orderId) }
            });

            if (order) {
                // Kiểm tra xem số tiền thanh toán có khớp không
                const checkAmount = Number(order.finalPrice) * 100 === Number(vnp_Params['vnp_Amount']);
                if (checkAmount) {
                    if (order.paymentStatus !== 'paid') {
                        // Trạng thái 00 nghĩa là thanh toán thành công phía ngân hàng
                        if (rspCode == '00') {
                            await prisma.order.update({
                                where: { id: parseInt(orderId) },
                                data: {
                                    paymentStatus: 'paid',
                                    status: 'confirmed'
                                }
                            });
                            logger.info(`Xác nhận thanh toán THÀNH CÔNG qua IPN cho Order: ${orderId}`);
                            
                            // (Tuỳ chọn) Bạn có thể Emit Socket nhắc Frontend cập nhật giỏ hàng tại đây!
                            return { code: '00', Message: 'Confirm Success' };
                        } else {
                            await prisma.order.update({
                                where: { id: parseInt(orderId) },
                                data: {
                                    paymentStatus: 'failed',
                                    status: 'cancelled'
                                }
                            });
                            return { code: '00', Message: 'Giao dịch thất bại tại VNPay' };
                        }
                    } else {
                        return { code: '02', Message: 'Order already confirmed' };
                    }
                } else {
                    return { code: '04', Message: 'Invalid amount' };
                }
            } else {
                return { code: '01', Message: 'Order not found' };
            }
        } else {
            return { code: '97', Message: 'Checksum failed' };
        }
    }

    sortObject(obj) {
        let sorted = {};
        let str = [];
        let key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key));
            }
        }
        str.sort();
        for (key = 0; key < str.length; key++) {
            sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
        }
        return sorted;
    }
}

module.exports = new PaymentService();
