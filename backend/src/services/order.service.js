// Xử lý đặt hàng với atomic transactions để tránh Over-selling
// Đảm bảo Database + Redis sync hoặc rollback

const prisma = require('../config/database');
const redis = require('../config/redis');
const logger = require('../config/logger');

class OrderService {
    /**
     * ⚠️ CORE FUNCTION: Mua sản phẩm (Flash Sale)
     * Sử dụng prisma.$transaction để ATOMIC xử lý:
     * 1. Check tồn kho
     * 2. Tạo order
     * 3. Trừ tồn kho
     *
     * Nếu bất kỳ bước nào fail → TOÀN BỘ ROLLBACK
     * Không có Over-selling!
     *
     * @param {number} userId
     * @param {number} productId
     * @param {number} quantity
     * @param {string} shippingAddress
     * @returns {Promise<object>} Order object
     * @throws Error nếu out of stock hoặc DB error
     */
    async buyProduct(userId, productId, quantity, shippingAddress = null) {
        let order = null;
        let redisRollbackNeeded = false;

        try {
            // ========================================
            // TRANSACTION: Check + Create + Update
            // ========================================
            order = await prisma.$transaction(
                async (tx) => {
                    // 1️⃣ LOCK PRODUCT ROW - Lấy lock để không ai khác modify
                    const product = await tx.product.findUnique({
                        where: { id: productId },
                    });

                    if (!product) {
                        throw new Error('PRODUCT_NOT_FOUND');
                    }

                    // 2️⃣ CHECK STOCK - Kiểm tra tồn kho đủ không
                    if (product.stock < quantity) {
                        throw new Error(
                            `OUT_OF_STOCK: Only ${product.stock} items available`
                        );
                    }

                    // 3️⃣ KIỂM TRA USER - User có tồn tại không
                    const user = await tx.user.findUnique({
                        where: { id: userId },
                    });

                    if (!user) {
                        throw new Error('USER_NOT_FOUND');
                    }

                    // 4️⃣ CREATE ORDER - Tạo đơn hàng
                    const orderNumber = `ORD-${Date.now()}-${userId}`;
                    const subtotal = product.price * quantity;
                    const discountPercent = product.discount || 0;
                    const discountAmount = subtotal * (discountPercent / 100);
                    const finalPrice = subtotal - discountAmount;

                    const newOrder = await tx.order.create({
                        data: {
                            userId,
                            orderNumber,
                            totalPrice: subtotal,
                            discountAmount,
                            finalPrice,
                            status: 'pending',
                            paymentStatus: 'unpaid',
                            shippingStatus: 'pending',
                            shippingAddress: shippingAddress,
                            items: {
                                create: [
                                    {
                                        productId,
                                        quantity,
                                        unitPrice: product.price,
                                        subtotal: subtotal,
                                    },
                                ],
                            },
                        },
                        include: {
                            items: true,
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    name: true,
                                },
                            },
                        },
                    });

                    // 5️⃣ DECREMENT STOCK - Trừ tồn kho NGAY LẬP TỨC
                    // NẾU CÓ 2 USER CÙNG ORDER:
                    // USER A: Check stock = 5 ✓
                    // USER B: Check stock = 5 ✓
                    // [TRANSACTION BARRIER] ← Chỉ 1 người qua được
                    // USER A: Trừ 5 → stock = 0
                    // USER B: Trừ 5 → stock = -5 (ERROR! ROLLBACK)
                    await tx.product.update({
                        where: { id: productId },
                        data: {
                            stock: {
                                decrement: quantity,
                            },
                        },
                    });

                    // 6️⃣ UPDATE INVENTORY - Cập nhật bảng Inventory (nếu có)
                    const inv = await tx.inventory.findFirst({ where: { productId } });
                    if (inv) {
                        await tx.inventory.update({
                            where: { productId },
                            data: {
                                availableStock: {
                                    decrement: quantity,
                                },
                                reservedStock: {
                                    increment: quantity,
                                },
                            },
                        });
                    }

                    logger.info(
                        `Order created: ${orderNumber} | User: ${userId} | Product: ${productId} | Qty: ${quantity}`
                    );

                    return newOrder;
                },
                {
                    isolationLevel: 'Serializable', // Mức cao nhất để tránh race condition
                    maxWait: 5000, // Chờ tối đa 5s
                    timeout: 10000, // Transaction timeout 10s
                }
            );

            // ========================================
            // TRANSACTION THÀNH CÔNG → Cập nhật Redis
            // ========================================
            // ⚠️ Nếu Redis fail → Log error nhưng đừng throw
            // Vì Database đã updated, mất tính sync là chấp nhận được
            try {
                await redis.decr(`inventory:${productId}`);
                await redis.incr(`sales:${productId}:${new Date().toISOString().split('T')[0]}`); // Thống kê sales hôm nay
            } catch (redisError) {
                logger.error(`Redis update failed for product ${productId}:`, redisError);
                // Không throw - Database là source of truth
            }

            // ========================================
            // PUBLISH SOCKET EVENT - Cập nhật realtime %
            // ========================================
            try {
                const io = require('../config/socket').getIO();
                const updatedProduct = await prisma.product.findUnique({
                    where: { id: productId },
                });
                const inventoryPercent = (updatedProduct.stock / 1000) * 100; // Giả sử 1000 là max

                io.emit('product:inventory-updated', {
                    productId,
                    stock: updatedProduct.stock,
                    percent: inventoryPercent,
                });
            } catch (socketError) {
                logger.error('Socket emit failed:', socketError);
            }

            return {
                success: true,
                order: {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    finalPrice: order.finalPrice,
                    items: order.items,
                },
            };
        } catch (error) {
            // ========================================
            // ⚠️ TRANSACTION FAILED → ROLLBACK
            // ========================================
            logger.error(`Order creation failed: ${error.message}`, {
                userId,
                productId,
                quantity,
            });

            // Nếu error là Prisma transaction error
            if (error.code === 'P2034') {
                // Serialization conflict - xảy ra khi 2 transaction cùng modify
                throw new Error('Stock updated by another user. Please try again.');
            }

            if (error.message.includes('OUT_OF_STOCK')) {
                throw new Error(error.message);
            }

            if (error.message.includes('NOT_FOUND')) {
                throw new Error('Invalid product or user');
            }

            throw new Error('Failed to create order');
        }
    }

    async buyMultipleProducts(userId, items, shippingAddress = null) {
        let order = null;
        try {
            order = await prisma.$transaction(
                async (tx) => {
                    const user = await tx.user.findUnique({ where: { id: userId } });
                    if (!user) throw new Error('USER_NOT_FOUND');

                    const orderNumber = `ORD-${Date.now()}-${userId}`;
                    let totalSubtotal = 0;
                    let totalDiscount = 0;
                    const orderItemsData = [];

                    for (const item of items) {
                        const product = await tx.product.findUnique({ where: { id: item.productId } });
                        if (!product) throw new Error(`PRODUCT_NOT_FOUND: ${item.productId}`);
                        if (product.stock < item.quantity) {
                            throw new Error(`OUT_OF_STOCK: ${product.name}`);
                        }

                        const subtotal = product.price * item.quantity;
                        const discountPercent = product.discount || 0;
                        const discountAmount = subtotal * (discountPercent / 100);

                        totalSubtotal += subtotal;
                        totalDiscount += discountAmount;

                        orderItemsData.push({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: product.price,
                            subtotal: subtotal
                        });

                        await tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { decrement: item.quantity } }
                        });

                        const inv = await tx.inventory.findFirst({ where: { productId: item.productId } });
                        if (inv) {
                            await tx.inventory.update({
                                where: { productId: item.productId },
                                data: {
                                    availableStock: { decrement: item.quantity },
                                    reservedStock: { increment: item.quantity }
                                }
                            });
                        }
                    }

                    const newOrder = await tx.order.create({
                        data: {
                            userId,
                            orderNumber,
                            totalPrice: totalSubtotal,
                            discountAmount: totalDiscount,
                            finalPrice: totalSubtotal - totalDiscount,
                            status: 'pending',
                            paymentStatus: 'unpaid',
                            shippingStatus: 'pending',
                            shippingAddress: shippingAddress,
                            items: {
                                create: orderItemsData
                            }
                        },
                        include: { items: true, user: { select: { id: true, email: true, name: true } } }
                    });

                    return newOrder;
                },
                { isolationLevel: 'Serializable', maxWait: 5000, timeout: 10000 }
            );

            // Update redis stats
            for (const item of items) {
                try {
                    await redis.decr(`inventory:${item.productId}`);
                    await redis.incr(`sales:${item.productId}:${new Date().toISOString().split('T')[0]}`);
                } catch (e) {}
                
                try {
                    const io = require('../config/socket').getIO();
                    const updatedProduct = await prisma.product.findUnique({ where: { id: item.productId } });
                    const inventoryPercent = (updatedProduct.stock / 1000) * 100;
                    io.emit('product:inventory-updated', {
                        productId: item.productId,
                        stock: updatedProduct.stock,
                        percent: inventoryPercent,
                    });
                } catch (e) {}
            }

            return { success: true, order };
        } catch (error) {
            logger.error(`Multiple products order creation failed: ${error.message}`, { userId, items });
            throw error;
        }
    }

    /**
     * Get order history của user
     * @param {number} userId
     * @param {object} options { page, limit, status }
     * @returns {Promise<object>} { orders, total, page, limit }
     */
    async getUserOrders(userId, options = {}) {
        try {
            const { page = 1, limit = 10, status } = options;
            const skip = (page - 1) * limit;

            const where = { userId };
            if (status) {
                where.status = status;
            }

            const [orders, total] = await Promise.all([
                prisma.order.findMany({
                    where,
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
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
                prisma.order.count({ where }),
            ]);

            return {
                orders,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        } catch (error) {
            logger.error('Get user orders error:', error);
            throw error;
        }
    }

    /**
     * Get order detail
     * @param {number} orderId
     * @param {number} userId - Để verify ownership
     * @returns {Promise<object>}
     */
    async getOrderDetail(orderId, userId) {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    payments: true,
                },
            });

            if (!order) {
                throw new Error('Order not found');
            }

            // Verify ownership
            if (order.userId !== userId) {
                throw new Error('Unauthorized');
            }

            return order;
        } catch (error) {
            logger.error('Get order detail error:', error);
            throw error;
        }
    }

    /**
     * Cancel order
     * @param {number} orderId
     * @param {number} userId
     * @returns {Promise<object>}
     */
    async cancelOrder(orderId, userId) {
        try {
            // 1. Verify order exists & belongs to user
            const order = await prisma.order.findUnique({
                where: { id: orderId },
            });

            if (!order) {
                throw new Error('Order not found');
            }

            if (order.userId !== userId) {
                throw new Error('Unauthorized');
            }

            if (order.status !== 'pending') {
                throw new Error('Can only cancel pending orders');
            }

            // 2. Transaction: Update order + Restore stock
            const updatedOrder = await prisma.$transaction(async (tx) => {
                // Get order items
                const orderItems = await tx.orderItem.findMany({
                    where: { orderId },
                });

                // Restore stock for each item
                for (const item of orderItems) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                increment: item.quantity,
                            },
                        },
                    });

                    // Update inventory if it exists
                    const inventoryExists = await tx.inventory.findFirst({
                        where: { productId: item.productId }
                    });
                    if (inventoryExists) {
                        await tx.inventory.update({
                            where: { productId: item.productId },
                            data: {
                                availableStock: {
                                    increment: item.quantity,
                                },
                                reservedStock: {
                                    decrement: item.quantity,
                                },
                            },
                        });
                    }
                }

                // Update order status
                return await tx.order.update({
                    where: { id: orderId },
                    data: {
                        status: 'cancelled',
                    },
                    include: {
                        items: true,
                    },
                });
            });

            const flashsaleService = require('./flashsale.service');
            for (const item of updatedOrder.items) {
                await flashsaleService.rollbackStock(
                    item.productId,
                    userId,
                    item.quantity
                );
            }

            logger.info(`Order cancelled: ${orderId}`);

            return updatedOrder;
        } catch (error) {
            logger.error('Cancel order error:', error);
            throw error;
        }
    }

    /**
     * Confirm payment (Admin API)
     * @param {number} orderId
     * @returns {Promise<object>}
     */
    async confirmPayment(orderId) {
        try {
            const order = await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'paid',
                    status: 'confirmed',
                },
            });

            logger.info(`Payment confirmed for order: ${orderId}`);

            return order;
        } catch (error) {
            logger.error('Confirm payment error:', error);
            throw error;
        }
    }
}

module.exports = new OrderService();

/*
============================================
PRISMA TRANSACTION EXPLAINED:
============================================

1. LẠI CẬU "Transaction" LÀ GÌ?
   Transaction = Một loạt database operations
   Hoặc TẤT CẢ thành công, hoặc TẤT CẢ fail & rollback
   
2. VÍ DỤ KHÔNG TRANSACTION:
   Step 1: Check stock = 5 ✓
   Step 2: Create order ✓
   [SYSTEM CRASH]
   Step 3: Decrement stock (không chạy)
   → THẢM HỌA: Order tạo nhưng stock không trừ!
   
3. VỚI TRANSACTION:
   Step 1: Check stock = 5 ✓
   Step 2: Create order ✓
   [SYSTEM CRASH]
   → Tự động ROLLBACK: Order không tạo
   
4. ISOLATION LEVEL:
   - READ_UNCOMMITTED: Dirty reads (không nên dùng)
   - READ_COMMITTED: Default
   - REPEATABLE_READ: Repeat queries = same result
   - SERIALIZABLE: Mỗi transaction xử lý riêng (chậm nhưng safe)
   
5. FLASH SALE SCENARIO:
   10,000 users click "buy" cùng lúc
   
   Nếu không Serializable:
   User A & B cùng check stock = 1
   A tạo order → stock = 0
   B tạo order → stock = -1 (BUG!)
   
   Với Serializable:
   Chỉ 1 trong 2 thực hiện, 1 cái fail → Retry

============================================
*/
