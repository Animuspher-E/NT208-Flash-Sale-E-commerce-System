// src/controllers/auth.controller.js
// Xử lý auth requests: login, register, refresh token

const authService = require('../services/auth.service');
const logger = require('../config/logger');
const { catchAsync } = require('../middlewares/errorHandler');
const sendEmail = require('../services/mailer.service');

class AuthController {
    /**
     * POST /auth/register
     * Tạo user mới
     */
    register = catchAsync(async (req, res) => {
        const { email, password, name } = req.body;

        const user = await authService.register(email, password, name);

        // Generate token for new user
        const token = authService.generateToken(user.id, user.email);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                token,
            },
        });
    });

    /**
     * POST /auth/login
     * Đăng nhập user
     */
    login = catchAsync(async (req, res) => {
        const { email, password } = req.body;

        const { user, token } = await authService.login(email, password);

        // Set secure cookie (nếu cần)
        res.cookie('token', token, {
            httpOnly: true, // JavaScript không thể access
            secure: process.env.NODE_ENV === 'production', // HTTPS only
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user,
                token,
            },
        });
    });

    /**
     * POST /auth/refresh-token
     * Cấp token mới khi token sắp hết hạn
     */
    refreshToken = catchAsync(async (req, res) => {
        const oldToken = req.token || req.body.token;

        if (!oldToken) {
            throw new Error('Token required');
        }

        const newToken = await authService.refreshToken(oldToken);

        res.json({
            success: true,
            message: 'Token refreshed',
            data: {
                token: newToken,
            },
        });
    });

    /**
     * GET /auth/me
     * Lấy info user hiện tại
     */
    getMe = catchAsync(async (req, res) => {
        const user = await authService.getUserFromToken(req.token);

        res.json({
            success: true,
            data: user,
        });
    });

    /**
     * POST /auth/change-password
     * Thay đổi mật khẩu
     */
    changePassword = catchAsync(async (req, res) => {
        const { oldPassword, newPassword } = req.body;
        const userId = req.userId;

        await authService.changePassword(userId, oldPassword, newPassword);

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    });

    /**
     * POST /auth/logout
     * Logout (clear cookie)
     */
    logout = (req, res) => {
        res.clearCookie('token');

        res.json({
            success: true,
            message: 'Logout successful',
        });
    };

    /**
     * POST /auth/forgot-password
     * Quên mật khẩu - Gửi mail xác nhận
     */
    forgotPassword = catchAsync(async (req, res) => {
        const { email } = req.body;
        
        // 1. Tạo token và lưu vào DB
        const resetToken = await authService.forgotPassword(email);

        // 2. Tạo URL đặt lại mật khẩu (Trỏ tới Frontend)
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        // 3. Gửi email
        const message = `Bạn vừa yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào link sau để thực hiện (Mã có hiệu lực trong 10 phút):\n\n${resetUrl}`;

        try {
            await sendEmail({
                email: email,
                subject: '[FlashSale] Yêu cầu khôi phục mật khẩu',
                message: message,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2>Khôi phục mật khẩu</h2>
                        <p>Chào bạn, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                        <p>Vui lòng nhấn vào nút bên dưới để tiến hành đổi mật khẩu mới (Mã có hiệu lực trong <b>10 phút</b>):</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">ĐẶT LẠI MẬT KHẨU</a>
                        </div>
                        <p style="color: #666; font-size: 13px;">Nếu bạn không phải là người yêu cầu, vui lòng bỏ qua email này.</p>
                    </div>
                `
            });

            res.json({
                success: true,
                message: 'Mã khôi phục đã được gửi tới email của bạn'
            });
        } catch (error) {
            logger.error('Send email error:', error);
            throw new Error('Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau.');
        }
    });

    /**
     * POST /auth/reset-password/:token
     * Đặt lại mật khẩu mới
     */
    resetPassword = catchAsync(async (req, res) => {
        const { token } = req.params;
        const { password } = req.body;

        await authService.resetPassword(token, password);

        res.json({
            success: true,
            message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.'
        });
    });
}

module.exports = new AuthController();

/*
- Trích xuất dữ liệu(req.body, req.params, req.query)
    - Gọi service
        - Format response

2. KHÔNG CHỨA BUSINESS LOGIC:
   ❌ BAD:
exports.buyProduct = async (req, res) => {
    const product = await prisma.product.findUnique(...)
    if (product.stock < qty) throw error
     ... toàn bộ logic ở đây
}
   
   ✓ GOOD:
exports.buyProduct = async (req, res) => {
    const result = await orderService.buyProduct(userId, productId, qty)
    res.json(result)
}

3. ERROR HANDLING:
   Dùng catchAsync() để wrap function
   → Tự động bắt error và forward tới errorHandler

4. RESPONSE FORMAT:
{
    success: true / false,
        message: "...",
            data: { ... },
    error: "..."(nếu fail)
}

5. HTTP STATUS CODES:
- 200: OK
    - 201: Created
        - 400: Bad Request(validation error)
            - 401: Unauthorized(not authenticated)
                - 403: Forbidden(not authorized)
                    - 404: Not Found
                        - 429: Too Many Requests(rate limit)
                            - 500: Internal Server Error

============================================
*/
