/**
 * Cập nhật mô tả & thông số kỹ thuật cho tất cả sản phẩm trong DB.
 * Chạy: node prisma/scripts/update-product-content.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function spec(highlights, rows) {
  return JSON.stringify({ highlights, rows });
}

/** Nội dung theo tên sản phẩm (khớp chính xác) */
const PRODUCT_CONTENT = {
  'iPhone 15 Pro Max 256GB': {
    description:
      'iPhone 15 Pro Max là flagship cao cấp của Apple với khung titan, chip A17 Pro và hệ thống camera chuyên nghiệp. Màn hình Super Retina XDR 6.7 inch mang lại trải nghiệm hiển thị sắc nét, hỗ trợ ProMotion 120Hz mượt mà khi lướt web, chơi game và xem phim.',
    specs: spec(
      [
        'Chip A17 Pro 3nm — hiệu năng đồ họa và AI vượt trội thế hệ trước',
        'Camera chính 48MP với zoom quang học và chế độ chụp đêm Night Mode',
        'Khung titan Grade 5 nhẹ, bền, chống trầy tốt hơn thép không gỉ',
        'Nút Tác Vụ (Action Button) tùy chỉnh phím tắt theo nhu cầu',
        'Cổng USB-C, hỗ trợ sạc nhanh và truyền dữ liệu tốc độ cao',
      ],
      [
        { label: 'Thương hiệu', value: 'Apple' },
        { label: 'Dung lượng', value: '256GB' },
        { label: 'Màn hình', value: '6.7" Super Retina XDR, 120Hz ProMotion' },
        { label: 'Chip', value: 'Apple A17 Pro (3nm)' },
        { label: 'RAM', value: '8GB' },
        { label: 'Camera sau', value: '48MP chính + 12MP góc siêu rộng + 12MP tele 5x' },
        { label: 'Camera trước', value: '12MP TrueDepth' },
        { label: 'Pin', value: '~4422 mAh, sạc nhanh 20W, MagSafe 15W' },
        { label: 'Kháng nước', value: 'IP68' },
        { label: 'Trọng lượng', value: '221g' },
        { label: 'Hệ điều hành', value: 'iOS 17 (nâng cấp được)' },
      ]
    ),
  },
  'Giày Chạy Bộ Nike Air Zoom': {
    description:
      'Giày chạy bộ Nike Air Zoom được thiết kế cho vận động viên cần độ đệm cao và phản hồi lực nhanh. Đế giày tích hợp công nghệ Zoom Air giúp giảm chấn khi tiếp đất, phù hợp chạy đường phố, tập gym và đi bộ hàng ngày.',
    specs: spec(
      [
        'Đệm Zoom Air ở gót và tiền bàn chân — phản hồi năng lượng tức thì',
        'Upper thoáng khí, ô lưới engineered mesh thoải mái cả ngày',
        'Đế ngoài cao su bền, độ bám tốt trên đường khô và ẩm nhẹ',
        'Form ôm chân vừa phải, hỗ trợ ổn định khi chạy tốc độ cao',
      ],
      [
        { label: 'Thương hiệu', value: 'Nike' },
        { label: 'Loại sản phẩm', value: 'Giày chạy bộ' },
        { label: 'Công nghệ đệm', value: 'Nike Zoom Air' },
        { label: 'Chất liệu upper', value: 'Mesh / Synthetic' },
        { label: 'Đế ngoài', value: 'Cao su chống trượt' },
        { label: 'Phù hợp', value: 'Chạy bộ, tập luyện, đi bộ' },
        { label: 'Giới tính', value: 'Unisex' },
      ]
    ),
  },
  'Son Lì Black Rouge Ver 9': {
    description:
      'Son lì Black Rouge Ver.9 mang màu sắc thời thượng, lớp son mỏng nhẹ, bám màu lâu và không gây khô môi. Công thức dưỡng ẩm giúp môi mềm mại, phù hợp makeup hàng ngày và sự kiện.',
    specs: spec(
      [
        'Kết cấu lì mịn, lên màu chuẩn ngay từ lớp đầu',
        'Giữ màu 6–8 giờ, hạn chế trôi và lem viền môi',
        'Không chứa chì, an toàn cho môi nhạy cảm',
        'Nhiều tone màu: đỏ cam, hồng đất, MLBB phù hợp da châu Á',
      ],
      [
        { label: 'Thương hiệu', value: 'Black Rouge (Hàn Quốc)' },
        { label: 'Dòng sản phẩm', value: 'Ver.9' },
        { label: 'Kết cấu', value: 'Son lì (Matte)' },
        { label: 'Dung tích', value: '~3.5g' },
        { label: 'Xuất xứ', value: 'Hàn Quốc' },
        { label: 'Thành phần nổi bật', value: 'Dưỡng ẩm, vitamin E' },
        { label: 'Hạn sử dụng', value: '36 tháng kể từ NSX' },
      ]
    ),
  },
  'MacBook Air M2': {
    description:
      'MacBook Air M2 sở hữu thiết kế mỏng nhẹ, chip Apple M2 mạnh mẽ cho công việc văn phòng, thiết kế đồ họa nhẹ và học tập. Màn hình Liquid Retina sắc nét, pin trâu cả ngày, quạt không ồn phù hợp làm việc di động.',
    specs: spec(
      [
        'Chip Apple M2 8-core CPU, GPU 8–10 nhân',
        'Thân máy kim loại nguyên khối, nặng chỉ ~1.24kg',
        'Pin dùng liên tục 15–18 giờ (tùy tác vụ)',
        'Touch ID tích hợp, macOS mượt và bảo mật cao',
      ],
      [
        { label: 'Thương hiệu', value: 'Apple' },
        { label: 'Chip', value: 'Apple M2' },
        { label: 'RAM', value: '8GB (có thể nâng 16GB)' },
        { label: 'Ổ cứng', value: '256GB SSD' },
        { label: 'Màn hình', value: '13.6" Liquid Retina, 2560×1664' },
        { label: 'Cổng kết nối', value: '2× Thunderbolt/USB 4, MagSafe 3' },
        { label: 'Webcam', value: '1080p FaceTime HD' },
        { label: 'Trọng lượng', value: '1.24kg' },
      ]
    ),
  },
  'Tai nghe Marshall Major IV': {
    description:
      'Tai nghe Marshall Major IV mang phong cách retro đặc trưng thương hiệu Anh, âm thanh ấm và chi tiết. Pin lên đến 80+ giờ, gập gọn tiện mang theo, kết nối Bluetooth 5.0 ổn định.',
    specs: spec(
      [
        'Thời lượng pin lên đến 80 giờ nghe nhạc liên tục',
        'Driver dynamic 40mm — âm bass đầy, treble trong',
        'Bluetooth 5.0 + jack 3.5mm khi hết pin',
        'Đệm tai da giả êm, đeo lâu không đau',
      ],
      [
        { label: 'Thương hiệu', value: 'Marshall' },
        { label: 'Kiểu tai nghe', value: 'On-ear, có dây/không dây' },
        { label: 'Driver', value: '40mm dynamic' },
        { label: 'Bluetooth', value: '5.0, codec SBC' },
        { label: 'Pin', value: '80+ giờ' },
        { label: 'Sạc', value: 'USB-C' },
        { label: 'Trọng lượng', value: '~165g' },
      ]
    ),
  },
  'Chuột Logitech G502': {
    description:
      'Chuột gaming Logitech G502 HERO trang bị cảm biến HERO 25K, 11 nút lập trình và trọng lượng có thể điều chỉnh. Phù hợp FPS, MOBA và làm việc đa nhiệm cần độ chính xác cao.',
    specs: spec(
      [
        'Cảm biến HERO 25K — DPI 100–25.600, không smoothing',
        '11 nút có thể gán macro qua Logitech G HUB',
        'Hệ thống tạ trọng lượng tùy chỉnh (5× 3.6g)',
        'Đèn RGB LIGHTSYNC đồng bộ game',
      ],
      [
        { label: 'Thương hiệu', value: 'Logitech G' },
        { label: 'Model', value: 'G502 HERO' },
        { label: 'Cảm biến', value: 'HERO 25K' },
        { label: 'DPI', value: '100 – 25.600' },
        { label: 'Tốc độ báo cáo', value: '1000Hz (1ms)' },
        { label: 'Số nút', value: '11 nút lập trình' },
        { label: 'Kết nối', value: 'USB có dây' },
        { label: 'Trọng lượng', value: '121g (+ khối tạ)' },
      ]
    ),
  },
  'Áo Hoodie Unisex': {
    description:
      'Áo hoodie unisex form rộng thoải mái, chất nỉ cotton pha co giãn nhẹ. Phù hợp mặc hàng ngày, đi học, đi chơi hoặc layer trong mùa se lạnh.',
    specs: spec(
      [
        'Chất liệu cotton pha polyester — mềm, ít nhăn',
        'Form unisex oversize nhẹ, dễ phối đồ',
        'Mũ trùm có dây rút, túi kangaroo tiện dụng',
        'Giặt máy ở nhiệt độ thường, không phai màu nhanh',
      ],
      [
        { label: 'Loại', value: 'Áo hoodie / nỉ' },
        { label: 'Chất liệu', value: 'Cotton 80%, Polyester 20%' },
        { label: 'Form', value: 'Unisex, relaxed fit' },
        { label: 'Mùa', value: 'Thu – Đông – Xuân' },
        { label: 'Size', value: 'S, M, L, XL' },
        { label: 'Xuất xứ', value: 'Việt Nam' },
      ]
    ),
  },
  'Quần Jean ống rộng': {
    description:
      'Quần jean ống rộng (wide-leg) phong cách streetwear, denim co giãn nhẹ ôm dáng thoải mái. Dễ phối với áo thun, hoodie hoặc sơ mi cho outfit trẻ trung.',
    specs: spec(
      [
        'Denim cotton pha elastane — đi lại thoải mái',
        'Ống rộng từ đùi xuống, che khuyết điểm chân',
        'Khóa kéo + khuy cúc chắc chắn',
        'Màu xanh indigo / đen than dễ phối',
      ],
      [
        { label: 'Loại', value: 'Quần jean ống rộng' },
        { label: 'Chất liệu', value: '98% Cotton, 2% Elastane' },
        { label: 'Kiểu ống', value: 'Wide-leg' },
        { label: 'Size', value: '28–36' },
        { label: 'Giới tính', value: 'Unisex' },
      ]
    ),
  },
  'Túi xách nữ thời trang': {
    description:
      'Túi xách nữ thiết kế tối giản, da PU cao cấp chống nước nhẹ. Ngăn chính rộng đựng ví, điện thoại và mỹ phẩm, phù hợp đi làm và dạo phố.',
    specs: spec(
      [
        'Da PU mềm, chống trầy và dễ lau chùi',
        'Quai đeo vai có thể tháo/chỉnh độ dài',
        'Khóa kéo kim loại bền, ngăn phụ bên trong',
        'Kích thước vừa phải, không nặng khi đeo lâu',
      ],
      [
        { label: 'Loại', value: 'Túi xách tay / đeo vai' },
        { label: 'Chất liệu', value: 'Da PU' },
        { label: 'Kích thước', value: '~28 × 12 × 22 cm' },
        { label: 'Màu', value: 'Đen / Nâu / Be' },
        { label: 'Giới tính', value: 'Nữ' },
      ]
    ),
  },
  'Anh Trai "Say Hi" Washed T-Shirt (Áo Wash)': {
    description:
      'Áo thun wash hiệu ứng loang màu độc đáo, in hình/typography theo concept Anh Trai Say Hi. Cotton 100% thoáng mát, form unisex trendy cho fan và giới trẻ yêu streetwear.',
    specs: spec(
      [
        'Hiệu ứng wash tự nhiên, mỗi chiếc có tone màu hơi khác nhau',
        'In decal bền, hạn chế bong tróc khi giặt đúng cách',
        'Cổ tròn rib co giãn, không bai sau nhiều lần giặt',
        'Form regular–oversize nhẹ, phù hợp mặc unisex',
      ],
      [
        { label: 'Loại', value: 'Áo thun cotton wash' },
        { label: 'Chất liệu', value: '100% Cotton' },
        { label: 'Họa tiết', value: 'In concept Anh Trai Say Hi' },
        { label: 'Form', value: 'Unisex' },
        { label: 'Size', value: 'S, M, L, XL' },
      ]
    ),
  },
  'Áo Thun Trắng T1 Keria Chính Hãng': {
    description:
      'Áo thun chính hãng T1 Esports in hình Keria, cotton premium trắng tinh. Sản phẩm dành cho fan LMHT và bộ sưu tập merch đội T1, form chuẩn unisex.',
    specs: spec(
      [
        'Hàng chính hãng T1 / Riot merch partner',
        'In silk cao cấp, màu sắc bền',
        'Cotton 220gsm dày dặn, không bị xuyên thấu',
        'Tem tag hologram xác thực (tùy đợt nhập)',
      ],
      [
        { label: 'Thương hiệu', value: 'T1 Esports' },
        { label: 'Chất liệu', value: 'Cotton 100%, 220gsm' },
        { label: 'Màu', value: 'Trắng' },
        { label: 'Họa tiết', value: 'Keria player edition' },
        { label: 'Form', value: 'Unisex' },
        { label: 'Xuất xứ', value: 'Hàn Quốc / Quốc tế' },
      ]
    ),
  },
  '2025 T1 Uniform Jersey LOL': {
    description:
      'Áo đấu uniform T1 mùa giải 2025, thiết kế theo bộ kit chính thức của đội tuyển LMHT. Chất liệu thoáng khí, form athletic fit, must-have cho fan T1 và cộng đồng esports.',
    specs: spec(
      [
        'Thiết kế theo uniform LCK 2025 của T1',
        'Vải polyester mesh thoáng khí, thấm hút mồ hôi',
        'Form athletic — ôm vừa khi mặc, không chùng',
        'Logo đội, sponsor in heat-transfer bền',
      ],
      [
        { label: 'Loại', value: 'Áo đấu esports (Jersey)' },
        { label: 'Đội', value: 'T1 (League of Legends)' },
        { label: 'Mùa', value: '2025' },
        { label: 'Chất liệu', value: '100% Polyester mesh' },
        { label: 'Form', value: 'Athletic fit' },
        { label: 'Size', value: 'S – XXL' },
      ]
    ),
  },
  'Áo Khoác Jean Nam Trắng Tay Dài': {
    description:
      'Áo khoác jean nam màu trắng wash nhẹ, tay dài form regular. Lớp vải denim vừa phải giữ ấm mùa se lạnh, dễ phối với áo thun và quần jean/kaki.',
    specs: spec(
      [
        'Denim cotton cứng cáp, form giữ dáng',
        'Màu trắng wash — phong cách clean, minimal',
        'Khuy cúc kim loại, túi ngực và túi hông',
        'Có thể mặc layer hoặc khoác ngoài outfit',
      ],
      [
        { label: 'Loại', value: 'Áo khoác jean' },
        { label: 'Giới tính', value: 'Nam' },
        { label: 'Chất liệu', value: '100% Cotton denim' },
        { label: 'Màu', value: 'Trắng wash' },
        { label: 'Tay', value: 'Dài' },
        { label: 'Size', value: 'M, L, XL, XXL' },
      ]
    ),
  },
  'Nồi chiên không dầu Philips': {
    description:
      'Nồi chiên không dầu Philips dùng công nghệ Rapid Air lưu thông khí nóng đều, chiên/giòn thực phẩm với ít dầu hơn đến 90%. Dung tích lớn phù hợp gia đình 4–6 người.',
    specs: spec(
      [
        'Công nghệ Rapid Air — giòn đều, ít dầu',
        'Màn hình cảm ứng, nhiều chế độ nấu preset',
        'Khay nướng chống dính, dễ tháo rửa',
        'An toàn quá nhiệt, tự ngắt khi mở nắp',
      ],
      [
        { label: 'Thương hiệu', value: 'Philips' },
        { label: 'Dung tích', value: '~6.2 lít' },
        { label: 'Công suất', value: '~2000W' },
        { label: 'Nhiệt độ', value: '80°C – 200°C' },
        { label: 'Công nghệ', value: 'Rapid Air' },
        { label: 'Màn hình', value: 'Digital touch' },
        { label: 'Bảo hành', value: '24 tháng (chính hãng)' },
      ]
    ),
  },
  'Máy hút bụi cầm tay': {
    description:
      'Máy hút bụi cầm tay nhỏ gọn, lực hút mạnh cho bụi bẩn trên sofa, giường, xe ô tô và góc bếp. Pin sạc tiện dụng, đầu hút đa năng tháo lắp nhanh.',
    specs: spec(
      [
        'Lực hút ≥10.000 Pa — hút bụi mịn và lông thú',
        'Pin lithium dùng 25–40 phút liên tục',
        'Trọng lượng nhẹ, cầm một tay thao tác',
        'Bộ đầu hút: khe, brush, turbo cho nhiều bề mặt',
      ],
      [
        { label: 'Loại', value: 'Máy hút bụi cầm tay không dây' },
        { label: 'Lực hút', value: '~10.000–12.000 Pa' },
        { label: 'Pin', value: 'Li-ion, 2000–2500mAh' },
        { label: 'Thời gian dùng', value: '25–40 phút' },
        { label: 'Hộp bụi', value: '0.5–0.6 lít, tháo rỗng dễ' },
        { label: 'Sạc', value: 'USB-C / dock sạc' },
      ]
    ),
  },
  'Kem chống nắng La Roche-Posay': {
    description:
      'Kem chống nắng La Roche-Posay Anthelios bảo vệ da trước tia UVA/UVB, kết cấu mỏng nhẹ thấm nhanh không bết dính. Phù hợp da nhạy cảm, dùng trước makeup hàng ngày.',
    specs: spec(
      [
        'Chỉ số SPF50+ PA++++ bảo vệ cao',
        'Kết cấu fluid — finish trong, không trắng bệt',
        'Không paraben, test trên da nhạy cảm',
        'Chống nước 40 phút (tùy phiên bản)',
      ],
      [
        { label: 'Thương hiệu', value: 'La Roche-Posay (Pháp)' },
        { label: 'SPF', value: '50+' },
        { label: 'PA', value: '++++' },
        { label: 'Dung tích', value: '50ml' },
        { label: 'Loại da', value: 'Mọi loại da, nhạy cảm' },
        { label: 'Xuất xứ', value: 'Pháp' },
      ]
    ),
  },
  'Sữa rửa mặt Cetaphil 500ml': {
    description:
      'Sữa rửa mặt Cetaphil Gentle Skin Cleanser dịu nhẹ, không xà phòng, làm sạch bụi bẩn và dầu thừa mà không làm khô da. Dung tích 500ml tiết kiệm cho cả gia đình.',
    specs: spec(
      [
        'Công thức không xà phòng, pH cân bằng',
        'Phù hợp da khô, nhạy cảm, đang điều trị mụn',
        'Không mùi hương liệu nồng, dịu cho trẻ em',
        'Dùng được cả sáng và tối',
      ],
      [
        { label: 'Thương hiệu', value: 'Cetaphil' },
        { label: 'Dung tích', value: '500ml' },
        { label: 'Loại', value: 'Sữa rửa mặt dịu nhẹ' },
        { label: 'Da phù hợp', value: 'Khô, nhạy cảm, thường' },
        { label: 'Xuất xứ', value: 'Canada / Mỹ' },
        { label: 'Không chứa', value: 'Xà phòng, paraben' },
      ]
    ),
  },
  "Kem dưỡng sáng da L'Oreal White Perfect Day Cream": {
    description:
      "Kem dưỡng ngày L'Oreal White Perfect giúp dưỡng ẩm, hỗ trợ làm sáng da và giảm thâm nám nhẹ. Kết cấu cream mịn thấm nhanh, dùng trước kem chống nắng buổi sáng.",
    specs: spec(
      [
        'Vitamin C & tourmaline hỗ trợ sáng da',
        'SPF nhẹ tích hợp (tùy phiên bản)',
        'Dưỡng ẩm 24h, không gây bít lỗ chân lông',
        'Hương nhẹ, phù hợp makeup sau 5 phút',
      ],
      [
        { label: 'Thương hiệu', value: "L'Oreal Paris" },
        { label: 'Dòng', value: 'White Perfect Clinical' },
        { label: 'Loại', value: 'Kem dưỡng ngày' },
        { label: 'Dung tích', value: '50ml' },
        { label: 'Công dụng', value: 'Dưỡng ẩm, hỗ trợ sáng da' },
        { label: 'Xuất xứ', value: 'Pháp / Thái Lan SX' },
      ]
    ),
  },
  'Thảm tập Yoga chống trượt': {
    description:
      'Thảm yoga TPE dày 6mm chống trượt hai mặt, đệm tốt cho khớp khi tập plank, chống và các động tác giữ tư thế lâu. Dễ cuộn gọn, kèm dây đai mang đi.',
    specs: spec(
      [
        'Chất liệu TPE thân thiện môi trường, không mùi cao su',
        'Bề mặt texture chống trượt kể cả khi ra mồ hôi',
        'Độ dày 6mm bảo vệ đầu gối và cổ tay',
        'Kích thước 183×61cm phù hợp chiều cao trung bình',
      ],
      [
        { label: 'Loại', value: 'Thảm tập Yoga' },
        { label: 'Chất liệu', value: 'TPE' },
        { label: 'Độ dày', value: '6mm' },
        { label: 'Kích thước', value: '183 × 61 cm' },
        { label: 'Trọng lượng', value: '~900g' },
        { label: 'Phụ kiện', value: 'Dây đai + túi đựng (tùy bộ)' },
      ]
    ),
  },
  'Vợt cầu lông Yonex': {
    description:
      'Vợt cầu lông Yonex cân bằng tốt giữa sức mạnh và kiểm soát, khung graphite bền nhẹ. Phù hợp người chơi phong trào đến bán chuyên tập luyện và thi đấu.',
    specs: spec(
      [
        'Khung graphite / graphite composite siêu nhẹ',
        'Công nghệ Isometric mở rộng sweet spot',
        'Độ cứng trung bình — dễ làm quen',
        'Bám vợt PU mềm, thoáng khí',
      ],
      [
        { label: 'Thương hiệu', value: 'Yonex' },
        { label: 'Môn', value: 'Cầu lông' },
        { label: 'Chất liệu khung', value: 'Graphite' },
        { label: 'Trọng lượng', value: '4U (~80–84g) hoặc 3U' },
        { label: 'Cân bằng', value: 'Even / Head-light (tùy model)' },
        { label: 'Độ căng', value: 'Gợi ý 10–11 kg' },
      ]
    ),
  },
  'Sách: Đắc Nhân Tâm': {
    description:
      'Đắc Nhân Tâm — tác phẩm kinh điển của Dale Carnegie về nghệ thuật giao tiếp, thu phục lòng người và xây dựng mối quan hệ. Bản dịch tiếng Việt dễ đọc, phù hợp sinh viên và người đi làm.',
    specs: spec(
      [
        'Bản dịch tiếng Việt phổ biến, bìa mềm/cứng tùy NXB',
        'Nội dung chia chương rõ, ví dụ thực tế',
        'Sách self-help bán chạy toàn cầu hàng thập kỷ',
        'Quà tặng ý nghĩa cho bạn bè, đồng nghiệp',
      ],
      [
        { label: 'Tác giả', value: 'Dale Carnegie' },
        { label: 'Thể loại', value: 'Kỹ năng sống / Giao tiếp' },
        { label: 'Ngôn ngữ', value: 'Tiếng Việt' },
        { label: 'Số trang', value: '~320 trang (tùy NXB)' },
        { label: 'Khổ sách', value: '13×20 cm' },
        { label: 'NXB', value: 'First News / Nhiều NXB' },
      ]
    ),
  },
  'Sách: Nhà Giả Kim': {
    description:
      'Nhà Giả Kim (The Alchemist) của Paulo Coelho — câu chuyện về hành trình tìm kho báu và ý nghĩa cuộc sống. Tiểu thuyết truyền cảm hứng được yêu thích trên toàn thế giới.',
    specs: spec(
      [
        'Tiểu thuyết triết lý nhẹ nhàng, dễ đọc',
        'Bản dịch Việt chất lượng từ NXB uy tín',
        'Phù hợp đọc giải trí và làm quà',
        'Cốt truyện Santiago — biểu tượng theo đuổi ước mơ',
      ],
      [
        { label: 'Tác giả', value: 'Paulo Coelho' },
        { label: 'Tên gốc', value: 'O Alquimista' },
        { label: 'Thể loại', value: 'Tiểu thuyết / Văn học' },
        { label: 'Ngôn ngữ', value: 'Tiếng Việt' },
        { label: 'Số trang', value: '~227 trang' },
      ]
    ),
  },
  'Đĩa Nhạc She Never Cries - Sơn.K': {
    description:
      'Đĩa than (vinyl) album She Never Cries — Sơn.K, bản thu âm analog ấm áp dành cho người yêu nhạc Việt và sưu tập đĩa. Bao gồm jacket và đĩa LP chất lượng cao.',
    specs: spec(
      [
        'Định dạng LP 12 inch, tốc độ 33⅓ RPM',
        'Ấn bản collector dành cho fan Sơn.K',
        'Jacket in artwork chính thức',
        'Phù hợp máy nghe đĩa có kim và đĩa platter chuẩn',
      ],
      [
        { label: 'Nghệ sĩ', value: 'Sơn.K' },
        { label: 'Album', value: 'She Never Cries' },
        { label: 'Định dạng', value: 'Vinyl LP 12"' },
        { label: 'Tốc độ', value: '33⅓ RPM' },
        { label: 'Thể loại', value: 'V-Pop / Ballad' },
        { label: 'Tình trạng', value: 'Mới, nguyên seal (tùy đợt)' },
      ]
    ),
  },
  'Sách - Trọn bộ Harry Potter bản tiếng Anh (7 quyển)': {
    description:
      'Trọn bộ 7 tập Harry Potter bản tiếng Anh nguyên bản của J.K. Rowling. Bộ sưu tập lý tưởng cho người học tiếng Anh và fan phép thuật, bìa đẹp đồng bộ.',
    specs: spec(
      [
        'Đủ 7 tập: Philosopher\'s Stone đến Deathly Hallows',
        'Ngôn ngữ tiếng Anh — bản in phổ biến UK/US',
        'Paperback hoặc hardcover tùy nhà xuất bản',
        'Quà tặng ý nghĩa cho thiếu nhi và thanh thiếu niên',
      ],
      [
        { label: 'Tác giả', value: 'J.K. Rowling' },
        { label: 'Số tập', value: '7 quyển' },
        { label: 'Ngôn ngữ', value: 'Tiếng Anh' },
        { label: 'Thể loại', value: 'Fantasy / Thiếu nhi' },
        { label: 'Khổ sách', value: 'Paperback ~13×20 cm' },
        { label: 'NXB', value: 'Bloomsbury / Scholastic' },
      ]
    ),
  },
  'Set card bo góc anh trai Sơn.K': {
    description:
      'Set photocard bo góc in hình Sơn.K, chất liệu giấy bóng/ matte cao cấp, bo góc an toàn. Sưu tập, trang trí idol book hoặc làm quà fan.',
    specs: spec(
      [
        'Bộ nhiều card (số lượng tùy set)',
        'In offset sắc nét, màu trung thực',
        'Kích thước chuẩn photocard K-pop',
        'Có thể bỏ vào sleeve album 4-cut',
      ],
      [
        { label: 'Loại', value: 'Photocard / Trading card' },
        { label: 'Nghệ sĩ', value: 'Sơn.K' },
        { label: 'Kích thước', value: '~5.5 × 8.5 cm (mỗi card)' },
        { label: 'Chất liệu', value: 'Giấy artcard 300–350gsm' },
        { label: 'Hoàn thiện', value: 'Bo góc, laminate' },
      ]
    ),
  },
  'Sách Ảnh Hello Future (Xin Chào Tương Lai) - NCT DREAM': {
    description:
      'Photobook Hello Future của NCT DREAM ghi lại concept album và hình ảnh behind-the-scenes. In ấn đẹp, trang giấy couché dày, dành cho NCTzen sưu tập.',
    specs: spec(
      [
        'Photobook chính thức NCT DREAM',
        'Concept Hello Future / Xin chào tương lai',
        'Ảnh concept, studio và đời thường',
        'Kèm poster hoặc postcard (tùy phiên bản)',
      ],
      [
        { label: 'Nhóm', value: 'NCT DREAM' },
        { label: 'Album', value: 'Hello Future' },
        { label: 'Loại', value: 'Photobook' },
        { label: 'Ngôn ngữ', value: 'Hàn / Anh (caption)' },
        { label: 'Số trang', value: '~150–200 trang (tùi bản)' },
        { label: 'Kích thước', value: '~25 × 30 cm' },
      ]
    ),
  },
  'Móc khoá Nick Wilde Zootopia Disney': {
    description:
      'Móc khóa nhân vật Nick Wilde phim Zootopia chính hãng Disney, chất liệu nhựa PVC/metal bền, màu sắc sống động. Treo balo, chìa khóa hoặc làm quà fan Disney.',
    specs: spec(
      [
        'Nhân vật Nick Wilde — Zootopia (2016)',
        'Chất liệu PVC cao cấp hoặc kim loại enamel',
        'Móc khóa swivel chắc chắn',
        'Kích thước mini ~5–8cm phù hợp treo túi',
      ],
      [
        { label: 'Thương hiệu', value: 'Disney' },
        { label: 'Nhân vật', value: 'Nick Wilde' },
        { label: 'Phim', value: 'Zootopia' },
        { label: 'Chất liệu', value: 'PVC / Metal enamel' },
        { label: 'Kích thước', value: '~6 × 4 cm' },
        { label: 'Xuất xứ', value: 'Trung Quốc (Disney licensed)' },
      ]
    ),
  },
  'NCT DREAM x PINKFONG - Sticker hình dán NCT-REX [HAECHAN ver.]': {
    description:
      'Bộ sticker collaboration NCT DREAM × PINKFONG phiên bản HAECHAN — họa tiết khủng long NCT-REX dễ thương. Dán laptop, sổ tay, ốp điện thoại hoặc trang trí album.',
    specs: spec(
      [
        'Collaboration chính thức NCT DREAM × Pinkfong',
        'Ver. HAECHAN — màu và pose đặc trưng',
        'Sticker vinyl chống nước nhẹ',
        'Nhiều sheet họa tiết nhỏ tiện cắt dán',
      ],
      [
        { label: 'Nhóm', value: 'NCT DREAM' },
        { label: 'Member', value: 'HAECHAN' },
        { label: 'Concept', value: 'NCT-REX / Pinkfong' },
        { label: 'Loại', value: 'Sticker set' },
        { label: 'Chất liệu', value: 'Vinyl / PVC' },
        { label: 'Số sheet', value: '2–4 tờ (tùi bộ)' },
      ]
    ),
  },
  'Nhật Ký Tình Yêu Between Us Scrapbook Handmade': {
    description:
      'Scrapbook handmade Between Us ghi chép kỷ niệm tình yêu, giấy craft vintage kèm sticker và khung ảnh polaroid. Quà tặng ý nghĩa cho ngày kỷ niệm, Valentine.',
    specs: spec(
      [
        'Ruột giấy kraft và trắng xen kẽ',
        'Kèm sticker, washi tape, khung dán ảnh',
        'Bìa cứng bọc vải/nhung sang trọng',
        'Có thể viết, vẽ, dán ảnh tự do',
      ],
      [
        { label: 'Loại', value: 'Scrapbook / Nhật ký handmade' },
        { label: 'Chủ đề', value: 'Between Us — Love journal' },
        { label: 'Số trang', value: '~40–60 trang' },
        { label: 'Kích thước', value: 'A5 (~14 × 21 cm)' },
        { label: 'Phụ kiện', value: 'Sticker, tape, tag giấy' },
      ]
    ),
  },
  'T1 Membership HAPPY KERIA DAY 2023': {
    description:
      'Gói membership sự kiện Happy Keria Day 2023 của T1 Esports — bao gồm quyền lợi fan membership, vật phẩm giới hạn và nội dung đặc quyền theo chương trình (tùy đợt phát hành).',
    specs: spec(
      [
        'Merch chính thức T1 Esports',
        'Sự kiện kỷ niệm Keria — mùa 2023',
        'Có thể gồm card, poster, badge (tùi gói)',
        'Số lượng giới hạn — collector item',
      ],
      [
        { label: 'Đội', value: 'T1 Esports' },
        { label: 'Sự kiện', value: 'Happy Keria Day 2023' },
        { label: 'Loại', value: 'Membership kit / Merch box' },
        { label: 'Tình trạng', value: 'New / Limited' },
        { label: 'Xuất xứ', value: 'Hàn Quốc' },
      ]
    ),
  },
  'Sản phẩm Test 1K': {
    description:
      'Sản phẩm dùng để kiểm thử luồng thanh toán và đặt hàng trên hệ thống BuyMe. Giá 1.000đ, tồn kho lớn, phù hợp test API và PayOS.',
    specs: spec(
      [
        'Giá thấp tiện test thanh toán',
        'Tồn kho 100.000+ không lo hết hàng test',
        'Không phải hàng tiêu dùng thực tế',
      ],
      [
        { label: 'Mục đích', value: 'Kiểm thử hệ thống' },
        { label: 'Giá bán', value: '1.000 VNĐ' },
        { label: 'Loại', value: 'Virtual / Test SKU' },
        { label: 'Danh mục', value: 'Điện tử' },
      ]
    ),
  },
};

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, name: true } });
  let updated = 0;
  let missing = [];

  for (const p of products) {
    const content = PRODUCT_CONTENT[p.name];
    if (!content) {
      missing.push(p.name);
      continue;
    }
    await prisma.product.update({
      where: { id: p.id },
      data: {
        description: content.description,
        specs: content.specs,
      },
    });
    updated++;
    console.log(`OK #${p.id}: ${p.name}`);
  }

  console.log(`\nHoàn tất: ${updated}/${products.length} sản phẩm.`);
  if (missing.length) {
    console.log('Chưa có nội dung cho:', missing.join(', '));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
