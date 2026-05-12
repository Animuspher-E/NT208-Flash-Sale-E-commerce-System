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
  flash: 15,
  best: 15,
  recommend: 15
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