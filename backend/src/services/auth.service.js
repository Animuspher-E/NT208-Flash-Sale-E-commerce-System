// src/services/auth.service.js
// Xử lý xác thực: mã hóa mật khẩu, kiểm tra token, tạo JWT

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '7d'; // Token hết hạn sau 7 ngày

class AuthService {
    /**
     * Mã hóa mật khẩu bằng bcrypt
     * @param {string} password - Mật khẩu plain text
     * @returns {Promise<string>} Hash password
     */
    async hashPassword(password) {
        try {
            const salt = await bcrypt.genSalt(10); // 10 rounds
            const hashedPassword = await bcrypt.hash(password, salt);
            return hashedPassword;
        } catch (error) {
            logger.error('Hash password error:', error);
            throw new Error('Password hashing failed');
        }
    }

    /**
     * So sánh mật khẩu nhập vào với hash lưu trong DB
     * @param {string} password - Plain text password
     * @param {string} hashedPassword - Hash từ database
     * @returns {Promise<boolean>}
     */
    async comparePassword(password, hashedPassword) {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            logger.error('Compare password error:', error);
            return false;
        }
    }

    /**
     * Tạo JWT token
     * @param {number} userId - ID của user
     * @param {string} email - Email của user
     * @returns {string} JWT token
     */
    generateToken(userId, email) {
        try {
            const token = jwt.sign(
                {
                    userId: userId,
                    email: email,
                    iat: Math.floor(Date.now() / 1000), // Issued at
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRY }
            );
            return token;
        } catch (error) {
            logger.error('Generate token error:', error);
            throw new Error('Token generation failed');
        }
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token
     * @returns {object} Decoded token payload
     * @throws Error nếu token invalid hoặc expired
     */
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return decoded;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid token');
            }
            throw error;
        }
    }

    /**
     * Register user mới
     * @param {string} email
     * @param {string} password
     * @param {string} name
     * @returns {Promise<object>} User object (không bao gồm password)
     */
    async register(email, password, name) {
        try {
            // 1. Kiểm tra user đã tồn tại chưa
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                throw new Error('Email already registered');
            }

            // 2. Mã hóa mật khẩu
            const hashedPassword = await this.hashPassword(password);

            // 3. Tạo user mới
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true,
                },
            });

            logger.info(`User registered: ${email}`);
            return user;
        } catch (error) {
            logger.error('Register error:', error);
            throw error;
        }
    }

    /**
     * Login user
     * @param {string} email
     * @param {string} password
     * @returns {Promise<object>} { user, token }
     */
    async login(email, password) {
        try {
            // 1. Tìm user
            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                throw new Error('Invalid email or password');
            }

            // 2. So sánh password
            const passwordMatch = await this.comparePassword(password, user.password);

            if (!passwordMatch) {
                throw new Error('Invalid email or password');
            }

            // 3. Tạo token
            const token = this.generateToken(user.id, user.email);

            logger.info(`User logged in: ${email}`);

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                token,
            };
        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Refresh token (cấp token mới khi token cũ sắp hết hạn)
     * @param {string} oldToken - Token hiện tại
     * @returns {Promise<string>} Token mới
     */
    async refreshToken(oldToken) {
        try {
            // Verify token cũ (bỏ qua expiry check)
            const decoded = jwt.verify(oldToken, JWT_SECRET, {
                ignoreExpiration: true,
            });

            // Kiểm tra user vẫn tồn tại
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
            });

            if (!user || user.deletedAt) {
                throw new Error('User not found or deleted');
            }

            // Tạo token mới
            const newToken = this.generateToken(user.id, user.email);

            logger.info(`Token refreshed for user: ${user.email}`);

            return newToken;
        } catch (error) {
            logger.error('Refresh token error:', error);
            throw error;
        }
    }

    /**
     * Lấy user info từ token
     * @param {string} token
     * @returns {Promise<object>} User object
     */
    async getUserFromToken(token) {
        try {
            const decoded = this.verifyToken(token);

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    address: true,
                    createdAt: true,
                },
            });

            if (!user || user.deletedAt) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            logger.error('Get user from token error:', error);
            throw error;
        }
    }

    /**
     * Change password
     * @param {number} userId
     * @param {string} oldPassword
     * @param {string} newPassword
     * @returns {Promise<void>}
     */
    async changePassword(userId, oldPassword, newPassword) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Verify old password
            const passwordMatch = await this.comparePassword(
                oldPassword,
                user.password
            );

            if (!passwordMatch) {
                throw new Error('Current password is incorrect');
            }

            // Hash new password
            const hashedNewPassword = await this.hashPassword(newPassword);

            // Update password
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedNewPassword },
            });

            logger.info(`Password changed for user: ${user.email}`);
        } catch (error) {
            logger.error('Change password error:', error);
            throw error;
        }
    }

    /**
     * Quên mật khẩu - Tạo token và lưu vào DB
     * @param {string} email 
     * @returns {Promise<string>} Token nguyên bản (để gửi mail)
     */
    async forgotPassword(email) {
        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new Error('Email không tồn tại trong hệ thống');
            }

            // 1. Tạo token ngẫu nhiên
            const crypto = require('crypto');
            const resetToken = crypto.randomBytes(32).toString('hex');
            
            // 2. Mã hóa token trước khi lưu vào DB (để hacker có vào được DB cũng không lấy được token)
            const hashedToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            // 3. Lưu vào DB - Hết hạn sau 10 phút
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: hashedToken,
                    passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000)
                }
            });

            return resetToken;
        } catch (error) {
            logger.error('Forgot password service error:', error);
            throw error;
        }
    }

    /**
     * Đặt lại mật khẩu bằng Token
     * @param {string} token 
     * @param {string} newPassword 
     */
    async resetPassword(token, newPassword) {
        try {
            const crypto = require('crypto');
            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            // 1. Tìm user có token khớp và chưa hết hạn
            const user = await prisma.user.findFirst({
                where: {
                    passwordResetToken: hashedToken,
                    passwordResetExpires: { gt: new Date() }
                }
            });

            if (!user) {
                throw new Error('Mã khôi phục không hợp lệ hoặc đã hết hạn');
            }

            // 2. Cập nhật mật khẩu mới và xóa token cũ
            const hashedPassword = await this.hashPassword(newPassword);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    passwordResetToken: null,
                    passwordResetExpires: null
                }
            });

            return user;
        } catch (error) {
            logger.error('Reset password service error:', error);
            throw error;
        }
    }
}

module.exports = new AuthService();

/*
============================================
BCRYPT EXPLAINED:
============================================

1. TẠI SAO DÙNG BCRYPT?
   - MD5/SHA256: Hash nhanh → Attacker có thể brute force
   - Bcrypt: Hash chậm (100ms+) → Brute force khó
   
2. BCRYPT PROCESS:
   password = "MyPassword123"
   
   Round 1: Hash1 = bcrypt(password)
   Round 2: Hash2 = bcrypt(Hash1)
   ... (10 rounds)
   Round 10: Final Hash = bcrypt(Hash9)
   
   Kết quả: FinalHash sẽ khác nhau mỗi lần (do salt)
   
3. VERIFY:
   password = "MyPassword123"
   hash = "$2b$10$..." (từ DB)
   
   bcrypt.compare(password, hash)
   → Lặp lại 10 rounds → so sánh → true/false
   
4. ROUNDS VS PERFORMANCE:
   - 10 rounds = ~100ms (recommended)
   - 12 rounds = ~250ms (slower)
   - 8 rounds = ~50ms (less secure)
   
5. SALT:
   - Mỗi password hash → khác salt
   - "password123" hash 2 lần → 2 hash khác nhau
   - Prevent rainbow table attack

============================================
JWT EXPLAINED:
============================================

1. JWT STRUCTURE:
   header.payload.signature
   
   header: { alg: "HS256", typ: "JWT" }
   payload: { userId: 1, email: "user@test.com", exp: 12345 }
   signature: HMACSHA256(header + payload + secret)
   
2. TOKEN LIFETIME:
   - Tạo lúc 10:00 AM
   - Expires 7 days sau
   - Nếu user logout before 7 days → Token vẫn valid
   → Cần blacklist hoặc DB check
   
3. REFRESH TOKEN STRATEGY:
   - Access token: 1 hour (ngắn)
   - Refresh token: 7 days (dài)
   - User hết access token → gửi refresh token → cấp mới
   → Nếu bị hack access token, chỉ mất 1 hour

============================================
*/
