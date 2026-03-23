# MarketVerse

MarketVerse is a complete production-style full-stack marketplace web application.
Tagline: "Connect. Trade. Grow."

---

## 1. Project Architecture

The project consists of three main layers:
- **Frontend**: A React SPA (initialized with Vite), utilizing `react-router-dom` for navigation, `axios` for HTTP requests, and `react-bootstrap` for styling.
- **Backend**: A Python Flask application providing REST APIs. It uses PyMongo to talk to MongoDB, and PyJWT/bcrypt for authentication.
- **Database**: MongoDB running on `localhost:27017` by default with `marketverse` as the database name.

## 2. Folder Structure

```
MarketVerse/
├── backend/
│   ├── app.py                # Main Flask entry point
│   ├── config.py             # Configuration variables
│   ├── requirements.txt      # Python dependencies
│   ├── static/
│   │   └── uploads/          # Image uploads destination
│   ├── models/               # PyMongo wrapper classes
│   │   ├── cart_model.py
│   │   ├── product_model.py
│   │   └── user_model.py
│   ├── routes/               # API endpoint blueprints
│   │   ├── auth_routes.py
│   │   ├── cart_routes.py
│   │   └── product_routes.py
│   └── utils/
│       └── auth_middleware.py# JWT verification decorators
├── frontend/
│   ├── package.json          # Node dependencies
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx           # Router definitions
│       ├── main.jsx          # React initialization
│       ├── index.css         # Global styles
│       ├── components/       # Reusable React components
│       │   ├── NavigationBar.jsx
│       │   ├── ProductCard.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── SearchBar.jsx
│       ├── pages/            # Next.js-like page components
│       │   ├── AddProduct.jsx
│       │   ├── BuyerDashboard.jsx
│       │   ├── Cart.jsx
│       │   ├── Catalogue.jsx
│       │   ├── EditProduct.jsx
│       │   ├── Login.jsx
│       │   ├── ProductDetails.jsx
│       │   ├── Register.jsx
│       │   └── SellerDashboard.jsx
│       └── services/
│           └── api.js        # Axios network requests
└── README.md
```

## 3. Backend Code Summary

Backend logic is modular. `app.py` registers Flask blueprints found in `routes`. Authentication routes handle `/register`, `/login`, and `/me`. Product routes support POST (FormData mapped for images), GET (all/seller/id), PUT, DELETE. `cart_model.py` modifies arrays within an embedded MongoDB document to avoid excessive collections for the cart state. The `auth_middleware.py` utilizes custom `@token_required`, `@seller_required`, `@buyer_required` decorators using JWT parsing.

## 4. Frontend Code Summary

The frontend utilizes context via `localStorage` combined with Axios interceptors (`features/api.js`). Navigation components are guarded by `<ProtectedRoute roleRequired="...">`. Product details use React Router hooks (`useParams`) and trigger API fetches for related products. Form components utilize `FormData` serialization objects ensuring `multipart/form-data` support for the `Image` inputs.

## 5. MongoDB Schema Explanation

**Users Collection (`users`)**
- `_id`: ObjectId (auto-generated)
- `name`: string
- `email`: string (unique indexed via usage context)
- `password`: string (bcrypt hashed)
- `role`: string ("buyer" or "seller")

**Products Collection (`products`)**
- `_id`: ObjectId
- `seller_id`: string (Reference to User `_id`)
- `item_name`: string
- `image`: string (Filepath to uploaded image string)
- `price`: float
- `description`: string
- `category`: string
- `created_at`: Date/Time

**Cart Collection (`carts`)**
- `_id`: ObjectId
- `buyer_id`: string (Reference to User `_id`)
- `products`: Array of JS Objects `[{ product_id: string, quantity: integer }]`

## 6. API Explanation

**AUTH:**
- `POST /api/auth/register` (body: name, email, password, role) - Registers a user.
- `POST /api/auth/login` (body: email, password) - Authenticates returning a JWT token.
- `GET /api/auth/me` (header: Auth) - Retrieves current payload context.

**PRODUCTS:**
- `POST /api/products/add` (FormData + Image + Auth:Seller) - Posts listing.
- `GET /api/products/all` - Scrapes all products mapped to seller names.
- `GET /api/products/seller` (Auth:Seller) - Filters products solely owned by caller.
- `GET /api/products/<id>` - Returns singular detailed product array.
- `PUT /api/products/update/<id>` (FormData + Optional Image + Auth:Seller) - Updates properties.
- `DELETE /api/products/delete/<id>` (Auth:Seller) - Removes product.

**CART:**
- `POST /api/cart/add` (body: product_id, quantity + Auth:Buyer) - Adds an item directly, increasing qty if existing.
- `GET /api/cart/` (Auth:Buyer) - Recalculates cart data alongside embedded product models.
- `PUT /api/cart/update` (body: product_id, quantity + Auth:Buyer) - Upgrades or downgrades pure numerical quantity metric.
- `DELETE /api/cart/remove/<id>` (Auth:Buyer) - Excises target from nested Array payload.

## 7. Setup Instructions

1. **Pre-requisites**: ensure `node.js`, `python`, and `mongodb` daemon are tracking & available directly to the system. MongoDB should be running at `mongodb://localhost:27017/`.
2. **Setup Backend**:
   - `cd MarketVerse/backend`
   - Create Python Virtual Environment: `python -m venv venv`
   - Activate VE: `.\venv\Scripts\activate` (Windows)
   - Install reqs: `pip install -r requirements.txt`
   - Run Server: `python app.py` (Servers automatically bind to `:5000`)
3. **Setup Frontend**:
   - `cd MarketVerse/frontend`
   - Install packages: `npm install`
   - Run Dev Env: `npm run dev` (Runs optimally on `:5173`)

## 8. requirements.txt

```txt
Flask==3.0.3
Flask-CORS==4.0.0
pymongo==4.6.2
PyJWT==2.8.0
bcrypt==4.1.2
Werkzeug==3.0.1
```

## 9. package.json dependencies

Frontend main packages installed:
`react`, `react-dom`, `react-router-dom`, `react-bootstrap`, `bootstrap`, `axios`, `jwt-decode`, `react-icons`.

> **Note**: `Vite` performs bundling natively via `@vitejs/plugin-react` inside `./frontend/package.json`.
