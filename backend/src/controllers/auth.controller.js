// src/controllers/auth.controller.js
// Xử lý auth requests: login, register, refresh token

const authService = require('../services/auth.service');
const logger = require('../utils/logger');
const { catchAsync } = require('../middlewares/errorHandler');

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
