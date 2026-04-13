
// Khởi tạo Prisma Client với Connection Pool config
// Đảm bảo MySQL không sập khi concurrent users cao

const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
    // Production: Cần cấu hình connection pool cẩn thận
    prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
        log: ['warn', 'error'],
    });
} else {
    // Development: Log mọi query để debug
    if (!global.prisma) {
        global.prisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
            log: [
                {
                    emit: 'event',
                    level: 'query',
                },
                {
                    emit: 'stdout',
                    level: 'error',
                },
                {
                    emit: 'stdout',
                    level: 'warn',
                },
            ],
        });

        // Log queries trong development
        global.prisma.$on('query', (e) => {
            console.log('Query: ' + e.query);
            console.log('Duration: ' + e.duration + 'ms');
        });
    }
    prisma = global.prisma;
}

// Handle Prisma graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

module.exports = prisma;

/*
============================================
CONNECTION POOL CONFIG EXPLAINED:
============================================

1. DEFAULT CONNECTION POOL:
   - Tối đa 10 connections
   - Tối thiểu 2 connections
   - Connection lifetime: 8 hours
   
2. NẾU CẦN ĐIỀU CHỈNH:
   Thêm vào DATABASE_URL:
   
   mysql://user:password@localhost:3306/dbname?pool_size=20
   
   - pool_size=20: Tối đa 20 kết nối đồng thời
   - connection_limit=30: Limit của server
   
3. PERFORMANCE TUNING:
   - Flash sale có 10k concurrent users?
     → pool_size cần 20-30
   - Server RAM? Mỗi connection ~5-10MB
   → 30 connections = 150-300MB
   
4. MONITORING:
   - Kiểm tra MySQL: SHOW PROCESSLIST;
   - Nếu quá nhiều "waiting for lock" → pool size nhỏ
   - Nếu MySQL memory cao → pool size lớn quá

============================================
*/
