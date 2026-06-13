const amqp = require('amqplib');

let connection = null;
let channel = null;
//Kết nối đến RabbitMQ server
const connectRabbitMQ = async () => {
    try {
        const amqpServer = process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672';
        connection = await amqp.connect(amqpServer);
        channel = await connection.createChannel();
        console.log('RabbitMQ Connected Successfully');
        await setupQueues();

    } catch (error) {
        console.error('Lỗi kết nối RabbitMQ:', error);
        setTimeout(connectRabbitMQ, 5000);
    }
};

//Khởi tạo các hàng đợi (queues) sẽ được dùng trong hệ thống
const setupQueues = async () => {
    try {
        if (!channel) throw new Error('RabbitMQ channel chưa sẵn sàng');

        // Tạo hàng đợi xử lý đơn hàng (durable: true để không mất dữ liệu khi restart queue)
        await channel.assertQueue('order_processing_queue', { durable: true });
        console.log('Đã tạo/kiểm tra Queue: order_processing_queue');

    } catch (error) {
        console.error('Lỗi setup Queue:', error);
    }
}

//Lấy channel để push/consume dữ liệu
const getChannel = () => {
    if (!channel) throw new Error('RabbitMQ channel chưa được khởi tạo');
    return channel;
};

module.exports = {
    connectRabbitMQ,
    getChannel
};
