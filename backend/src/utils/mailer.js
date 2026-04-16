const nodemailer = require('nodemailer');

/**
 * Utility để gửi email
 * Cấu hình được lấy từ file .env
 */
const sendEmail = async (options) => {
    // 1. Tạo transporter (Người gửi)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // 2. Định nghĩa nội dung email
    const mailOptions = {
        from: `FlashSale System <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    // 3. Thực hiện gửi
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
