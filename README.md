# � Nano Geyser — Website Máy Lọc Nước

Website thương mại điện tử hoàn chỉnh cho Nano Geyser - thương hiệu máy lọc nước công nghệ Mỹ. Xây dựng với React + Vite + TypeScript + TailwindCSS + Node.js + Express, sử dụng JSON files làm cơ sở dữ liệu.

---

## 📁 Cấu Trúc Dự Án

```
nano-geyser/
│
├── frontend/              ← Website công khai (port 5173)
│   └── src/
│       ├── components/    ← ProductCard, Header, Footer, Button, SectionTitle
│       ├── pages/         ← Home, Shop, ProductDetail, Cart
│       ├── layouts/       ← MainLayout
│       ├── hooks/         ← useFetch (generic data fetcher)
│       ├── services/      ← api.ts (tất cả API calls)
│       ├── store/         ← cartContext.tsx (quản lý giỏ hàng)
│       ├── types/         ← TypeScript interfaces
│       └── routes/        ← React Router config
│
├── admin/                 ← Trang quản trị (port 5174)
│   └── src/
│       ├── components/
│       ├── pages/         ← Dashboard, Products, Categories, Orders, Users, Subscribers
│       ├── layouts/       ← AdminLayout (sidebar)
│       ├── services/      ← adminApi.ts
│       └── types/
│
├── server/                ← Express + TypeScript API (port 3001)
│   └── src/
│       ├── controllers/   ← productController, categoryController, orderController, etc.
│       ├── routes/        ← Định nghĩa routes
│       ├── services/      ← productService, categoryService, etc. (business logic)
│       ├── utils/         ← db.ts (đọc/ghi JSON)
│       ├── middleware/    ← error.ts (xử lý lỗi toàn cục)
│       └── data/          ← *.json (products, categories, orders, users, subscribers)
│
└── package.json           ← Root với concurrently scripts
```

---

## 🚀 Bắt Đầu

### 1. Cài Đặt Dependencies

```bash
# Từ thư mục gốc:
npm run install:all

# Hoặc cài đặt riêng lẻ:
cd server && npm install
cd ../frontend && npm install
cd ../admin && npm install
```

### 2. Chạy Ứng Dụng

```bash
# Tùy chọn A: Chạy tất cả cùng lúc
npm run dev

# Tùy chọn B: Chạy riêng lẻ
npm run dev:server    # khởi động server  → http://localhost:3001
npm run dev:frontend  # khởi động frontend → http://localhost:5173
npm run dev:admin     # khởi động admin   → http://localhost:5174
```

### 3. Mở Trình Duyệt

| Ứng dụng   | URL                        |
|------------|---------------------------|
| Website    | http://localhost:5173      |
| Admin      | http://localhost:5174      |
| API        | http://localhost:3001/api  |

---

## 🔌 REST API Reference

### Sản phẩm (Products)
| Method | Endpoint            | Mô tả               |
|--------|---------------------|---------------------|
| GET    | /api/products       | Danh sách (lọc theo ?categoryId, ?search, ?featured) |
| GET    | /api/products/:id   | Chi tiết sản phẩm   |
| POST   | /api/products       | Tạo sản phẩm mới    |
| PUT    | /api/products/:id   | Cập nhật sản phẩm   |
| DELETE | /api/products/:id   | Xóa sản phẩm        |

### Danh mục (Categories)
| Method | Endpoint               | Mô tả               |
|--------|------------------------|---------------------|
| GET    | /api/categories        | Danh sách tất cả    |
| GET    | /api/categories/:id    | Chi tiết danh mục   |
| POST   | /api/categories        | Tạo danh mục        |
| PUT    | /api/categories/:id    | Cập nhật danh mục   |
| DELETE | /api/categories/:id    | Xóa danh mục        |

### Đơn hàng (Orders)
| Method | Endpoint          | Mô tả                           |
|--------|-------------------|---------------------------------|
| GET    | /api/orders       | Danh sách (lọc theo ?userId)    |
| GET    | /api/orders/:id   | Chi tiết đơn hàng               |
| POST   | /api/orders       | Tạo đơn hàng                    |
| PUT    | /api/orders/:id   | Cập nhật trạng thái             |
| DELETE | /api/orders/:id   | Xóa đơn hàng                    |

### Người dùng (Users)
| Method | Endpoint              | Mô tả           |
|--------|-----------------------|-----------------|
| GET    | /api/users            | Danh sách       |
| GET    | /api/users/:id        | Chi tiết        |
| POST   | /api/users            | Đăng ký         |
| PUT    | /api/users/:id        | Cập nhật        |
| DELETE | /api/users/:id        | Xóa             |
| POST   | /api/users/auth/login | Đăng nhập       |

### Đăng ký nhận tin (Subscribers)
| Method | Endpoint                  | Mô tả          |
|--------|---------------------------|----------------|
| GET    | /api/subscribers          | Danh sách      |
| POST   | /api/subscribers          | Đăng ký        |
| DELETE | /api/subscribers/:id      | Hủy đăng ký    |

---

## 🧪 Ví Dụ API Requests

```bash
# Lấy tất cả sản phẩm
curl http://localhost:3001/api/products

# Lấy sản phẩm nổi bật
curl http://localhost:3001/api/products?featured=true

# Tìm kiếm sản phẩm
curl http://localhost:3001/api/products?search=nano

# Tạo sản phẩm mới
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Máy lọc nước GB-05",
    "description": "Máy lọc nước cao cấp",
    "price": 9990000,
    "categoryId": "cat-001",
    "images": ["https://example.com/img.jpg"],
    "stock": 50,
    "rating": 4.5,
    "reviewCount": 100,
    "featured": false
  }'

# Đăng ký nhận tin
curl -X POST http://localhost:3001/api/subscribers \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## 🏗️ Kiến Trúc

### Frontend
- **Giỏ hàng**: Quản lý state toàn cục với React Context + useReducer
- **Data Fetching**: Hook `useFetch` tùy chỉnh với loading/error/refetch
- **Routing**: React Router v6 với nested routes và layouts
- **Styling**: TailwindCSS với màu sắc tùy chỉnh + Google Fonts

### Backend
- **Service Layer**: Tách biệt business logic khỏi controllers
- **Data Persistence**: JSON files với Node.js `fs` module
- **Error Handling**: Middleware tập trung, try/catch trong controllers
- **CORS**: Cho phép localhost:5173 và localhost:5174

### Luồng Dữ Liệu
```
React Component
  → useFetch hook / direct api call
    → services/api.ts (fetch wrapper)
      → Express routes
        → Controller (validation)
          → Service (business logic)
            → utils/db.ts (read/write JSON)
```

---

## � Sản Phẩm Mẫu

- Máy lọc nước Nano Geyser GB-01 (9 cấp lọc)
- Máy lọc nước Nano Geyser GB-02 Premium (10 cấp lọc)
- Máy lọc nước Nano Geyser GB-03 Compact
- Máy lọc nước Nano Geyser GB-04 Smart (WiFi)
- Máy lọc công nghiệp IND-100 & IND-200
- Bộ lõi lọc thay thế
- Phụ kiện: Vòi rửa chén, Bình áp

---

## 🛠️ Công Nghệ

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, TypeScript, Tailwind |
| Admin    | React 18, Vite, TypeScript, Tailwind |
| Backend  | Node.js, Express, TypeScript        |
| Database | JSON files (fs module)              |
| Routing  | React Router v6                     |
| Fonts    | Fraunces (display) + Outfit (body)  |

---

## 📞 Liên Hệ

Website: https://nanogeyser.com
Email: info@nanogeyser.com
Hotline: 1900-xxxx

---

© 2024 Nano Geyser Vietnam. Bảo lưu mọi quyền.
