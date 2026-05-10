// ================================================
// File: src/services/user.service.js
// Mục đích: Xử lý business logic cho User
//   - Lấy profile user
//   - Cập nhật profile
//   - Lấy danh sách orders
//   - Lấy chi tiết 1 order
//   - Lấy statistics
// ================================================

const prisma = require('../config/database');
const logger = require('../config/logger');

class UserService {
    /**
     * Lấy profile user từ database
     * @param {number} userId
     * @returns {Promise<object>} User object (không bao gồm password)
     */
    async getUserProfile(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    address: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (!user) {
                throw new Error('USER_NOT_FOUND');
            }

            return user;
        } catch (error) {
            logger.error('Get user profile error:', error.message);
            throw error;
        }
    }

    /**
     * Cập nhật profile user
     * @param {number} userId
     * @param {object} updateData { name, phone, address }
     * @returns {Promise<object>} Updated user object
     */
    async updateUserProfile(userId, updateData) {
        try {
            const user = await prisma.user.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    address: true,
                    updatedAt: true,
                },
            });

            return user;
        } catch (error) {
            if (error.code === 'P2025') {
                throw new Error('USER_NOT_FOUND');
            }
            logger.error('Update user profile error:', error.message);
            throw error;
        }
    }

    /**
     * Lấy danh sách orders của user với pagination
     * @param {number} userId
     * @param {object} options { page, limit, status }
     * @returns {Promise<object>} { orders, total, page, limit, totalPages }
     */
    async getOrders(userId, options = {}) {
        try {
            const page = options.page || 1;
            const limit = options.limit || 10;
            const status = options.status || null;
            const skip = (page - 1) * limit;

            const whereClause = {
                userId: userId,
                ...(status && { status: status }),
            };

            const [orders, total] = await Promise.all([
                prisma.order.findMany({
                    where: whereClause,
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        price: true,
                                        image: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: skip,
                    take: limit,
                }),
                prisma.order.count({ where: whereClause }),
            ]);

            return {
                orders,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        } catch (error) {
            logger.error('Get user orders error:', error.message);
            throw error;
        }
    }

    /**
     * Lấy chi tiết 1 order của user
     * @param {number} orderId
     * @param {number} userId - Để verify order thuộc user này
     * @returns {Promise<object>} Order details
     */
    async getOrderDetail(orderId, userId) {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true,
                                    image: true,
                                    description: true,
                                },
                            },
                        },
                    },
                    payments: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
            });

            if (!order) {
                throw new Error('ORDER_NOT_FOUND');
            }

            // Kiểm tra order thuộc user này
            if (order.userId !== userId) {
                throw new Error('UNAUTHORIZED');
            }

            return order;
        } catch (error) {
            logger.error('Get order detail error:', error.message);
            throw error;
        }
    }

    /**
     * Lấy thống kê của user
     * @param {number} userId
     * @returns {Promise<object>} { totalOrders, totalSpent, completedOrders, pendingOrders }
     */
    async getUserStatistics(userId) {
        try {
            const [orders, totalSpent] = await Promise.all([
                prisma.order.findMany({
                    where: { userId: userId },
                    select: {
                        id: true,
                        status: true,
                        finalPrice: true,
                    },
                }),
                prisma.order.aggregate({
                    where: { userId: userId, status: 'completed' },
                    _sum: { finalPrice: true },
                }),
            ]);

            const stats = {
                totalOrders: orders.length,
                totalSpent: totalSpent._sum.finalPrice || 0,
                completedOrders: orders.filter(o => o.status === 'completed').length,
                pendingOrders: orders.filter(o => o.status === 'pending').length,
                cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
            };

            return stats;
        } catch (error) {
            logger.error('Get user statistics error:', error.message);
            throw error;
        }
    }
}

module.exports = new UserService();
