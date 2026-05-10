// ================================================
// File: src/controllers/admin.controller.js
// Mục đích: Xử lý các API quản trị dành cho Admin
//   - Thống kê tổng quan (dashboard stats)
//   - Quản lý sản phẩm (CRUD + bật/tắt Flash Sale)
//   - Xem danh sách đơn hàng
//   - Xem danh sách khách hàng
// ================================================

const prisma = require('../config/database');

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────
async function getStats(req, res, next) {
  try {
    const [totalOrders, paidOrders, totalUsers, revenueResult] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { paymentStatus: 'paid' } }),
      prisma.user.count({ where: { role: 'user' } }),
      prisma.order.aggregate({
        _sum: { finalPrice: true },
        where: { paymentStatus: 'paid' }
      })
    ]);

    return res.json({
      success: true,
      data: {
        totalOrders,
        paidOrders,
        totalUsers,
        totalRevenue: revenueResult._sum.finalPrice || 0
      }
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────
async function getProducts(req, res, next) {
  try {
    const { isFlashSale, search, categoryId } = req.query;

    const where = {};
    if (isFlashSale === 'true') where.isFlashSale = true;
    if (isFlashSale === 'false') where.isFlashSale = false;
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ isFlashSale: 'desc' }, { createdAt: 'desc' }]
    });

    return res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const {
      name, description, price, originalPrice, discount,
      stock, image, categoryId, location,
      isFlashSale, flashSaleStart, flashSaleEnd
    } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        discount: parseFloat(discount || 0),
        stock: parseInt(stock || 0),
        image: image || null,
        categoryId: parseInt(categoryId),
        location: location || null,
        isFlashSale: Boolean(isFlashSale),
        flashSaleStart: isFlashSale && flashSaleStart ? new Date(flashSaleStart) : null,
        flashSaleEnd: isFlashSale && flashSaleEnd ? new Date(flashSaleEnd) : null,
      },
      include: { category: { select: { id: true, name: true } } }
    });

    // Nếu là Flash Sale thì tạo Inventory
    if (isFlashSale) {
      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: { availableStock: product.stock },
        create: { productId: product.id, availableStock: product.stock }
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Thêm sản phẩm thành công!',
      data: product
    });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const {
      name, description, price, originalPrice, discount,
      stock, image, categoryId, location,
      isFlashSale, flashSaleStart, flashSaleEnd
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice ? parseFloat(originalPrice) : null;
    if (discount !== undefined) updateData.discount = parseFloat(discount);
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (image !== undefined) updateData.image = image;
    if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);
    if (location !== undefined) updateData.location = location;
    if (isFlashSale !== undefined) {
      updateData.isFlashSale = Boolean(isFlashSale);
      updateData.flashSaleStart = isFlashSale && flashSaleStart ? new Date(flashSaleStart) : null;
      updateData.flashSaleEnd = isFlashSale && flashSaleEnd ? new Date(flashSaleEnd) : null;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: { select: { id: true, name: true } } }
    });

    // Đồng bộ Inventory khi thay đổi stock hoặc bật Flash Sale
    if (updateData.isFlashSale || updateData.stock !== undefined) {
      await prisma.inventory.upsert({
        where: { productId: id },
        update: { availableStock: product.stock },
        create: { productId: id, availableStock: product.stock }
      });
    }

    return res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công!',
      data: product
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await prisma.product.delete({ where: { id } });
    return res.json({ success: true, message: 'Xóa sản phẩm thành công!' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }
    next(error);
  }
}

async function toggleFlashSale(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { isFlashSale, flashSaleStart, flashSaleEnd, discount } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        isFlashSale: Boolean(isFlashSale),
        discount: discount !== undefined ? parseFloat(discount) : undefined,
        flashSaleStart: isFlashSale && flashSaleStart ? new Date(flashSaleStart) : null,
        flashSaleEnd: isFlashSale && flashSaleEnd ? new Date(flashSaleEnd) : null,
      }
    });

    if (isFlashSale) {
      await prisma.inventory.upsert({
        where: { productId: id },
        update: { availableStock: product.stock },
        create: { productId: id, availableStock: product.stock }
      });
    }

    return res.json({
      success: true,
      message: `Sản phẩm đã được ${isFlashSale ? 'bật' : 'tắt'} Flash Sale!`,
      data: product
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }
    next(error);
  }
}

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────
async function getOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: { product: { select: { id: true, name: true, image: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────
async function getCustomers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'user' },
      select: {
        id: true, name: true, email: true, phone: true, address: true,
        createdAt: true,
        _count: { select: { orders: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────
async function getCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStats, getProducts, createProduct, updateProduct,
  deleteProduct, toggleFlashSale, getOrders, getCustomers, getCategories
};
