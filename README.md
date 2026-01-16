# 🍽️ Cafeteria Management System

A modern, full-stack web application for managing cafeteria operations with real-time order tracking, inventory management, and an interactive customer ordering interface.

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
- **Session Management** - Automatic timeout for security
- **Real-time Updates** - Data refreshes automatically

### 👥 Customer Interface
- **Daily Specials** - Highlighted promotional items with discounts
- **Favorites System** - Save and quickly access favorite menu items
- **Dietary Filters** - Filter menu by dietary preferences
- **Interactive Item Details** - View nutrition information and ingredients
- **Shopping Cart** - Real-time cart with automatic discount calculation
- **Order Tracking** - Live order status updates with visual indicators
- **Rating System** - Rate and review completed orders

### 🔧 Technical Features
- **RESTful API** - 25+ endpoints for complete functionality
- **MongoDB Database** - Flexible NoSQL data storage
- **Real-time Updates** - Automatic data synchronization
- **Responsive Design** - Optimized for all screen sizes
- **Modern UI/UX** - Smooth animations and intuitive navigation
- **Toast Notifications** - Instant user feedback

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern, high-performance Python web framework
- **MongoDB** - NoSQL database for flexible data storage
- **Pymongo** - MongoDB driver for Python
- **Pydantic** - Data validation and settings management
- **Uvicorn** - Lightning-fast ASGI server

### Frontend
- **React 18** - Component-based UI library
- **Vite** - Next-generation frontend build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Composable charting library for data visualization
- **React Router** - Declarative routing for React applications

---

## 📁 Project Structure
```
cafeteria-web_app/
├── app/                          # Backend (FastAPI)
│   ├── core/
│   │   └── models.py            # Data models (Item, Order, Favorite)
│   ├── storage/
│   │   └── mongo_repo.py        # MongoDB repository layer
│   ├── fastapi_api.py           # API route handlers
│   ├── fastapi_app.py           # FastAPI application configuration
│   └── run_fastapi.py           # Development server entry point
│
├── frontend/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CustomerPage.jsx # Customer ordering interface
│   │   │   └── AdminPage.jsx    # Admin dashboard
│   │   ├── App.jsx              # Root application component
│   │   ├── main.jsx             # React application entry point
│   │   └── index.css            # Global styles and animations
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.js           # Vite configuration
│   └── tailwind.config.js       # Tailwind CSS configuration
│
└── README.md                     # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11 or higher**
- **Node.js 18 or higher**
- **MongoDB 6.0 or higher**
- **Git**

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/AhnafMasud1234/Cafeteria-Web_App.git
cd Cafeteria-Web_App
```

#### 2. Backend Setup
```bash
# Navigate to backend directory
cd app

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Mac/Linux
# .venv\Scripts\activate   # On Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string
```

#### 3. Database Setup
```bash
# Ensure MongoDB is running
# Mac with Homebrew:
brew services start mongodb-community

# The database will be automatically seeded on first run
```

#### 4. Frontend Setup
```bash
# Navigate to frontend directory (open new terminal)
cd frontend

# Install dependencies
npm install
```

---

## 🎮 Running the Application

### Start Backend Server
```bash
cd app
source .venv/bin/activate
python run_fastapi.py
```

**Backend API:** http://127.0.0.1:8000

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```

**Frontend Application:** http://localhost:5173

---

## 📡 API Documentation

Interactive API documentation is available when the backend is running:

- **Swagger UI:** http://127.0.0.1:8000/docs
- **ReDoc:** http://127.0.0.1:8000/redoc

### Main API Endpoints

#### Items Management
- `GET /api/items` - Retrieve all menu items with optional filters
- `POST /api/items` - Create new menu item
- `PUT /api/items/{id}` - Update existing item
- `DELETE /api/items/{id}` - Delete menu item

#### Order Management
- `POST /api/orders` - Create new order
- `GET /api/orders/{customer_id}` - Get customer order history
- `GET /api/admin/orders` - Get all orders (admin)
- `PUT /api/admin/orders/{id}/status` - Update order status

#### Customer Features
- `POST /api/favorites/{item_id}` - Add item to favorites
- `DELETE /api/favorites/{item_id}` - Remove from favorites
- `GET /api/favorites/{customer_id}` - Get user's favorites
- `GET /api/daily-specials` - Get promotional items

#### Analytics
- `GET /api/analytics/top-selling` - Most popular items
- `GET /api/analytics/top-rated` - Highest rated items

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `app/` directory:
```bash
MONGODB_URL=your_mongodb_connection_string
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**Note:** Never commit `.env` files to version control. Use `.env.example` as a template.

---

## 🌐 Deployment

### Recommended Deployment Stack

- **Backend:** Render, Railway, or DigitalOcean
- **Frontend:** Vercel or Netlify
- **Database:** MongoDB Atlas (free tier available)

### Deployment Checklist

- [ ] Set up MongoDB Atlas cluster
- [ ] Configure production environment variables
- [ ] Update CORS origins for production URLs
- [ ] Build and deploy backend
- [ ] Build and deploy frontend
- [ ] Test production deployment

---

## 🧪 Testing

### Run Backend Tests
```bash
cd app
pytest tests/
```

---

## 📝 Development Guidelines

### Code Style
- **Backend:** Follow PEP 8 style guide
- **Frontend:** ESLint with React recommended rules
- **Formatting:** Prettier for consistent code style

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: description of your feature"

# Push to remote
git push origin feature/your-feature-name
```

### Commit Message Convention
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

---

## 🐛 Known Limitations

- Authentication system is simplified for demonstration purposes
- Real-time updates currently use polling (WebSocket implementation planned)
- No payment processing integration

---

## 🚧 Future Enhancements

- [ ] JWT-based authentication system
- [ ] WebSocket integration for real-time updates
- [ ] Payment gateway integration
- [ ] Email notification system
- [ ] Mobile application (React Native)
- [ ] Multi-language support (i18n)
- [ ] Advanced analytics and reporting
- [ ] Inventory forecasting with ML

---

## 📊 Data Models

### CafeteriaItem
- Item details (name, category, price, description)
- Nutritional information
- Dietary attributes (vegetarian, vegan, gluten-free)
- Promotional settings (daily special, discount)
- Inventory tracking

### Order
- Customer information
- Order items with quantities
- Order status workflow
- Timestamps and status history
- Total price calculation with discounts

### UserFavorite
- Customer ID
- Favorite item references
- Quick access to preferred items

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write or update tests
5. Submit a pull request

---

## 📄 License

This project is developed for educational purposes.

---

## 👨‍💻 Author

**Ahnaf Masud**
- GitHub: [@AhnafMasud1234](https://github.com/AhnafMasud1234)

---

## 🙏 Acknowledgments

- FastAPI framework and documentation
- React and Vite communities
- Tailwind CSS team
- Recharts library maintainers
- MongoDB documentation team

---

## 📞 Contact & Support

For questions, issues, or feature requests, please open an issue on the GitHub repository.

---

**Built with ❤️ using modern web technologies**

