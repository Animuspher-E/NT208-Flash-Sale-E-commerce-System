const BF = window.ECommerce;

// Định dạng tiền tệ
function formatCurrency(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' đ';
}

// Định dạng ngày
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
}

// Kiểm tra quyền Admin
function checkAdmin() {
  const user = BF.getUser();
  const token = BF.getToken();

  if (!token || !user || user.role !== 'admin') {
    alert('Bạn không có quyền truy cập trang này!');
    window.location.href = 'home.html';
    return false;
  }
  return true;
}

// SPA: Chuyển đổi Tab
window.switchTab = function(tabId) {
  // Ẩn tất cả tab
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.add('hidden');
  });
  
  // Xóa active style trên tất cả nav buttons
  document.querySelectorAll('.nav-btn').forEach(el => {
    el.className = 'nav-btn flex items-center px-3 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-red-600 rounded-lg font-medium transition-colors';
  });

  // Hiện tab được chọn
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  
  // Thêm active style cho nav button được chọn
  const activeNav = document.getElementById(`nav-${tabId}`);
  if (activeNav) {
    activeNav.className = 'nav-btn flex items-center px-3 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium';
  }

  // Tùy theo tab mà load dữ liệu
  if (tabId === 'dashboard') loadDashboard();
  if (tabId === 'products') loadProducts();
  if (tabId === 'orders') loadFullOrders();
  if (tabId === 'customers') loadCustomers();
}

// Load Dashboard (Stats + Recent Orders)
async function loadDashboard() {
  try {
    const statsRes = await BF.apiRequest('/api/admin/stats');
    if (statsRes.success) {
      const d = statsRes.data;
      document.getElementById('stat-totalOrders').textContent = d.totalOrders.toLocaleString();
      document.getElementById('stat-paidOrders').textContent = d.paidOrders.toLocaleString();
      document.getElementById('stat-totalUsers').textContent = d.totalUsers.toLocaleString();
      document.getElementById('stat-totalRevenue').textContent = formatCurrency(d.totalRevenue);
    }

    const ordersRes = await BF.apiRequest('/api/admin/orders');
    if (ordersRes.success) {
      const tbody = document.getElementById('recentOrdersTable');
      tbody.innerHTML = '';
      if (ordersRes.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-gray-500">Chưa có đơn hàng nào</td></tr>';
        return;
      }

      ordersRes.data.forEach(o => {
        let statusClass = 'bg-gray-100 text-gray-800';
        if (o.status === 'pending') statusClass = 'bg-yellow-100 text-yellow-800';
        if (o.status === 'delivered') statusClass = 'bg-green-100 text-green-800';
        if (o.status === 'processing') statusClass = 'bg-blue-100 text-blue-800';
        if (o.status === 'cancelled') statusClass = 'bg-red-100 text-red-800';

        tbody.innerHTML += `
          <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="py-4 font-bold text-gray-800">${o.orderNumber}</td>
            <td class="py-4 text-gray-600">${o.user?.name || 'Unknown'}</td>
            <td class="py-4 text-gray-500 text-xs">${formatDate(o.createdAt)}</td>
            <td class="py-4 font-medium text-gray-800">${formatCurrency(o.finalPrice)}</td>
            <td class="py-4"><span class="px-2.5 py-1 ${statusClass} rounded-md font-medium text-xs">${o.status}</span></td>
          </tr>
        `;
      });
    }
  } catch (error) {
    console.error("Lỗi load dashboard:", error);
  }
}

// Load danh sách sản phẩm
async function loadProducts() {
  try {
    const res = await BF.apiRequest('/api/admin/products');
    if (res.success) {
      const tbody = document.getElementById('productsTable');
      tbody.innerHTML = '';
      if (res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-gray-500">Không có dữ liệu</td></tr>';
        return;
      }

      res.data.forEach(p => {
        tbody.innerHTML += `
          <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="p-3 font-medium text-gray-500">${p.id}</td>
            <td class="p-3"><img src="${p.image || '../assets/img/default-product.png'}" class="w-10 h-10 object-cover rounded-md"></td>
            <td class="p-3 font-medium text-gray-800 truncate max-w-xs">${p.name}</td>
            <td class="p-3 text-gray-600">${p.category?.name || 'N/A'}</td>
            <td class="p-3 font-medium text-red-600">${formatCurrency(p.price)}</td>
            <td class="p-3 font-bold ${p.stock > 10 ? 'text-green-600' : 'text-red-600'}">${p.stock}</td>
            <td class="p-3 text-center">
              <button class="text-blue-600 hover:text-blue-800 mr-2"><i class="fa-solid fa-pen-to-square"></i></button>
              <button class="text-red-600 hover:text-red-800"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `;
      });
    }
  } catch (error) {
    console.error("Lỗi load products:", error);
  }
}

// Load danh sách đơn hàng đầy đủ
async function loadFullOrders() {
  try {
    const res = await BF.apiRequest('/api/admin/orders');
    if (res.success) {
      const tbody = document.getElementById('fullOrdersTable');
      tbody.innerHTML = '';
      if (res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-gray-500">Không có dữ liệu</td></tr>';
        return;
      }

      res.data.forEach(o => {
        let statusClass = 'bg-gray-100 text-gray-800';
        if (o.status === 'pending') statusClass = 'bg-yellow-100 text-yellow-800';
        if (o.status === 'delivered') statusClass = 'bg-green-100 text-green-800';
        if (o.status === 'processing') statusClass = 'bg-blue-100 text-blue-800';
        if (o.status === 'cancelled') statusClass = 'bg-red-100 text-red-800';

        tbody.innerHTML += `
          <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="p-3 font-bold text-gray-800">${o.orderNumber}</td>
            <td class="p-3 text-gray-600">${o.user?.name || 'Unknown'}</td>
            <td class="p-3 text-gray-500 text-xs">${formatDate(o.createdAt)}</td>
            <td class="p-3 font-medium text-gray-800">${formatCurrency(o.finalPrice)}</td>
            <td class="p-3"><span class="px-2.5 py-1 ${statusClass} rounded-md font-medium text-xs">${o.status}</span></td>
            <td class="p-3 text-center">
              <button class="text-blue-600 hover:text-blue-800 mr-2"><i class="fa-solid fa-eye"></i></button>
              <button class="text-green-600 hover:text-green-800"><i class="fa-solid fa-check"></i></button>
            </td>
          </tr>
        `;
      });
    }
  } catch (error) {
    console.error("Lỗi load full orders:", error);
  }
}

// Load danh sách khách hàng
async function loadCustomers() {
  try {
    const res = await BF.apiRequest('/api/admin/customers');
    if (res.success) {
      const tbody = document.getElementById('customersTable');
      tbody.innerHTML = '';
      if (res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-gray-500">Không có dữ liệu</td></tr>';
        return;
      }

      res.data.forEach(c => {
        tbody.innerHTML += `
          <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="p-3 font-medium text-gray-500">${c.id}</td>
            <td class="p-3 font-medium text-gray-800">${c.name}</td>
            <td class="p-3 text-gray-600">${c.email}</td>
            <td class="p-3 text-gray-600">${c.phone || 'N/A'}</td>
            <td class="p-3 text-gray-500 text-xs">${formatDate(c.createdAt)}</td>
          </tr>
        `;
      });
    }
  } catch (error) {
    console.error("Lỗi load customers:", error);
  }
}

// Khởi chạy khi load trang
window.addEventListener('DOMContentLoaded', () => {
  if (checkAdmin()) {
    // Mặc định load tab dashboard
    switchTab('dashboard');
  }
});

// Hàm Warm-up Cache
window.triggerWarmup = async function() {
  const btn = document.getElementById('warmupBtn');
  const msg = document.getElementById('adminMessage');
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xử lý...';
  msg.textContent = "";

  try {
    const data = await BF.apiRequest('/api/flashsale/warmup', {
      method: 'POST'
    });
    
    msg.innerHTML = `<span class="text-green-600"><i class="fa-solid fa-circle-check"></i> ${data.message || "Cache Warm-up thành công!"}</span>`;
  } catch (error) {
    msg.innerHTML = `<span class="text-red-600"><i class="fa-solid fa-circle-xmark"></i> ${error.message || "Có lỗi xảy ra khi warm-up cache."}</span>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Bắt đầu Warm-up';
  }
};
