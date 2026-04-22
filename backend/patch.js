const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/order.service.js');
let content = fs.readFileSync(filePath, 'utf8');

const startStr = '    async buyProduct(userId, productId, quantity) {';
const endStr = "throw new Error('Failed to create order');\n        }\n    }";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr) + endStr.length;

if (startIdx === -1 || endIdx === -1 || endIdx <= startStr) {
    console.error('Cannot find block to replace', {startIdx, endIdx});
    process.exit(1);
}

const newFunc = `    async buyProduct(userId, productId, quantity) {
        try {
            const { getRedisClient } = require('../config/redis');
            const redisClient = getRedisClient();
            const rabbitMQ = require('../utils/rabbitmq');
            
            // 1. Dùng Redis để chặn số lượng mua vượt tồn kho (Atomic Decrement)
            const currentStock = await redisClient.decrby(\`inventory:\${productId}\`, quantity);
            
            if (currentStock < 0) {
                // Hết hàng -> phục hồi lại tồn kho trên Redis
                await redisClient.incrby(\`inventory:\${productId}\`, quantity);
                throw new Error('OUT_OF_STOCK');
            }
            
            // 2. Tồn kho cho phép -> Ném tiếp vào RabbitMQ Queue
            const orderData = {
                userId,
                productId,
                quantity,
                timestamp: Date.now()
            };
            
            const channel = rabbitMQ.getChannel();
            channel.sendToQueue(
                'order_processing_queue',
                Buffer.from(JSON.stringify(orderData)),
                { persistent: true }
            );
            
            require('../utils/logger').info(\`Đã xếp hàng chờ xử lý đơn của User: \${userId} | Product: \${productId}\`);

            try {
                await redisClient.incrby(\`sales:\${productId}:\${new Date().toISOString().split('T')[0]}\`, quantity);
            } catch(e) {}
            
            return {
                status: 'processing',
                message: 'Đơn hàng đang chờ xử lý ngầm'
            };
            
        } catch (error) {
             require('../utils/logger').error(\`Order request failed: \${error.message}\`);
             if (error.message === 'OUT_OF_STOCK') {
                 throw new Error('Rất tiếc, sản phẩm đã hết hàng!');
             }
             throw error;
        }
    }`;

content = content.substring(0, startIdx) + newFunc + content.substring(endIdx);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched buyProduct function successfully.');
