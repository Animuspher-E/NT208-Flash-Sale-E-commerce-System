let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const API_URL = (window.FLASH_SALE_API_URL || localStorage.getItem("api_url") || "http://localhost:3001").replace(/\/$/, "");

async function fetchFlashSaleProducts() {
  try {
    const res = await fetch(`${API_URL}/api/flashsale/products`);
    if (!res.ok) throw new Error();

    const result = await res.json();
    
    products = result.data || [];
    
    return products;
  } catch (err) {
    console.error("Lỗi load flash sale", err);
    return [];
  }
}

const categoryName = {
  Electronics: "Điện tử",
  Fashion: "Thời trang",
  Beauty: "Sức khỏe & Làm đẹp",
  Home: "Gia dụng",
  Sports: "Thể thao & Du lịch",
  Gaming: "Gaming",
  Books: "Sách & Văn phòng phẩm",
  Accessories: "Phụ kiện",
  Health: "Sức khỏe",
  Camera: "Máy ảnh",
  Shoes: "Giày dép",
  Kids: "Mẹ & Bé",
  Toys: "Đồ chơi",
  Pets: "Thú cưng"
};

let limit = {
  flash: 10,
  best: 10,
  recommend: 10
};

let currentPage = {
  best: 1,
  recommend: 1
};

let isPaginationActive = {
  best: false,
  recommend: false,
  flash: false
};

let itemsPerPage = 10; // 2 dòng * 5 cột (để dễ thấy phân trang với 17 SP hiện tại)

let currentCategory = null;