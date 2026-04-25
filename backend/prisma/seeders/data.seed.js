const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Đang xóa dữ liệu cũ... ---');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('--- Đang tạo dữ liệu mẫu... ---');

  // 1. Tạo User test
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Người dùng thử nghiệm',
      phone: '0987654321',
      address: 'Đại học Công nghệ thông tin'
    }
  });

  // 2. Tạo Category
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Điện tử' } }),
    prisma.category.create({ data: { name: 'Thời trang' } }),
    prisma.category.create({ data: { name: 'Gia dụng' } }),
    prisma.category.create({ data: { name: 'Sức khỏe & Làm đẹp' } }),
    prisma.category.create({ data: { name: 'Thể thao & Du lịch' } }),
    prisma.category.create({ data: { name: 'Sách & Văn phòng phẩm' } }),
  ]);

  const [catElec, catFashion, catHome, catBeauty, catSport, catBook] = categories;

  // 3. Tạo Sản phẩm Flash Sale (Số lượng nhiều hơn)
  const flashSaleProducts = await Promise.all([
    prisma.product.create({
      data: {
        name: 'iPhone 15 Pro Max 256GB',
        description: 'Flagship mới nhất từ Apple.',
        price: 28990000,
        originalPrice: 34990000,
        discount: 17,
        stock: 10,
        isFlashSale: true,
        flashSaleStart: new Date(),
        flashSaleEnd: new Date(Date.now() + 86400000),
        categoryId: catElec.id,
        location: 'TP. Hồ Chí Minh'
      }
    }),
    prisma.product.create({
      data: {
        name: 'Giày Chạy Bộ Nike Air Zoom',
        description: 'Êm ái, hỗ trợ phản hồi lực cực tốt.',
        price: 1800000,
        originalPrice: 3500000,
        discount: 48,
        stock: 20,
        isFlashSale: true,
        flashSaleStart: new Date(),
        flashSaleEnd: new Date(Date.now() + 86400000),
        categoryId: catSport.id,
        location: 'Hà Nội'
      }
    }),
    prisma.product.create({
      data: {
        name: 'Son Lì Black Rouge Ver 9',
        description: 'Màu sắc thời thượng, bám màu tốt.',
        price: 150000,
        originalPrice: 299000,
        discount: 50,
        stock: 100,
        isFlashSale: true,
        flashSaleStart: new Date(),
        flashSaleEnd: new Date(Date.now() + 43200000),
        categoryId: catBeauty.id,
        location: 'Đà Nẵng'
      }
    })
  ]);

  // 4. Khởi tạo Inventory cho sản phẩm Flash Sale
  for (const p of flashSaleProducts) {
    await prisma.inventory.create({
      data: {
        productId: p.id,
        availableStock: p.stock
      }
    });
  }

  // 5. Tạo 20 sản phẩm thường đa dạng
  const normalProductsData = [
    // Điện tử
    { name: 'MacBook Air M2', price: 24500000, categoryId: catElec.id, stock: 30, location: 'TP. HCM' },
    { name: 'Tai nghe Marshall Major IV', price: 3200000, categoryId: catElec.id, stock: 45, location: 'Hà Nội' },
    { name: 'Chuột Logitech G502', price: 1100000, categoryId: catElec.id, stock: 60, location: 'Đà Nẵng' },
    
    // Thời trang
    { name: 'Áo Hoodie Unisex', price: 350000, categoryId: catFashion.id, stock: 150, location: 'TP. HCM' },
    { name: 'Quần Jean ống rộng', price: 420000, categoryId: catFashion.id, stock: 120, location: 'Hà Nội' },
    { name: 'Túi xách nữ thời trang', price: 580000, categoryId: catFashion.id, stock: 80, location: 'TP. HCM' },
    
    // Gia dụng
    { name: 'Nồi chiên không dầu Philips', price: 3500000, categoryId: catHome.id, stock: 25, location: 'TP. HCM' },
    { name: 'Máy hút bụi cầm tay', price: 1200000, categoryId: catHome.id, stock: 40, location: 'Cần Thơ' },
    { name: 'Bộ nồi inox 5 món', price: 1800000, categoryId: catHome.id, stock: 50, location: 'Bình Dương' },
    
    // Sức khỏe & Làm đẹp
    { name: 'Kem chống nắng La Roche-Posay', price: 450000, categoryId: catBeauty.id, stock: 200, location: 'TP. HCM' },
    { name: 'Sữa rửa mặt Cetaphil 500ml', price: 320000, categoryId: catBeauty.id, stock: 180, location: 'Hà Nội' },
    { name: 'Máy rửa mặt Foreo Luna 3', price: 2800000, categoryId: catBeauty.id, stock: 15, location: 'TP. HCM' },

    // Thể thao
    { name: 'Thảm tập Yoga chống trượt', price: 250000, categoryId: catSport.id, stock: 100, location: 'TP. HCM' },
    { name: 'Vợt cầu lông Yonex', price: 1500000, categoryId: catSport.id, stock: 35, location: 'Hải Phòng' },
    
    // Sách
    { name: 'Sách: Đắc Nhân Tâm', price: 85000, categoryId: catBook.id, stock: 300, location: 'Hà Nội' },
    { name: 'Sách: Nhà Giả Kim', price: 79000, categoryId: catBook.id, stock: 250, location: 'TP. HCM' },
    { name: 'Combo Bút bi Thiên Long (20 cây)', price: 60000, categoryId: catBook.id, stock: 500, location: 'TP. HCM' }
  ];

  await prisma.product.createMany({ data: normalProductsData });

  console.log('--- SEEDING HOÀN TẤT ---');
  console.log(`Đã tạo: ${categories.length} danh mục, ${flashSaleProducts.length} SP Flash Sale, ${normalProductsData.length} SP thường.`);
  console.log('Tài khoản test: test@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
