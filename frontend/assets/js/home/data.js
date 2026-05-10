let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const API_URL = "http://localhost:3000"; 

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
  Electronics: "Thiết bị điện tử",
  Fashion: "Thời trang",
  Beauty: "Sắc đẹp",
  Home: "Nhà cửa",
  Sports: "Thể thao",
  Gaming: "Gaming",
  Books: "Sách",
  Accessories: "Phụ kiện",
  Health: "Sức khỏe",
  Camera: "Máy ảnh",
  Shoes: "Giày dép",
  Kids: "Mẹ & Bé",
  Toys: "Đồ chơi",
  Pets: "Thú cưng"
};

let limit = {
  flash: 25,
  best: 25,
  recommend: 25
};

let currentCategory = null;