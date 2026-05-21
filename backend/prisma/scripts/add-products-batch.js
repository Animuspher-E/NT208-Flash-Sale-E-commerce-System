/**
 * Thêm sản phẩm mới + xóa iPhone 15 Pro Max
 * Chạy: node prisma/scripts/add-products-batch.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { getRedisClient } = require('../../src/config/redis');
const { warmUpCache } = require('../../src/services/cache.service');

const prisma = new PrismaClient();

function spec(highlights, rows) {
  return JSON.stringify({ highlights, rows });
}

const NEW_PRODUCTS = [
  {
    name: 'NCT DREAM x PINKFONG - LOCAMOBILITY CARD [RENJUN ver.]',
    price: 530000,
    discount: 15,
    stock: 323,
    location: 'Huế',
    image: 'https://www.musicplaza.com/cdn/shop/products/runjun.jpg?v=1661932739',
    categoryId: 41,
    description:
      'Thẻ Locamobility Card collaboration NCT DREAM × PINKFONG phiên bản RENJUN — sưu tập chính thức dành cho NCTzen, in ấn sắc nét, phù hợp trang trí binder hoặc làm quà fan.',
    specs: spec(
      [
        'Phiên bản RENJUN — họa tiết NCT-REX / Pinkfong',
        'Card chất lượng collector, bền màu',
        'Sản phẩm merch K-pop chính hãng / đối tác',
      ],
      [
        { label: 'Nhóm', value: 'NCT DREAM' },
        { label: 'Member', value: 'RENJUN' },
        { label: 'Loại', value: 'Locamobility Card' },
        { label: 'Collaboration', value: 'PINKFONG' },
        { label: 'Xuất xứ', value: 'Hàn Quốc' },
      ]
    ),
  },
  {
    name: 'Keychain Móc Khoá T1 FAKER LCK LOL K24',
    price: 350000,
    discount: 15,
    stock: 20,
    location: 'Hà Nội',
    image: 'https://i.ebayimg.com/images/g/d-0AAeSwMOppCw7H/s-l400.jpg',
    categoryId: 41,
    description:
      'Móc khóa T1 Faker phiên bản LCK 2024 — merch esports chính thức, chất liệu bền, in hình Faker sắc nét. Quà tặng cho fan LMHT và T1.',
    specs: spec(
      [
        'Merch T1 Esports / LCK 2024',
        'Móc khóa kim loại / enamel cao cấp',
        'Kích thước compact, tiện treo balo',
      ],
      [
        { label: 'Đội', value: 'T1' },
        { label: 'Tuyển thủ', value: 'Faker (Lee Sang-hyeok)' },
        { label: 'Giải', value: 'LCK 2024' },
        { label: 'Loại', value: 'Móc khóa' },
      ]
    ),
  },
  {
    name: 'buitruonglinh - 1st Album [Từng Ngày Như Mãi Mãi]',
    price: 469000,
    discount: 15,
    stock: 350,
    location: 'Hà Nội',
    image: 'https://cdn.hstatic.net/products/200001039392/poster_1x1_2_54dbc9cb1b1b4130b829916ff608ba11_grande.jpg',
    categoryId: 41,
    description:
      'Album debut "Từng Ngày Như Mãi Mãi" của buitruonglinh — đĩa/CD kèm booklet, sản phẩm âm nhạc Việt chất lượng collector.',
    specs: spec(
      [
        'Album đầu tay buitruonglinh',
        'Kèm poster / photobook (tùy phiên bản)',
        'Phù hợp fan V-pop và sưu tập',
      ],
      [
        { label: 'Nghệ sĩ', value: 'buitruonglinh' },
        { label: 'Tên album', value: 'Từng Ngày Như Mãi Mãi' },
        { label: 'Loại', value: 'Album âm nhạc' },
        { label: 'Thể loại', value: 'V-Pop' },
      ]
    ),
  },
  {
    name: 'Khăn Twilly I DO "SAY HI"',
    price: 179000,
    discount: 18,
    stock: 400,
    location: 'TP. Hồ Chí Minh',
    image: 'https://cdn.hstatic.net/products/200000225139/6480_0b0c35d4775b65021bd2e027e8e9e484_59ee7aebb4434bc2af0cd210e553d53e_9c1e45381e084be2890486c4b444e407_grande.jpg',
    categoryId: 38,
    description:
      'Khăn twilly in họa tiết I DO "Say Hi" — phụ kiện thời trang buộc túi, làm ruy băng tóc hoặc trang trí outfit streetwear.',
    specs: spec(
      [
        'Chất liệu lụa / satin mềm, bóng nhẹ',
        'Họa tiết concept Anh Trai Say Hi',
        'Kích thước twilly chuẩn phụ kiện luxury',
      ],
      [
        { label: 'Loại', value: 'Khăn twilly / phụ kiện' },
        { label: 'Họa tiết', value: 'I DO "SAY HI"' },
        { label: 'Chất liệu', value: 'Satin / Lụa polyester' },
        { label: 'Phong cách', value: 'Streetwear / Unisex' },
      ]
    ),
  },
  {
    name: 'Móc khoá mèo máy Doraemon',
    price: 50000,
    discount: 15,
    stock: 200,
    location: 'Cần Thơ',
    image: 'https://jola.vn/Product/g4qcT91BT/o1cn01a9ld2u1pzdthyahyv-2846551855-0-cib.jpg',
    categoryId: 41,
    description:
      'Móc khóa hình mèo máy Doraemon dễ thương, chất liệu nhựa PVC hoặc kim loại enamel, phù hợp treo chìa khóa, balo cho fan hoạt hình.',
    specs: spec(
      [
        'Nhân vật Doraemon — mèo máy',
        'Màu sắc tươi, chi tiết in rõ',
        'Móc khóa chắc chắn',
      ],
      [
        { label: 'Nhân vật', value: 'Doraemon' },
        { label: 'Loại', value: 'Móc khóa' },
        { label: 'Chất liệu', value: 'PVC / Metal enamel' },
        { label: 'Kích thước', value: '~5–7 cm' },
      ]
    ),
  },
  {
    name: 'Album We Young - Nhóm nhạc Hàn Quốc NCT DREAM',
    price: 325000,
    discount: 15,
    stock: 258,
    location: 'Thanh Hoá',
    image: 'https://jola.vn/Product/g4qcT91BT/o1cn01a9ld2u1pzdthyahyv-2846551855-0-cib.jpg',
    categoryId: 41,
    description:
      'Album "We Young" của NCT DREAM — mini album K-pop với photobook và CD, dành cho NCTzen sưu tập discography nhóm.',
    specs: spec(
      [
        'Mini album We Young — NCT DREAM',
        'Kèm CD + photobook (theo bản in)',
        'Album K-pop chính hãng / nhập khẩu',
      ],
      [
        { label: 'Nhóm', value: 'NCT DREAM' },
        { label: 'Album', value: 'We Young' },
        { label: 'Loại', value: 'Mini Album K-pop' },
        { label: 'Ngôn ngữ', value: 'Hàn / Anh (booklet)' },
      ]
    ),
  },
  {
    name: 'T1 2024 Worlds Jacket Áo Khoác Thi Đấu',
    price: 4300000,
    discount: 18,
    stock: 200,
    location: 'TP. Hồ Chí Minh',
    image: 'https://www.paragonjackets.com/wp-content/uploads/2024/09/2024-T1-Worlds-Uniform-White-Hooded-Jacket.jpg',
    categoryId: 38,
    description:
      'Áo khoác uniform T1 Worlds 2024 — bộ kit chính thức giải LMHT World Championship, chất liệu cao cấp, form thi đấu, must-have cho fan T1.',
    specs: spec(
      [
        'Worlds 2024 official-style jacket',
        'Chất liệu dù / polyester chống gió nhẹ',
        'Form unisex, logo T1 Worlds in nổi bật',
      ],
      [
        { label: 'Đội', value: 'T1 Esports' },
        { label: 'Sự kiện', value: 'Worlds 2024' },
        { label: 'Loại', value: 'Áo khoác thi đấu / hoodie' },
        { label: 'Màu', value: 'Trắng (White uniform)' },
        { label: 'Size', value: 'S – XXL' },
      ]
    ),
  },
  {
    name: 'Bút lông màu Acrylic Markers - Deli EC189',
    price: 180000,
    discount: 15,
    stock: 200,
    location: 'Thái Nguyên',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEVfgYdoDah4-aTdoWOnObzC7Z8D-L9HjG4w&s',
    categoryId: 41,
    description:
      'Bộ bút lông màu acrylic Deli EC189 — màu sắc tươi, nét mảnh đến đậm, phù hợp vẽ bullet journal, poster và học tập.',
    specs: spec(
      [
        'Đầu bút dual tip (tùy model EC189)',
        'Mực acrylic không lem trên giấy dày',
        'Nắp đậy kín, hạn chế khô mực',
      ],
      [
        { label: 'Thương hiệu', value: 'Deli' },
        { label: 'Model', value: 'EC189' },
        { label: 'Loại', value: 'Bút acrylic marker' },
        { label: 'Ứng dụng', value: 'Vẽ, học tập, planner' },
      ]
    ),
  },
];

async function clearRedisProduct(productId) {
  const redis = getRedisClient();
  await redis.del(
    `flashsale:product_${productId}:info`,
    `flashsale:product_${productId}:stock`,
    `flashsale:product_${productId}:user_qty`
  );
}

async function main() {
  const iphone = await prisma.product.findFirst({
    where: { name: { contains: 'iPhone 15 Pro Max' } },
  });

  if (iphone) {
    const orderItems = await prisma.orderItem.count({ where: { productId: iphone.id } });
    if (orderItems > 0) {
      console.warn(`iPhone có ${orderItems} dòng đơn hàng — vẫn xóa product (order items giữ nguyên cần xử lý thủ công nếu lỗi FK)`);
    }
    await prisma.product.delete({ where: { id: iphone.id } });
    await clearRedisProduct(iphone.id);
    console.log(`Đã xóa: ${iphone.name} (#${iphone.id})`);
  }

  for (const item of NEW_PRODUCTS) {
    const created = await prisma.product.create({
      data: {
        name: item.name,
        description: item.description,
        specs: item.specs,
        price: item.price,
        originalPrice: item.price,
        discount: item.discount,
        stock: item.stock,
        location: item.location,
        image: item.image,
        categoryId: item.categoryId,
        isFlashSale: false,
      },
    });
    console.log(`Đã thêm: #${created.id} ${created.name}`);
  }

  console.log('\nĐang warm-up cache...');
  await warmUpCache();
  const total = await prisma.product.count();
  console.log(`\nHoàn tất. Tổng sản phẩm: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
