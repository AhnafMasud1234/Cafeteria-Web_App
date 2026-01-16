# 🍽️ Cafeteria Management System

A modern, full-stack web application for managing cafeteria operations with real-time order tracking, inventory management, and customer ordering interface.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)
![React](https://img.shields.io/badge/React-18+-61dafb.svg)

---

## 🌟 Features

### 👨‍💼 Admin Dashboard
- **Comprehensive Analytics** - Real-time metrics with 8+ interactive charts
- **Inventory Management** - Full CRUD operations for menu items
- **Order Management** - Track and update order status with one click
- **Stock Alerts** - Automatic low-stock and out-of-stock notifications
- **Session Management** - Auto-logout after 60 seconds of inactivity
- **Real-time Updates** - Auto-refresh every 5-10 seconds

### 👥 Customer Interface
- **Daily Specials** - Highlighted items with discount badges
- **Favorites System** - Save and access favorite items quickly
- **Dietary Filters** - Filter by vegetarian, vegan, gluten-free
- **Interactive Modals** - Detailed item info with nutrition charts
- **Shopping Cart** - Real-time cart with discount calculation
- **Order Tracking** - Live order status with color-coded badges
- **Rating System** - Rate completed orders

### 🔧 Technical Features
- **25+ REST API Endpoints** - Comprehensive backend API
- **MongoDB Database** - Flexible NoSQL data storage
- **Real-time Updates** - Automatic data refresh
- **Responsive Design** - Works on all screen sizes
- **Modern UI/UX** - Smooth animations and transitions
- **Toast Notifications** - User feedback for all actions

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern, fast Python web framework
- **MongoDB** - NoSQL database for flexible data storage
- **Pymongo** - MongoDB driver for Python
- **Pydantic** - Data validation using Python type hints
- **Uvicorn** - ASGI server for production

### Frontend
- **React** - UI library for building interactive interfaces
- **Vite** - Next-generation frontend build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Composable charting library
- **React Router** - Client-side routing

---

## 📁 Project Structure
```
cafeteria-web_app/
├── app/                          # Backend (FastAPI)
│   ├── core/
│   │   └── models.py            # Data models (Item, Order, Favorite)
│   ├── storage/
│   │   └── mongo_repo.py        # MongoDB repository
│   ├── fastapi_api.py           # API route handlers
│   ├── fastapi_app.py           # FastAPI application setup
│   └── run_fastapi.py           # Development server
│
├── frontend/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CustomerPage.jsx # Customer ordering interface
│   │   │   └── AdminPage.jsx    # Admin dashboard
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Global styles
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.js           # Vite configuration
│   └── tailwind.config.js       # Tailwind configuration
│
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **MongoDB 6.0+**
- **Git**

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/AhnafMasud1234/Cafeteria-Web_App.git
cd Cafeteria-Web_App
```

#### 2. Setup Backend
```bash
# Navigate to backend directory
cd app

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Mac/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
cp .env.example .env
```

#### 3. Setup MongoDB
```bash
# Start MongoDB (Mac with Homebrew)
brew services start mongodb-community

# Or start manually
mongod --config /usr/local/etc/mongod.conf
```

#### 4. Seed Database
```bash
# The database will be seeded automatically on first run
python run_fastapi.py
```

#### 5. Setup Frontend
```bash
# Open new terminal
cd frontend

# Install dependencies
npm install
```

---

## 🎮 Running the Application

### Start Backend (Terminal 1)
```bash
cd app
source .venv/bin/activate  # Activate virtual environment
python run_fastapi.py
```

Backend will run on: **http://127.0.0.1:8000**

### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

Frontend will run on: **http://localhost:5173**

---

## 🔑 Admin Access

- **URL:** http://localhost:5173 → Click "Admin Panel"
- **Admin Key:** `cafeteria123`
- **Session Duration:** 60 seconds of inactivity

---

## 📡 API Documentation

Once the backend is running, access interactive API docs:

- **Swagger UI:** http://127.0.0.1:8000/docs
- **ReDoc:** http://127.0.0.1:8000/redoc

### Key Endpoints

#### Items
- `GET /api/items` - Get all items (with filters)
- `POST /api/items` - Create new item
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item

#### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/{customer_id}` - Get customer orders
- `GET /api/admin/orders` - Get all orders (admin)
- `PUT /api/admin/orders/{id}/status` - Update order status

#### Favorites
- `POST /api/favorites/{item_id}` - Add to favorites
- `DELETE /api/favorites/{item_id}` - Remove from favorites
- `GET /api/favorites/{customer_id}` - Get user favorites

#### Analytics
- `GET /api/analytics/top-selling` - Top selling items
- `GET /api/analytics/top-rated` - Top rated items
- `GET /api/daily-specials` - Get daily specials

---

## 🎨 Screenshots

### Customer Interface
![Customer Interface](https://via.placeholder.com/800x450?text=Customer+Interface)

### Admin Dashboard
![Admin Dashboard](https://via.placeholder.com/800x450?text=Admin+Dashboard)

### Order Tracking
![Order Tracking](https://via.placeholder.com/800x450?text=Order+Tracking)

---

## 🧪 Testing

### Backend Tests
```bash
cd app
pytest tests/
```

---

## 🌐 Deployment

### Backend (Render.com)
1. Create account on Render.com
2. Connect GitHub repository
3. Create new Web Service
4. Set environment variables
5. Deploy

### Frontend (Vercel)
1. Create account on Vercel
2. Import GitHub repository
3. Set build command: `npm run build`
4. Deploy

### Database (MongoDB Atlas)
1. Create free cluster
2. Get connection string
3. Update `MONGODB_URL` in production

---

## 🔧 Configuration

### Environment Variables

Create `.env` file in app directory:
```bash
MONGODB_URL=mongodb://127.0.0.1:27017
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

For production, update with your MongoDB Atlas URL and production frontend URL.

---

## 📝 Development

### Code Style
- Backend: Follow PEP 8
- Frontend: ESLint with React recommended rules
- Use Prettier for formatting

### Git Workflow
```bash
git checkout -b feature/your-feature
# Make changes
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

---

## 🐛 Known Issues

- Admin password is hardcoded (for demonstration only)
- No user authentication system (planned for v2.0)
- Real-time updates use polling (WebSockets planned)

---

## 🚧 Future Improvements

- [ ] JWT-based authentication
- [ ] WebSocket support for real-time updates
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced reporting and analytics
- [ ] Inventory forecasting

---

## 📄 License

This project is for educational purposes.

---

## 👨‍💻 Author

**Ahnaf Masud**
- GitHub: [@AhnafMasud1234](https://github.com/AhnafMasud1234)
- Repository: [Cafeteria-Web_App](https://github.com/AhnafMasud1234/Cafeteria-Web_App)

---

## 🙏 Acknowledgments

- FastAPI documentation
- React documentation
- Tailwind CSS
- Recharts library
- MongoDB documentation

---

## 📞 Support

For questions or issues, please open an issue on GitHub.

---

**Built with ❤️ using FastAPI, React, and MongoDB**


