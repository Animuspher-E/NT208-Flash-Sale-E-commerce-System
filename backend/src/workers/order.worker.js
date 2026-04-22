const rabbitMQ = require('../utils/rabbitmq');
const prisma = require('../config/database');
const logger = require('../utils/logger');
// const { getRedisClient } = require('../config/redis');

const startWorker = async () => {
    try {
        const channel = rabbitMQ.getChannel();
        const queueName = 'order_processing_queue';
        
        // Mỗi lần Worker chỉ lấy 1 message để xử lý (tránh overload DB)
        channel.prefetch(1);
        
        console.log(`[Worker] Khởi động: Lắng nghe queue '${queueName}'...`);
        
        channel.consume(queueName, async (msg) => {
            if (msg !== null) {
                const orderData = JSON.parse(msg.content.toString());
                const { userId, productId, quantity } = orderData;
                
                logger.info(`[Worker] Nhận đơn hàng: User=${userId}, Product=${productId}, Qty=${quantity}`);
                
                try {
                    // ========================================
                    // XỬ LÝ LƯU DATABASE TỪ TỐN Ở ĐÂY
                    // ========================================
                    await handleOrderCreation(userId, productId, quantity);
                    
                    // Thành công -> Báo cho RabbitMQ là đã xử lý xong tin nhắn này.
                    channel.ack(msg);
                    logger.info(`[Worker] Xử lý THÀNH CÔNG đơn User=${userId}`);
                    
                } catch (error) {
                    logger.error(`[Worker] LỖI xử lý đơn User=${userId}: ${error.message}`);
                    
                    // TODO: NẾU THẤT BẠI CẦN ROLLBACK TỒN KHO TRÊN REDIS (nếu logic DB lỗi)
                    // const redisClient = getRedisClient();
                    // await redisClient.incrby(`inventory:${productId}`, quantity);
                    
                    // Tùy nghiệp vụ: requeue false để bỏ qua lun, đổi thành true để rabbitMQ phát lại
                    channel.nack(msg, false, false); 
                }
            }
        });
    } catch (error) {
        console.error('[Worker] Lỗi khởi động worker:', error);
    }
};

const handleOrderCreation = async (userId, productId, quantity) => {
    // Transaction an toàn trên MySQL
    const newOrder = await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error('PRODUCT_NOT_FOUND');
        
        const orderNumber = `ORD-${Date.now()}-${userId}`;
        const subtotal = product.price * quantity;
        
        const order = await tx.order.create({
            data: {
                userId,
                orderNumber,
                totalPrice: subtotal,
                discountAmount: 0,
                finalPrice: subtotal,
                status: 'pending',
                paymentStatus: 'unpaid',
                shippingStatus: 'pending',
                items: {
                    create: [{
                        productId, quantity, unitPrice: product.price, subtotal
                    }]
                }
            },
            include: { items: true }
        });
        
        // Trừ tồn kho trong DB (vì lúc lưu thành công vào Queue coi như đã chốt đơn)
        await tx.product.update({
            where: { id: productId },
            data: { stock: { decrement: quantity } }
        });
        
        // Update Inventory if exists
        const inv = await tx.inventory.findFirst({ where: { productId } });
        if (inv) {
            await tx.inventory.update({
                where: { productId },
                data: { availableStock: { decrement: quantity }, reservedStock: { increment: quantity } }
            });
        }
        
        return order;
    });
    
    // Phát Socket event cho Frontend để báo user là đơn hàng đã hoàn tất
    try {
        const io = require('../config/socket').getIO();
        const updatedProduct = await prisma.product.findUnique({ where: { id: productId } });
        if (updatedProduct) {
             const inventoryPercent = (updatedProduct.stock / 1000) * 100;
             io.emit('product:inventory-updated', {
                 productId,
                 stock: updatedProduct.stock,
                 percent: inventoryPercent,
             });
        }
    } catch (socketErr) {}
    
    return newOrder;
};

module.exports = { startWorker };
