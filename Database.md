# 📦 Database Documentation  
## Flash Sale E-commerce System  
**Database:** MySQL + Prisma ORM  

---

# Table: User

## Mô tả
Bảng User dùng để lưu trữ toàn bộ thông tin tài khoản người dùng trong hệ thống.  
Đây là thực thể để xác định danh tính người mua hàng, phục vụ cho các chức năng như đăng nhập, đặt hàng, thanh toán và quản lý lịch sử giao dịch.  
Ngoài ra, bảng này còn hỗ trợ mở rộng cho các tính năng như xác thực, phân quyền, và theo dõi hành vi người dùng.

## Columns

| Column | Type | Ghi chú |
|--------|------|--------|
| id | Int | PK, tự tăng, định danh duy nhất cho mỗi user |
| email | String | Bắt buộc, unique, dùng để đăng nhập |
| password | String | Bắt buộc, lưu dưới dạng hash (bcrypt) |
| name | String | Bắt buộc, tên hiển thị của người dùng |
| phone | String | Không bắt buộc, số điện thoại |
| address | String | Không bắt buộc, địa chỉ giao hàng |
| role | String | Bắt buộc, phân quyền: `user` hoặc `admin` |
| createdAt | DateTime | Bắt buộc, thời điểm tạo tài khoản |
| updatedAt | DateTime | Bắt buộc, tự động cập nhật khi thay đổi |

## Relationships
- User 1-N Order → Một người dùng có thể tạo nhiều đơn hàng

---

# Table: Category

## Mô tả
Bảng Category dùng để phân loại sản phẩm thành các nhóm khác nhau như Electronics, Fashion,...  
Việc tách bảng này giúp hệ thống dễ dàng lọc sản phẩm, tối ưu truy vấn và hỗ trợ mở rộng khi số lượng sản phẩm lớn.

## Columns

| Column | Type | Ghi chú |
|--------|------|--------|
| id | Int | PK, tự tăng |
| name | String | Bắt buộc, unique, tên danh mục |
| createdAt | DateTime | Thời điểm tạo |

## Relationships
- Category 1-N Product → Một danh mục có nhiều sản phẩm

---

# Table: Product

## Mô tả
Bảng Product lưu trữ thông tin chi tiết của sản phẩm.  
Đây là bảng quan trọng nhất trong hệ thống, chứa dữ liệu phục vụ hiển thị UI như giá, giảm giá, rating, số lượng đã bán,...  
Ngoài ra còn hỗ trợ Flash Sale và quản lý tồn kho.

## Columns

| Column | Type | Ghi chú |
|--------|------|--------|
| id | Int | PK |
| name | String | Bắt buộc, tên sản phẩm |
| description | String | Mô tả chi tiết |
| price | Float | Giá hiện tại |
| originalPrice | Float | Giá trước khi giảm |
| discount | Float | % giảm giá |
| rating | Float | Điểm đánh giá trung bình |
| sold | Int | Số lượng đã bán |
| location | String | Nơi bán |
| image | String | URL hình ảnh |
| categoryId | Int | FK → Category |
| stock | Int | Số lượng tồn kho |
| minimumStock | Int | Ngưỡng cảnh báo |
| isFlashSale | Boolean | Có thuộc flash sale không |
| flashSaleStart | DateTime | Thời gian bắt đầu |
| flashSaleEnd | DateTime | Thời gian kết thúc |
| createdAt | DateTime | Ngày tạo |

## Relationships
- Product N-1 Category  
- Product 1-N OrderItem  
- Product 1-1 Inventory  
- Product 1-N FlashSale  
- Product 1-N Review  

---

# Table: Inventory

## Mô tả
Bảng Inventory quản lý tồn kho chi tiết của từng sản phẩm.  
Tách riêng bảng này giúp xử lý tốt các bài toán concurrency (nhiều người mua cùng lúc), đặc biệt trong Flash Sale.  
Các trường như reservedStock giúp tránh oversell (bán quá số lượng).

## Columns

| Column | Type | Ghi chú |
|--------|------|--------|
| id | Int | PK |
| productId | Int | FK → Product, unique |
| availableStock | Int | Số lượng có thể bán |
| reservedStock | Int | Số lượng đã giữ chỗ |
| damagedStock | Int | Hàng lỗi/hỏng |
| createdAt | DateTime | Ngày tạo |

## Relationships
- Inventory 1-1 Product  
- Inventory 1-N InventoryMovement  

---

# Table: InventoryMovement

## Mô tả
Bảng này lưu lại toàn bộ lịch sử thay đổi tồn kho.  
Giúp tracking các hoạt động như nhập hàng, xuất hàng, điều chỉnh tồn kho, hoàn trả,...

## Columns

| Column | Type | Ghi chú |
|--------|------|--------|
| id | Int | PK |
| inventoryId | Int | FK → Inventory |
| type | String | Loại: IN, OUT, ADJUST |
| quantity | Int | Số lượng thay đổi |
| reason | String | Lý do |
| createdAt | DateTime | Thời điểm |

## Relationships
- InventoryMovement N-1 Inventory  

---

# Table: Order

## Mô tả
Bảng Order lưu thông tin đơn hàng của người dùng.  
Quản lý toàn bộ lifecycle của đơn hàng từ lúc tạo → thanh toán → giao hàng.

## Columns

| Column | Type | Ghi chú |
|--------|------|--------|
| id | Int | PK |
| userId | Int | FK → User |
| orderNumber | String | Unique, mã đơn |
| totalPrice | Float | Tổng tiền ban đầu |
| finalPrice | Float | Sau giảm giá |
| status | String | pending, shipped,... |
| createdAt | DateTime | Ngày tạo |

## Relationships
- Order N-1 User  
- Order 1-N OrderItem  
- Order 1-N Payment  

---

# Table: OrderItem

## Mô tả
Bảng trung gian lưu danh sách sản phẩm trong một đơn hàng.  
Giúp hỗ trợ quan hệ nhiều-nhiều giữa Order và Product.

## Columns

| Column | Type | Ghi chú |
|--------|------|--------|
| id | Int | PK |
| orderId | Int | FK → Order |
| productId | Int | FK → Product |
| quantity | Int | Số lượng |
| unitPrice | Float | Giá tại thời điểm mua |
| discount | Float | % giảm |
| subtotal | Float | Thành tiền |

## Relationships
- OrderItem N-1 Order  
- OrderItem N-1 Product  

---

# Table: Payment

## Mô tả
Bảng Payment quản lý thông tin thanh toán cho đơn hàng.  
Hỗ trợ nhiều phương thức như chuyển khoản, ví điện tử,...

## Columns

| Column | Type | Ghi chú |
|--------|------|--------|
| id | Int | PK |
| orderId | Int | FK → Order |
| amount | Float | Số tiền |
| method | String | Phương thức |
| status | String | pending, completed |

## Relationships
- Payment N-1 Order  

---

# Table: FlashSale

## Mô tả
Bảng FlashSale lưu cấu hình giảm giá theo từng sản phẩm trong một khoảng thời gian cụ thể.  
Cho phép hệ thống tạo nhiều chiến dịch flash sale khác nhau.

## Columns

| Column | Type | Ghi chú |
|--------|------|--------|
| id | Int | PK |
| productId | Int | FK → Product |
| discount | Float | % giảm |
| quantity | Int | Số lượng áp dụng |
| startTime | DateTime | Bắt đầu |
| endTime | DateTime | Kết thúc |

## Relationships
- FlashSale N-1 Product  

---

# Table: Review

## Mô tả
Bảng Review lưu đánh giá của người dùng về sản phẩm.  
Dữ liệu này dùng để tính rating trung bình hiển thị trên UI.

## Columns

| Column | Type | Ghi chú |
|--------|------|--------|
| id | Int | PK |
| userId | Int | Người đánh giá |
| productId | Int | FK → Product |
| rating | Float | Điểm |
| comment | String | Nội dung |

## Relationships
- Review N-1 Product  

---

# Table: AuditLog

## Mô tả
Bảng AuditLog ghi lại các hành động quan trọng trong hệ thống như tạo đơn, cập nhật tồn kho,...  
Phục vụ mục đích debug, bảo mật và audit hệ thống.

## Columns

| Column | Type | Ghi chú |
|--------|------|--------|
| id | Int | PK |
| action | String | Hành động |
| entity | String | Bảng liên quan |
| entityId | Int | ID đối tượng |
| userId | Int | Người thực hiện |
| createdAt | DateTime | Thời gian |

---

# Tổng quan quan hệ (ERD dạng text)

- User 1-N Order  
- Order 1-N OrderItem  
- Product 1-N OrderItem  
- Category 1-N Product  
- Product 1-1 Inventory  
- Inventory 1-N InventoryMovement  
- Product 1-N FlashSale  
- Product 1-N Review  
- Order 1-N Payment  

---

# Business Rules

- Một user có thể tạo nhiều đơn hàng nhưng mỗi đơn chỉ thuộc 1 user  
- Một đơn hàng phải có ít nhất 1 sản phẩm  
- Không cho phép mua khi stock = 0  
- Flash sale chỉ áp dụng trong khoảng thời gian hợp lệ  
- Không được vượt quá quantity của flash sale  
- reservedStock dùng để tránh oversell  
- Rating sản phẩm được tính trung bình từ Review  

---

# Ghi chú

- Index đặt ở: email, productId, categoryId  
- Unique: email, orderNumber  
- Sử dụng cascade delete cho bảng con  
- Tách Inventory để xử lý concurrency tốt hơn  
- Discount lưu trực tiếp để tối ưu hiệu năng  