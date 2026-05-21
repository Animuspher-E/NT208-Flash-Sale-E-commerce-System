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
  
  // Tài khoản User thường
  await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Người dùng thử nghiệm',
      phone: '0987654321',
      address: 'Đại học Công nghệ thông tin',
      role: 'user'
    }
  });

  // Tài khoản Admin
  await prisma.user.create({
    data: {
      email: 'admin@flashsale.com',
      password: hashedPassword,
      name: 'Quản trị viên',
      phone: '0123456789',
      address: 'Văn phòng FlashSale',
      role: 'admin'
    }
  });

  // Thêm các user phụ để viết đánh giá
  const userA = await prisma.user.create({
    data: {
      email: 'usera@example.com',
      password: hashedPassword,
      name: 'Nguyễn Văn A',
      phone: '0911111111',
      address: 'Hà Nội',
      role: 'user',
      avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=random'
    }
  });

  const userB = await prisma.user.create({
    data: {
      email: 'userb@example.com',
      password: hashedPassword,
      name: 'Trần Thị B',
      phone: '0922222222',
      address: 'Đà Nẵng',
      role: 'user',
      avatar: 'https://ui-avatars.com/api/?name=Tran+Thi+B&background=random'
    }
  });

  const userC = await prisma.user.create({
    data: {
      email: 'userc@example.com',
      password: hashedPassword,
      name: 'Lê Văn C',
      phone: '0933333333',
      address: 'TP. Hồ Chí Minh',
      role: 'user',
      avatar: 'https://ui-avatars.com/api/?name=Le+Van+C&background=random'
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
        name: 'Giày Chạy Bộ Nike Air Zoom',
        description: 'Êm ái, hỗ trợ phản hồi lực cực tốt cho vận động viên.',
        price: 1800000,
        originalPrice: 3500000,
        discount: 48,
        stock: 20,
        isFlashSale: true,
        flashSaleStart: new Date(),
        flashSaleEnd: new Date(Date.now() + 86400000),
        categoryId: catSport.id,
        location: 'Hà Nội',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop'
      }
    }),
    prisma.product.create({
      data: {
        name: 'Son Lì Black Rouge Ver 9',
        description: 'Màu sắc thời thượng, bám màu tốt và mềm môi.',
        price: 150000,
        originalPrice: 299000,
        discount: 50,
        stock: 100,
        isFlashSale: true,
        flashSaleStart: new Date(),
        flashSaleEnd: new Date(Date.now() + 43200000),
        categoryId: catBeauty.id,
        location: 'Đà Nẵng',
        image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=600&auto=format&fit=crop'
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
    { name: 'MacBook Air M2', price: 24500000, categoryId: catElec.id, stock: 30, location: 'TP. HCM', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format&fit=crop' },
    { name: 'Tai nghe Marshall Major IV', price: 3200000, categoryId: catElec.id, stock: 45, location: 'Hà Nội', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop' },
    { name: 'Chuột Logitech G502', price: 1100000, categoryId: catElec.id, stock: 60, location: 'Đà Nẵng', image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=600&auto=format&fit=crop' },
    
    // Thời trang
    { name: 'Áo Hoodie Unisex', price: 350000, categoryId: catFashion.id, stock: 150, location: 'TP. HCM', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop' },
    { name: 'Quần Jean ống rộng', price: 420000, categoryId: catFashion.id, stock: 120, location: 'Hà Nội', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop' },
    { name: 'Túi xách nữ thời trang', price: 580000, categoryId: catFashion.id, stock: 80, location: 'TP. HCM', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop' },
    { name: 'Anh Trai "Say Hi" Washed T-Shirt (Áo Wash)', price: 469000, categoryId: catFashion.id, stock: 200, location: 'TP. Hồ Chí Minh', image: 'https://cdn.hstatic.net/products/200000225139/z7276319837797_b26aa9cf8472652c94e2aa1e9b02cf8d_3b4865562f0f44a690d2b87db67997a6_grande.jpg' },
    { name: 'Áo Thun Trắng T1 Keria Chính Hãng', price: 1500000, categoryId: catFashion.id, stock: 15, location: 'Quốc Tế', image: 'https://shop-t1-na.gg/cdn/shop/files/keria-front_1024x.jpg?v=1719006601' },
    { name: '2025 T1 Uniform Jersey LOL', price: 2300000, categoryId: catFashion.id, stock: 200, location: 'Quốc Tế', image: 'https://acecookvietnam.vn/wp/wp-content/uploads/2025/10/SIUKAY-TO-HAI-SAN-scaled.png' },
    { name: 'Áo Khoác Jean Nam Trắng Tay Dài', price: 320000, categoryId: catFashion.id, stock: 250, location: 'Phú Thọ', image: 'https://dienthoaigiakho.vn/tin-cong-nghe/wp-content/uploads/2025/12/hinh-nen-son-k.3.jpg' },
    { name: 'Khăn Twilly I DO "SAY HI"', price: 179000, discount: 18, categoryId: catFashion.id, stock: 400, location: 'TP. Hồ Chí Minh', image: 'https://cdn.hstatic.net/products/200000225139/6480_0b0c35d4775b65021bd2e027e8e9e484_59ee7aebb4434bc2af0cd210e553d53e_9c1e45381e084be2890486c4b444e407_grande.jpg' },
    { name: 'T1 2024 Worlds Jacket Áo Khoác Thi Đấu', price: 4300000, discount: 18, categoryId: catFashion.id, stock: 200, location: 'TP. Hồ Chí Minh', image: 'https://www.paragonjackets.com/wp-content/uploads/2024/09/2024-T1-Worlds-Uniform-White-Hooded-Jacket.jpg' },

    // Gia dụng
    { name: 'Máy hút bụi cầm tay', price: 1200000, categoryId: catHome.id, stock: 40, location: 'Cần Thơ', image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=600&auto=format&fit=crop' },
    
    // Sức khỏe & Làm đẹp
    { name: 'Kem chống nắng La Roche-Posay', price: 450000, categoryId: catBeauty.id, stock: 200, location: 'TP. HCM', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop' },
    { name: "Kem dưỡng sáng da L'Oreal White Perfect Day Cream", price: 250000, categoryId: catBeauty.id, stock: 50, location: 'TP. Hồ Chí Minh', image: 'https://image.hsv-tech.io/1987x0/bbx/products/44467b6c-6480-41ec-8ea4-93f948ff94e3.webp' },

    // Thể thao
    
    // Sách
    { name: 'Sách: Đắc Nhân Tâm', price: 85000, categoryId: catBook.id, stock: 300, location: 'Hà Nội', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop' },
    { name: 'Sách: Nhà Giả Kim', price: 79000, categoryId: catBook.id, stock: 250, location: 'TP. HCM', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop' },
    { name: 'Đĩa Nhạc She Never Cries - Sơn.K', price: 390000, categoryId: catBook.id, stock: 147, location: 'Phú Thọ', image: 'https://i.scdn.co/image/ab6761610000e5ebd6a9d480f0fb62f6af12f572' },
    { name: 'Sách - Trọn bộ Harry Potter bản tiếng Anh (7 quyển)', price: 1090000, categoryId: catBook.id, stock: 20, location: 'TP. Hồ Chí Minh', image: 'https://nativex.edu.vn/wp-content/uploads/2023/11/gioi-thieu-tron-bo-harry-potter.jpg' },
    { name: 'Set card bo góc anh trai Sơn.K', price: 20000, categoryId: catBook.id, stock: 20, location: 'Lâm Đồng', image: 'https://down-vn.img.susercontent.com/file/vn-11134207-820l4-mfo4yx0qbeh669' },
    { name: 'Sách Ảnh Hello Future (Xin Chào Tương Lai) - NCT DREAM', price: 380000, categoryId: catBook.id, stock: 258, location: 'Kon Tum', image: 'https://pos.nvncdn.com/6bea12-26155/ps/20210703_NqRvX3ry8bVftilHn1ZXwhCU.jpg?v=1673979070' },
    { name: 'Móc khoá Nick Wilde Zootopia Disney', price: 25000, categoryId: catBook.id, stock: 150, location: 'Ninh Thuận', image: 'https://down-vn.img.susercontent.com/file/cn-11134207-820l4-mhfyp0dlfr4b7a' },
    { name: 'NCT DREAM x PINKFONG - Sticker hình dán NCT-REX [HAECHAN ver.]', price: 329000, categoryId: catBook.id, stock: 35, location: 'Hải Phòng', image: 'https://blog.delivered.co.kr/wp-content/uploads/2021/08/NCTDREAM-PINKFONG-4.jpg' },
    { name: 'Nhật Ký Tình Yêu Between Us Scrapbook Handmade', price: 220000, categoryId: catBook.id, stock: 300, location: 'Đà Nẵng', image: 'https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lsmkaxng7xcpdb' },
    { name: 'T1 Membership HAPPY KERIA DAY 2023', price: 2500000, categoryId: catBook.id, stock: 50, location: 'Long An', image: 'https://i.ebayimg.com/images/g/9c8AAOSwSvxmFI1o/s-l400.jpg' },
    { name: 'NCT DREAM x PINKFONG - LOCAMOBILITY CARD [RENJUN ver.]', price: 530000, discount: 15, categoryId: catBook.id, stock: 323, location: 'Huế', image: 'https://www.musicplaza.com/cdn/shop/products/runjun.jpg?v=1661932739' },
    { name: 'Keychain Móc Khoá T1 FAKER LCK LOL K24', price: 350000, discount: 15, categoryId: catBook.id, stock: 20, location: 'Hà Nội', image: 'https://i.ebayimg.com/images/g/d-0AAeSwMOppCw7H/s-l400.jpg' },
    { name: 'buitruonglinh - 1st Album [Từng Ngày Như Mãi Mãi]', price: 469000, discount: 15, categoryId: catBook.id, stock: 350, location: 'Hà Nội', image: 'https://cdn.hstatic.net/products/200001039392/poster_1x1_2_54dbc9cb1b1b4130b829916ff608ba11_grande.jpg' },
    { name: 'Móc khoá mèo máy Doraemon', price: 50000, discount: 15, categoryId: catBook.id, stock: 200, location: 'Cần Thơ', image: 'https://jola.vn/Product/g4qcT91BT/o1cn01a9ld2u1pzdthyahyv-2846551855-0-cib.jpg' },
    { name: 'Album We Young - Nhóm nhạc Hàn Quốc NCT DREAM', price: 325000, discount: 15, categoryId: catBook.id, stock: 258, location: 'Thanh Hoá', image: 'https://jola.vn/Product/g4qcT91BT/o1cn01a9ld2u1pzdthyahyv-2846551855-0-cib.jpg' },
    { name: 'Bút lông màu Acrylic Markers - Deli EC189', price: 180000, discount: 15, categoryId: catBook.id, stock: 200, location: 'Thái Nguyên', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEVfgYdoDah4-aTdoWOnObzC7Z8D-L9HjG4w&s' },

    // Test Product
    { name: 'Sản phẩm Test 1K', price: 1000, categoryId: catElec.id, stock: 100000, location: 'Toàn quốc', image: 'https://placehold.co/600x600?text=Test+1K' }
  ];

  await prisma.product.createMany({ data: normalProductsData });

  console.log('--- Đang tạo đánh giá mẫu... ---');
  const allProducts = await prisma.product.findMany();
  const reviewData = [];
  const comments = [
    { rating: 5, comment: "Sản phẩm tuyệt vời, giao hàng nhanh. Shop phục vụ rất nhiệt tình, đóng gói chắc chắn. Sẽ tiếp tục ủng hộ!" },
    { rating: 4, comment: "Chất lượng sản phẩm tốt, đúng mô tả. Tuy nhiên giao hàng hơi chậm một chút. Vẫn đánh giá tốt cho chất lượng." },
    { rating: 5, comment: "Đẹp xuất sắc luôn ạ! Rất đáng tiền, đóng gói siêu cẩn thận. Lần sau sẽ mua thêm." },
    { rating: 3, comment: "Sản phẩm tạm ổn so với giá tiền, giao hàng nhanh. Đóng gói ở mức bình thường." },
    { rating: 5, comment: "Hàng xịn lắm mọi người ơi, dùng siêu thích luôn. Đã mua nhiều lần của shop và lần nào cũng ưng ý!" }
  ];

  for (const p of allProducts) {
    const numReviews = Math.floor(Math.random() * 3) + 2; // 2 đến 4 reviews
    const shuffledComments = [...comments].sort(() => 0.5 - Math.random());
    const usersList = [userA, userB, userC];
    
    for (let i = 0; i < numReviews; i++) {
      const comm = shuffledComments[i % shuffledComments.length];
      const user = usersList[i % usersList.length];
      reviewData.push({
        productId: p.id,
        userId: user.id,
        rating: comm.rating,
        comment: comm.comment,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000)
      });
    }
  }

  await prisma.review.createMany({ data: reviewData });

  console.log('--- Đang tính toán lại rating trung bình cho sản phẩm... ---');
  for (const p of allProducts) {
    const pReviews = reviewData.filter(r => r.productId === p.id);
    if (pReviews.length > 0) {
      const avgRating = pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length;
      const roundedRating = Math.round(avgRating * 10) / 10;
      await prisma.product.update({
        where: { id: p.id },
        data: { rating: roundedRating }
      });
    }
  }

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
