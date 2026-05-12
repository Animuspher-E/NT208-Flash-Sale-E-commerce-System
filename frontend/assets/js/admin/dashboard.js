// ================================================
// File: assets/js/admin/dashboard.js
// Mục đích: Logic toàn bộ trang Admin Panel
//   - Kiểm tra quyền admin
//   - Load thống kê, sản phẩm, đơn hàng, khách hàng
//   - CRUD sản phẩm (Thêm / Sửa / Xóa)
//   - Bật / Tắt Flash Sale cho từng sản phẩm
//   - Warm-up Redis Cache
// ================================================

const BF = window.ECommerce;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function fmt(v) { return Number(v || 0).toLocaleString('vi-VN') + ' đ'; }
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleString('vi-VN'); }
function statusBadge(status) {
  const colors = {
    pending:    'badge-normal',
    confirmed:  'badge-upcoming',
    processing: 'badge-upcoming',
    delivered:  'badge-active',
    completed:  'badge-active',
    cancelled:  'badge-flash',
  };
  const labels = {
    pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', processing: 'Đang xử lý',
    delivered: 'Đã giao', completed: 'Hoàn tất', cancelled: 'Đã hủy'
  };
  return `<span class="badge ${colors[status] || 'badge-normal'}">${labels[status] || status}</span>`;
}

// ─────────────────────────────────────────────
// AUTH CHECK
// ─────────────────────────────────────────────
function checkAdmin() {
  const user = BF.getUser();
  const token = BF.getToken();
  if (!token || !user || user.role !== 'admin') {
    alert('Bạn không có quyền truy cập trang này!');
    window.location.href = 'auth.html';
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────
// TAB NAVIGATION
// ─────────────────────────────────────────────
window.switchTab = function (tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.admin-nav-link').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabId}`)?.classList.remove('hidden');
  document.getElementById(`nav-${tabId}`)?.classList.add('active');

  const titles = { dashboard: 'Tổng quan', flashsale: 'Quản lý Flash Sale', products: 'Quản lý Sản phẩm', orders: 'Quản lý Đơn hàng', customers: 'Quản lý Khách hàng' };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[tabId] || tabId;

  if (tabId === 'dashboard') loadDashboard();
  if (tabId === 'flashsale') loadFlashSale();
  if (tabId === 'products') loadProducts();
  if (tabId === 'orders') loadOrders();
  if (tabId === 'customers') loadCustomers();
};

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
async function loadDashboard() {
  try {
    const [statsRes, ordersRes] = await Promise.all([
      BF.apiRequest('/api/admin/stats'),
      BF.apiRequest('/api/admin/orders')
    ]);

    if (statsRes.success) {
      const d = statsRes.data;
      document.getElementById('stat-totalOrders').textContent = d.totalOrders.toLocaleString();
      document.getElementById('stat-paidOrders').textContent = d.paidOrders.toLocaleString();
      document.getElementById('stat-totalUsers').textContent = d.totalUsers.toLocaleString();
      document.getElementById('stat-totalRevenue').textContent = fmt(d.totalRevenue);
    }

    if (ordersRes.success) {
      const tbody = document.getElementById('recentOrdersTable');
      tbody.innerHTML = '';
      if (!ordersRes.data.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-gray-400">Chưa có đơn hàng nào</td></tr>';
        return;
      }
      ordersRes.data.slice(0, 10).forEach(o => {
        tbody.innerHTML += `
          <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="py-3 font-bold text-gray-800 text-sm">${o.orderNumber}</td>
            <td class="py-3 text-gray-600 text-sm">${o.user?.name || '—'}</td>
            <td class="py-3 text-gray-400 text-xs">${fmtDate(o.createdAt)}</td>
            <td class="py-3 font-medium text-red-600 text-sm">${fmt(o.finalPrice)}</td>
            <td class="py-3">${statusBadge(o.status)}</td>
          </tr>`;
      });
    }
  } catch (err) {
    console.error('Lỗi load dashboard:', err);
  }
}

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────
let allCategories = [];
let currentFilter = 'all'; // all | flashsale | normal

async function loadProducts(filter) {
  if (filter !== undefined) currentFilter = filter;


  // Cập nhật màu nút filter
  ['all', 'normal'].forEach(f => {
    const btn = document.getElementById(`filter-${f}`);
    if (!btn) return;
    if (f === currentFilter) {
      btn.className = 'px-4 py-1.5 rounded-lg text-sm font-semibold bg-red-600 text-white transition-colors';
    } else {
      btn.className = 'px-4 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors';
    }
  });

  const params = new URLSearchParams();

  if (currentFilter === 'flashsale') params.set('isFlashSale', 'true');
  if (currentFilter === 'normal') params.set('isFlashSale', 'false');

  const search = document.getElementById('productSearch')?.value?.trim();
  if (search) params.set('search', search);

  try {
    const [prodRes, catRes] = await Promise.all([
      BF.apiRequest('/api/admin/products?' + params.toString()),
      allCategories.length ? Promise.resolve({ data: allCategories }) : BF.apiRequest('/api/admin/categories')
    ]);

    if (catRes.data) allCategories = catRes.data;
    populateCategorySelect('productCategory');
    populateCategorySelect('filter-category');
    populateCategorySelect('quickAddCat');

    const tbody = document.getElementById('productsTable');
    tbody.innerHTML = '';

    const filterCat = document.getElementById('filter-category')?.value;
    if (filterCat) params.set('categoryId', filterCat);

    if (!prodRes.data.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-gray-400">Không có sản phẩm nào</td></tr>';
      return;
    }

    prodRes.data.forEach(p => {
      tbody.innerHTML += `
        <tr id="product-row-${p.id}">
          <td style="color:#aaa;font-size:12px">${p.id}</td>
          <td><img src="${p.image || 'https://placehold.co/100x100?text=No+Image'}" style="width:44px;height:44px;object-fit:cover;border-radius:6px" onerror="this.onerror=null; this.src='https://placehold.co/100x100?text=No+Image'"></td>
          <td>
            <div style="font-weight:700;font-size:13px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${BF.escapeHtml(p.name)}</div>
            <div style="font-size:11px;color:#888">${p.category?.name || '—'}</div>
          </td>
          <td style="color:#cc0000;font-weight:700">${fmt(p.price)}</td>
          <td class="text-center">
            <span style="font-weight:700;color:${p.stock > 10 ? '#1a7a3a' : '#cc0000'}">${p.stock}</span>
          </td>
          <td>
            ${p.isFlashSale
              ? '<span class="badge badge-flash"><i class="fa-solid fa-bolt" style="font-size:10px"></i> Flash Sale</span>'
              : '<span class="badge badge-normal">Thường</span>'}
          </td>
          <td style="font-size:12px;color:#888">${p.discount > 0 ? '-' + p.discount + '%' : '—'}</td>
          <td>
            <div class="flex items-center gap-1.5 justify-center">
              <button onclick="openEditModal(${p.id})" title="Chỉnh sửa" class="icon-btn-sm edit">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button onclick="toggleFlashSale(${p.id}, ${!p.isFlashSale})" title="${p.isFlashSale ? 'Tắt Flash Sale' : 'Bật Flash Sale'}" class="icon-btn-sm ${p.isFlashSale ? 'flash-off' : 'flash-on'}">
                <i class="fa-solid ${p.isFlashSale ? 'fa-bolt-slash' : 'fa-bolt'}"></i>
              </button>
              <button onclick="deleteProduct(${p.id}, '${BF.escapeHtml(p.name)}')" title="Xóa" class="icon-btn-sm delete">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>`;
    });
  } catch (err) {
    console.error('Lỗi load products:', err);
    document.getElementById('productsTable').innerHTML =
      '<tr><td colspan="7" class="py-6 text-center text-red-400">Lỗi tải dữ liệu: ' + err.message + '</td></tr>';
  }
}

// QUICK ADD FS MODAL (LIST)
let quickAddProducts = [];
window.openQuickAddFS = async function() {
  try {
    const res = await BF.apiRequest('/api/admin/products?isFlashSale=false');
    quickAddProducts = res.data || [];
    
    populateCategorySelect('quickAddCat');
    renderQuickAddList();
    
    document.getElementById('quickAddFSModal').classList.remove('hidden');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.closeQuickAddFS = function() {
  document.getElementById('quickAddFSModal').classList.add('hidden');
};

window.renderQuickAddList = function() {
  const search = document.getElementById('quickAddSearch').value.toLowerCase();
  const cat = document.getElementById('quickAddCat').value;
  const tbody = document.getElementById('quickAddTable');
  
  const filtered = quickAddProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search);
    const matchCat = !cat || p.categoryId == cat;
    return matchSearch && matchCat;
  });

  tbody.innerHTML = filtered.map(p => `
    <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td class="p-2"><input type="checkbox" class="qa-checkbox" value="${p.id}" onclick="updateQuickSelectedCount()"></td>
      <td class="p-2">
        <div class="flex items-center gap-3">
          <img src="${p.image || 'https://placehold.co/40x40'}" style="width:24px;height:24px" class="rounded object-cover">
          <div>
            <div class="font-medium text-gray-800">${BF.escapeHtml(p.name)}</div>
            <div class="text-[10px] text-gray-400">${p.category?.name || ''}</div>
          </div>
        </div>
      </td>
      <td class="p-2 text-red-600 font-medium">${fmt(p.price)}</td>
      <td class="p-2 text-gray-500">${p.stock}</td>
    </tr>
  `).join('');
  
  updateQuickSelectedCount();
};

window.toggleSelectAllQuickAdd = function(el) {
  document.querySelectorAll('.qa-checkbox').forEach(cb => cb.checked = el.checked);
  updateQuickSelectedCount();
};

window.updateQuickSelectedCount = function() {
  const count = document.querySelectorAll('.qa-checkbox:checked').length;
  document.getElementById('quickSelectedCount').textContent = count;
};

window.proceedToSetupFS = function() {
  const selected = Array.from(document.querySelectorAll('.qa-checkbox:checked')).map(cb => parseInt(cb.value));
  if (selected.length === 0) return showToast('Vui lòng chọn ít nhất một sản phẩm', 'error');

  // Chuyển sang Modal thiết lập chung (reuse bulkFSModal logic)
  closeQuickAddFS();
  
  // Fake selectedIds cho modal bulk
  document.getElementById('fsModalTitle').textContent = 'Thiết lập Flash Sale (' + selected.length + ' SP)';
  document.getElementById('fsModalSubtitle').classList.remove('hidden');
  document.getElementById('selectedCount').textContent = selected.length;
  document.getElementById('singleProductId').value = '';
  
  // Lưu tạm list selected để submitBulkFlashSale dùng getSelectedIds
  // Nhưng vì getSelectedIds dùng selector, ta cần đánh dấu check cho các checkbox ẩn hoặc truyền trực tiếp.
  // Đơn giản hơn: sửa getSelectedIds để ưu tiên list được truyền.
  window._currentSelectedFromList = selected;

  document.getElementById('bulkFSModal').classList.remove('hidden');
};

// Sửa lại getSelectedIds để lấy từ list nếu có
window.getSelectedIds = function() {
  if (window._currentSelectedFromList && window._currentSelectedFromList.length > 0) {
    const list = window._currentSelectedFromList;
    window._currentSelectedFromList = null; // Clear sau khi lấy
    return list;
  }
  return Array.from(document.querySelectorAll('.product-checkbox:checked')).map(cb => parseInt(cb.value));
};

// BULK FLASH SALE MODAL
window.openBulkFlashSaleModal = function() {
  const ids = getSelectedIds();
  document.getElementById('fsModalTitle').textContent = 'Thêm hàng loạt vào Flash Sale';
  document.getElementById('fsModalSubtitle').classList.remove('hidden');
  document.getElementById('selectedCount').textContent = ids.length;
  document.getElementById('singleProductId').value = '';
  
  // Set default times
  const now = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  
  document.getElementById('bulkFsStart').value = now.toISOString().slice(0, 16);
  document.getElementById('bulkFsEnd').value = tomorrow.toISOString().slice(0, 16);
  
  document.getElementById('bulkFSModal').classList.remove('hidden');
};

window.closeBulkFSModal = function() {
  document.getElementById('bulkFSModal').classList.add('hidden');
};

// QUICK SELECT HELPERS
window.setQuickDiscount = function(val) {
  const input = document.getElementById('bulkFsDiscount');
  if (input) input.value = val;
};

window.setQuickTime = function(type) {
  const startInput = document.getElementById('bulkFsStart');
  const endInput = document.getElementById('bulkFsEnd');
  if (!startInput || !endInput) return;

  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (type === 'now') {
    start = now;
    end = new Date(now.getTime() + 86400000); // 24h sau
  } else if (type === 'tonight') {
    start.setHours(18, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'tomorrow') {
    start.setDate(now.getDate() + 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(now.getDate() + 1);
    end.setHours(23, 59, 59, 999);
  }

  startInput.value = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  endInput.value = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

window.submitBulkFlashSale = async function() {
  const singleId = document.getElementById('singleProductId').value;
  const productIds = singleId ? [parseInt(singleId)] : getSelectedIds();
  
  const discount = document.getElementById('bulkFsDiscount').value;
  const start = document.getElementById('bulkFsStart').value;
  const end = document.getElementById('bulkFsEnd').value;

  try {
    const body = {
      productIds,
      isFlashSale: true,
      discount: discount || 0,
      flashSaleStart: new Date(start).toISOString(),
      flashSaleEnd: new Date(end).toISOString()
    };

    // Luôn dùng bulk API cho tiện
    await BF.apiRequest('/api/admin/products/bulk-flashsale', { method: 'POST', body });
    showToast(`Đã thiết lập Flash Sale thành công!`, 'success');
    closeBulkFSModal();
    
    // Reset select all
    const selectAll = document.getElementById('selectAllProducts');
    if (selectAll) selectAll.checked = false;
    
    loadProducts();
    if (document.getElementById('tab-flashsale').classList.contains('hidden') === false) {
      loadFlashSale();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

function populateCategorySelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">-- Chọn danh mục --</option>';
  allCategories.forEach(c => {
    sel.innerHTML += `<option value="${c.id}" ${current == c.id ? 'selected' : ''}>${c.name}</option>`;
  });
}

// ADD PRODUCT
window.openAddModal = function () {
  document.getElementById('productFormTitle').textContent = 'Thêm sản phẩm mới';
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  
  document.getElementById('productModal').classList.remove('hidden');
};

window.closeProductModal = function () {
  document.getElementById('productModal').classList.add('hidden');
};






window.submitProductForm = async function (e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  
  const body = {
    name: document.getElementById('productName').value,
    description: document.getElementById('productDescription').value,
    price: document.getElementById('productPrice').value,
    originalPrice: document.getElementById('productOriginalPrice').value,
    discount: document.getElementById('productDiscount').value,
    stock: document.getElementById('productStock').value,
    image: document.getElementById('productImage').value,
    categoryId: document.getElementById('productCategory').value,
    location: document.getElementById('productLocation').value,
    
    
    
  };

  const btn = document.getElementById('submitProductBtn');
  BF.setButtonLoading(btn, true, id ? 'Đang cập nhật...' : 'Đang thêm...');

  try {
    if (id) {
      await BF.apiRequest(`/api/admin/products/${id}`, { method: 'PUT', body });
      showToast('Cập nhật sản phẩm thành công!', 'success');
    } else {
      await BF.apiRequest('/api/admin/products', { method: 'POST', body });
      showToast('Thêm sản phẩm thành công!', 'success');
    }
    closeProductModal();
    loadProducts();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    BF.setButtonLoading(btn, false);
  }
};

// EDIT PRODUCT
window.openEditModal = async function (id) {
  try {
    const res = await BF.apiRequest(`/api/admin/products?search=`);
    const product = res.data.find(p => p.id === id);
    if (!product) return showToast('Không tìm thấy sản phẩm', 'error');

    document.getElementById('productFormTitle').textContent = 'Chỉnh sửa sản phẩm';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productOriginalPrice').value = product.originalPrice || '';
    document.getElementById('productDiscount').value = product.discount || 0;
    document.getElementById('productStock').value = product.stock || 0;
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productLocation').value = product.location || '';
    

    populateCategorySelect('productCategory');
    setTimeout(() => { document.getElementById('productCategory').value = product.categoryId; }, 50);

    
    

    
    document.getElementById('productModal').classList.remove('hidden');
  } catch (err) {
    showToast(err.message, 'error');
  }
};


// TOGGLE FLASH SALE (từ bảng sản phẩm)
// TOGGLE FLASH SALE (từ bảng sản phẩm)
window.toggleFlashSale = async function (id, enable) {
  if (!enable) {
    if (!confirm(`Bạn có chắc muốn tắt Flash Sale cho sản phẩm này?`)) return;
    try {
      await BF.apiRequest(`/api/admin/products/${id}/flashsale`, { method: 'PATCH', body: { isFlashSale: false } });
      showToast(`Đã tắt Flash Sale thành công!`, 'success');
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  } else {
    // Bật Flash Sale: Hiện modal để chọn % và thời gian
    document.getElementById('fsModalTitle').textContent = 'Thiết lập Flash Sale cho SP #' + id;
    document.getElementById('fsModalSubtitle').classList.add('hidden');
    document.getElementById('singleProductId').value = id;
    
    // Default values
    document.getElementById('bulkFsDiscount').value = 10;
    const now = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    document.getElementById('bulkFsStart').value = now.toISOString().slice(0, 16);
    document.getElementById('bulkFsEnd').value = tomorrow.toISOString().slice(0, 16);

    document.getElementById('bulkFSModal').classList.remove('hidden');
  }
};

// FLASHSALE TAB
// ─────────────────────────────────────────────
async function loadFlashSale() {
  try {
    const res = await BF.apiRequest('/api/admin/products?isFlashSale=true');
    const tbody = document.getElementById('flashsaleTable');
    if(!tbody) return;
    tbody.innerHTML = '';
    if (!res.data || !res.data.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-gray-400">Không có sản phẩm nào trong Flash Sale</td></tr>';
      return;
    }
    // Sắp xếp theo thời gian bắt đầu (gần nhất lên đầu)
    const sortedData = res.data.sort((a, b) => new Date(a.flashSaleStart) - new Date(b.flashSaleStart));

    sortedData.forEach(p => {
      const now = new Date();
      const start = new Date(p.flashSaleStart);
      const end = new Date(p.flashSaleEnd);
      
      let statusHtml = '';
      if (now < start) {
        statusHtml = '<span class="badge badge-upcoming">Sắp diễn ra</span>';
      } else if (now > end) {
        statusHtml = '<span class="badge badge-ended">Đã kết thúc</span>';
      } else {
        statusHtml = '<span class="badge badge-active animate-pulse">Đang diễn ra</span>';
      }

      tbody.innerHTML += `
        <tr id="fs-row-${p.id}">
          <td style="color:#aaa;font-size:12px">${p.id}</td>
          <td><img src="${p.image || 'https://placehold.co/100x100'}" style="width:44px;height:44px;object-fit:cover;border-radius:6px" onerror="this.onerror=null; this.src='https://placehold.co/100x100'"></td>
          <td style="font-weight:700;font-size:13px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${BF.escapeHtml(p.name)}</td>
          <td class="text-center"><span style="color:#cc0000;font-weight:700">-${p.discount}%</span></td>
          <td class="text-center">${statusHtml}</td>
          <td style="font-size:12px;color:#555">
            <span style="color:#aaa">BĐ:</span> ${p.flashSaleStart ? new Date(p.flashSaleStart).toLocaleString('vi-VN') : '—'}<br>
            <span style="color:#aaa">KT:</span> ${p.flashSaleEnd ? new Date(p.flashSaleEnd).toLocaleString('vi-VN') : '—'}
          </td>
          <td class="text-center">
            <button onclick="removeFlashSale(${p.id})" class="btn-ghost" style="padding:5px 12px;font-size:12px;color:#cc0000;border-color:#ffcccc">
              <i class="fa-solid fa-trash-can"></i> Xóa khỏi FS
            </button>
          </td>
        </tr>`;
    });
  } catch (err) {
    console.error('Lỗi load flash sale products:', err);
  }
}

window.addFlashSale = async function() {
  const rawIds = document.getElementById('fsProductId').value;
  const discount = document.getElementById('fsDiscount').value;
  const start = document.getElementById('fsStart').value;
  const end = document.getElementById('fsEnd').value;
  
  if(!rawIds.trim()) return showToast('Vui lòng nhập ít nhất một ID sản phẩm', 'error');

  // Xử lý tách nhiều ID (ví dụ "1, 2, 3" -> [1, 2, 3])
  const productIds = rawIds.split(',')
    .map(id => id.trim())
    .filter(id => id !== "")
    .map(id => parseInt(id))
    .filter(id => !isNaN(id));

  if (productIds.length === 0) return showToast('Danh sách ID không hợp lệ', 'error');
  
  try {
    const body = { 
      productIds,
      isFlashSale: true, 
      discount: discount || 0,
    };
    if (start) body.flashSaleStart = new Date(start).toISOString();
    else body.flashSaleStart = new Date().toISOString();
    
    if (end) body.flashSaleEnd = new Date(end).toISOString();
    else body.flashSaleEnd = new Date(Date.now() + 86400000).toISOString();
    
    // Gọi API bulk thay vì API đơn lẻ
    await BF.apiRequest(`/api/admin/products/bulk-flashsale`, { method: 'POST', body });
    showToast(`Đã thêm ${productIds.length} sản phẩm vào Flash Sale!`, 'success');
    document.getElementById('fsProductId').value = '';
    loadFlashSale();
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }
};

window.removeFlashSale = async function(id) {
  if (!confirm('Xóa sản phẩm này khỏi danh sách Flash Sale?')) return;
  try {
    await BF.apiRequest(`/api/admin/products/${id}/flashsale`, { method: 'PATCH', body: { isFlashSale: false } });
    showToast('Đã xóa khỏi Flash Sale!', 'success');
    loadFlashSale();
    if (currentFilter === 'flashsale') loadProducts(); // just in case
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// TOGGLE FLASH SALE

// DELETE PRODUCT
window.deleteProduct = async function (id, name) {
  if (!confirm(`Xóa sản phẩm "${name}"?\nHành động này không thể hoàn tác!`)) return;
  try {
    await BF.apiRequest(`/api/admin/products/${id}`, { method: 'DELETE' });
    showToast('Xóa sản phẩm thành công!', 'success');
    loadProducts();
  } catch (err) {
    showToast('' + err.message, 'error');
  }
};

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────
async function loadOrders() {
  try {
    const res = await BF.apiRequest('/api/admin/orders');
    const tbody = document.getElementById('fullOrdersTable');
    tbody.innerHTML = '';

    if (!res.data.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-gray-400">Chưa có đơn hàng nào</td></tr>';
      return;
    }

    res.data.forEach(o => {
      tbody.innerHTML += `
        <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
          <td class="p-3 font-bold text-gray-800 text-sm">${o.orderNumber}</td>
          <td class="p-3">
            <div class="font-medium text-sm text-gray-800">${o.user?.name || '—'}</div>
            <div class="text-xs text-gray-400">${o.user?.email || ''}</div>
          </td>
          <td class="p-3 text-gray-400 text-xs">${fmtDate(o.createdAt)}</td>
          <td class="p-3 font-bold text-red-600 text-sm">${fmt(o.finalPrice)}</td>
          <td class="p-3">${statusBadge(o.status)}</td>
          <td class="p-3 text-xs text-gray-500">${o.items?.map(i => i.product?.name).join(', ') || '—'}</td>
        </tr>`;
    });
  } catch (err) {
    console.error('Lỗi load orders:', err);
  }
}

// ─────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────
async function loadCustomers() {
  try {
    const res = await BF.apiRequest('/api/admin/customers');
    const tbody = document.getElementById('customersTable');
    tbody.innerHTML = '';

    if (!res.data.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-gray-400">Chưa có khách hàng nào</td></tr>';
      return;
    }

    res.data.forEach(u => {
      tbody.innerHTML += `
        <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
          <td class="p-3 text-xs text-gray-400 font-medium">${u.id}</td>
          <td class="p-3 font-medium text-gray-800 text-sm">${BF.escapeHtml(u.name)}</td>
          <td class="p-3 text-gray-600 text-sm">${u.email}</td>
          <td class="p-3 text-gray-600 text-sm">${u.phone || '—'}</td>
          <td class="p-3 text-center">
            <span class="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">${u._count?.orders || 0} đơn</span>
          </td>
          <td class="p-3 text-gray-400 text-xs">${fmtDate(u.createdAt)}</td>
        </tr>`;
    });
  } catch (err) {
    console.error('Lỗi load customers:', err);
  }
}

// ─────────────────────────────────────────────
// WARM-UP CACHE
// ─────────────────────────────────────────────
window.triggerWarmup = async function () {
  const btn = document.getElementById('warmupBtn');
  const msg = document.getElementById('adminMessage');
  BF.setButtonLoading(btn, true, 'Đang nạp cache...');
  msg.textContent = '';
  try {
    const data = await BF.apiRequest('/api/flashsale/warmup', { method: 'POST' });
    msg.innerHTML = `<span class="text-green-600">${data.message || 'Cache Warm-up thành công!'}</span>`;
  } catch (err) {
    msg.innerHTML = `<span class="text-red-600">${err.message}</span>`;
  } finally {
    BF.setButtonLoading(btn, false);
  }
};

// ─────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'show ' + type;
  setTimeout(() => { t.className = ''; }, 3000);
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (!checkAdmin()) return;

  // Search products
  const searchInput = document.getElementById('productSearch');
  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadProducts(), 400);
    });
  }

  switchTab('dashboard');
});
