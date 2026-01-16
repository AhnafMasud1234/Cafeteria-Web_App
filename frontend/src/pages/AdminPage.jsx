// frontend/src/pages/AdminPage.jsx
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from "recharts";

const API_BASE = "http://127.0.0.1:8000";
const ADMIN_KEY = "cafeteria123";
const INACTIVITY_TIMEOUT = 60000; // 1 minute in milliseconds

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const STATUS_COLORS = {
  pending: "#fbbf24",
  preparing: "#3b82f6",
  ready: "#8b5cf6",
  completed: "#10b981",
  cancelled: "#ef4444",
};

function AdminPage() {
  // Check localStorage for existing session
  const [authenticated, setAuthenticated] = useState(() => {
    return localStorage.getItem("admin_authenticated") === "true";
  });
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Inactivity timer ref
  const inactivityTimerRef = useRef(null);

  // Data states
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [topRated, setTopRated] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // UI states
  const [activeTab, setActiveTab] = useState("overview");
  const [notification, setNotification] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form states
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    category: "main",
    price: "",
    quantity: "",
    description: "",
    image_url: "",
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    calories: "",
    preparation_time: "",
    is_daily_special: false,
    discount_percentage: "",
  });

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem("admin_authenticated");
    setAuthenticated(false);
    setPassword("");
    showNotification("Session expired - logged out", "info");
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Set new timer
    inactivityTimerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  }, [logout]);

  // Handle any user activity
  const handleUserActivity = useCallback(() => {
    if (authenticated) {
      resetInactivityTimer();
    }
  }, [authenticated, resetInactivityTimer]);

  // Setup activity listeners
  useEffect(() => {
    if (authenticated) {
      // Start inactivity timer
      resetInactivityTimer();

      // Activity events to monitor
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

      // Add listeners
      events.forEach(event => {
        document.addEventListener(event, handleUserActivity);
      });

      // Cleanup
      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleUserActivity);
        });
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      };
    }
  }, [authenticated, handleUserActivity, resetInactivityTimer]);

  const handleLogin = () => {
    if (password === ADMIN_KEY) {
      setAuthenticated(true);
      localStorage.setItem("admin_authenticated", "true");
      setAuthError("");
      showNotification("Welcome Admin! 🎉");
      resetInactivityTimer();
    } else {
      setAuthError("Invalid admin key");
    }
  };

  const handleLogout = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    logout();
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/items`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      showNotification("Failed to fetch items", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      showNotification("Failed to fetch orders", "error");
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [sellingRes, ratedRes] = await Promise.all([
        fetch(`${API_BASE}/api/analytics/top-selling?limit=8`),
        fetch(`${API_BASE}/api/analytics/top-rated?limit=5`),
      ]);
      const selling = await sellingRes.json();
      const rated = await ratedRes.json();
      setTopSelling(selling);
      setTopRated(rated);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchItems();
      fetchOrders();
      fetchAnalytics();

      const interval1 = setInterval(fetchOrders, 5000);
      const interval2 = setInterval(fetchAnalytics, 10000);

      return () => {
        clearInterval(interval1);
        clearInterval(interval2);
      };
    }
  }, [authenticated]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showNotification(`Order #${orderId} updated to ${newStatus}`, "success");
        fetchOrders();
      }
    } catch (err) {
      showNotification("Failed to update order", "error");
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/items/${itemId}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("Item deleted", "success");
        fetchItems();
      }
    } catch (err) {
      showNotification("Failed to delete item", "error");
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...itemForm,
      price: parseFloat(itemForm.price) || 0,
      quantity: parseInt(itemForm.quantity) || 0,
      calories: itemForm.calories ? parseInt(itemForm.calories) : null,
      preparation_time: itemForm.preparation_time ? parseInt(itemForm.preparation_time) : null,
      discount_percentage: parseFloat(itemForm.discount_percentage) || 0,
    };

    try {
      const url = editingItem
        ? `${API_BASE}/api/items/${editingItem.id}`
        : `${API_BASE}/api/items`;
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showNotification(editingItem ? "Item updated!" : "Item added!", "success");
        setShowItemForm(false);
        setEditingItem(null);
        resetItemForm();
        fetchItems();
      }
    } catch (err) {
      showNotification("Failed to save item", "error");
    }
  };

  const resetItemForm = () => {
    setItemForm({
      name: "",
      category: "main",
      price: "",
      quantity: "",
      description: "",
      image_url: "",
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      calories: "",
      preparation_time: "",
      is_daily_special: false,
      discount_percentage: "",
    });
  };

  const startEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      category: item.category,
      price: item.price,
      quantity: item.quantity,
      description: item.description || "",
      image_url: item.image_url || "",
      is_vegetarian: item.is_vegetarian || false,
      is_vegan: item.is_vegan || false,
      is_gluten_free: item.is_gluten_free || false,
      calories: item.calories || "",
      preparation_time: item.preparation_time || "",
      is_daily_special: item.is_daily_special || false,
      discount_percentage: item.discount_percentage || "",
    });
    setShowItemForm(true);
  };

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total_price, 0);
    const completedOrders = orders.filter((o) => o.status === "completed").length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    const categoryStats = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    const categoryData = Object.entries(categoryStats).map(([name, value]) => ({ name, value }));

    const revenueByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + order.total_price;
      return acc;
    }, {});

    const statusData = Object.entries(revenueByStatus).map(([status, revenue]) => ({
      status,
      revenue: parseFloat(revenue.toFixed(2)),
    }));

    const lowStock = items.filter((item) => item.quantity < 5 && item.quantity > 0);
    const outOfStock = items.filter((item) => item.quantity === 0);

    const inventoryData = items.slice(0, 10).map((item) => ({
      name: item.name.length > 15 ? item.name.slice(0, 15) + "..." : item.name,
      stock: item.quantity,
      fill: item.quantity < 5 ? "#ef4444" : item.quantity < 10 ? "#f59e0b" : "#10b981",
    }));

    return {
      totalRevenue,
      completedOrders,
      pendingOrders,
      avgOrderValue,
      categoryData,
      statusData,
      lowStock,
      outOfStock,
      inventoryData,
    };
  }, [items, orders]);

  // Login Screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-slate-300">Enter admin key to continue</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Admin Key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {authError && (
              <p className="text-rose-400 text-sm text-center">{authError}</p>
            )}
            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:from-purple-700 hover:to-blue-700 transition"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg animate-slide-in z-50 ${
            notification.type === "success"
              ? "bg-emerald-500 text-white"
              : notification.type === "info"
              ? "bg-blue-500 text-white"
              : "bg-rose-500 text-white"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-600">Cafeteria Management System</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {["overview", "inventory", "orders", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold capitalize transition ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <MetricCard
                title="Total Revenue"
                value={`€${analytics.totalRevenue.toFixed(2)}`}
                icon="💰"
                color="blue"
                trend="+12.5%"
              />
              <MetricCard
                title="Total Orders"
                value={orders.length}
                icon="📦"
                color="emerald"
                trend="+8.2%"
              />
              <MetricCard
                title="Avg Order Value"
                value={`€${analytics.avgOrderValue.toFixed(2)}`}
                icon="💵"
                color="purple"
                trend="+5.1%"
              />
              <MetricCard
                title="Low Stock Items"
                value={analytics.lowStock.length}
                icon="⚠️"
                color="amber"
                trend={analytics.lowStock.length > 0 ? "Alert" : "Good"}
              />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Revenue by Status */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue by Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Distribution */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Items by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Recent Orders</h3>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">Order #{order.id}</div>
                      <div className="text-sm text-slate-600">
                        {order.items?.length || 0} items • €{order.total_price.toFixed(2)}
                      </div>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: `${STATUS_COLORS[order.status]}20`,
                        color: STATUS_COLORS[order.status],
                      }}
                    >
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Inventory Management</h2>
              <button
                onClick={() => {
                  resetItemForm();
                  setEditingItem(null);
                  setShowItemForm(true);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold"
              >
                + Add Item
              </button>
            </div>

            {/* Stock Alerts */}
            {(analytics.lowStock.length > 0 || analytics.outOfStock.length > 0) && (
              <div className="grid gap-4 md:grid-cols-2">
                {analytics.lowStock.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">⚠️</span>
                      <h3 className="font-bold text-amber-900">Low Stock Alert</h3>
                    </div>
                    <p className="text-sm text-amber-800">
                      {analytics.lowStock.length} items running low
                    </p>
                  </div>
                )}
                {analytics.outOfStock.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🚫</span>
                      <h3 className="font-bold text-rose-900">Out of Stock</h3>
                    </div>
                    <p className="text-sm text-rose-800">
                      {analytics.outOfStock.length} items out of stock
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Inventory Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Stock Levels</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.inventoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="stock" radius={[8, 8, 0, 0]}>
                    {analytics.inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Items Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
                >
                  <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-300 relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl">
                        🍽️
                      </div>
                    )}
                    {item.quantity < 5 && (
                      <div className="absolute top-2 right-2 bg-rose-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        Low Stock
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900">{item.name}</h3>
                    <p className="text-sm text-slate-600 capitalize">{item.category}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span className="text-lg font-bold text-slate-900">€{item.price}</span>
                        <span className="text-sm text-slate-600 ml-2">
                          Stock: {item.quantity}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          item.available
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {item.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => startEditItem(item)}
                        className="flex-1 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition font-semibold text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="flex-1 py-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition font-semibold text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Order Management</h2>
              <button
                onClick={fetchOrders}
                className="px-4 py-2 rounded-lg bg-white border hover:bg-slate-50 transition font-semibold"
              >
                🔄 Refresh
              </button>
            </div>

            {/* Order Stats */}
            <div className="grid gap-4 md:grid-cols-5">
              {["pending", "preparing", "ready", "completed", "cancelled"].map((status) => {
                const count = orders.filter((o) => o.status === status).length;
                return (
                  <div
                    key={status}
                    className="bg-white rounded-lg p-4 border-l-4"
                    style={{ borderColor: STATUS_COLORS[status] }}
                  >
                    <div className="text-2xl font-bold" style={{ color: STATUS_COLORS[status] }}>
                      {count}
                    </div>
                    <div className="text-sm text-slate-600 capitalize">{status}</div>
                  </div>
                );
              })}
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900">Order #{order.id}</h3>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: `${STATUS_COLORS[order.status]}20`,
                            color: STATUS_COLORS[order.status],
                          }}
                        >
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        Customer: {order.customer_id}
                      </p>
                      <p className="text-sm text-slate-600">
                        Total: <span className="font-bold">€{order.total_price.toFixed(2)}</span>
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedOrder(selectedOrder?.id === order.id ? null : order)
                      }
                      className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                    >
                      {selectedOrder?.id === order.id ? "Hide Details" : "View Details"}
                    </button>
                  </div>

                  {selectedOrder?.id === order.id && (
                    <div className="border-t pt-4 mt-4">
                      <div className="bg-slate-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-slate-900 mb-2">Order Items:</h4>
                        <div className="space-y-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-slate-700">
                                {item.name} × {item.quantity}
                              </span>
                              <span className="font-semibold text-slate-900">
                                €{item.line_total.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {order.notes && (
                        <div className="bg-blue-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-blue-900">
                            <strong>Notes:</strong> {order.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {["pending", "preparing", "ready", "completed", "cancelled"].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(order.id, status)}
                        disabled={order.status === status}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                          order.status === status
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                        style={
                          order.status === status
                            ? {
                                backgroundColor: `${STATUS_COLORS[status]}20`,
                                color: STATUS_COLORS[status],
                              }
                            : {}
                        }
                      >
                        {status === order.status && "✓ "}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Analytics & Insights</h2>

            {/* Top Selling Items */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Top Selling Items</h3>
              {topSelling.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={topSelling}
                    layout="vertical"
                    margin={{ left: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="units_sold" fill="#3b82f6" radius={[0, 8, 8, 0]}>
                      {topSelling.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <div className="text-4xl mb-2">📊</div>
                  <p>No sales data available yet</p>
                </div>
              )}
            </div>

            {/* Top Rated Items */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Top Rated Items</h3>
              {topRated.length > 0 ? (
                <div className="space-y-3">
                  {topRated.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-transparent rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-amber-600">#{idx + 1}</div>
                        <div>
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-sm text-slate-600 capitalize">{item.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-amber-500">
                          <span className="text-xl">⭐</span>
                          <span className="text-lg font-bold">{item.rating_avg.toFixed(1)}</span>
                        </div>
                        <div className="text-xs text-slate-600">
                          {item.rating_count} reviews
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <div className="text-4xl mb-2">⭐</div>
                  <p>No ratings available yet</p>
                </div>
              )}
            </div>

            {/* Revenue Trend */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue Trend (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={[
                    { day: "Mon", revenue: 245 },
                    { day: "Tue", revenue: 312 },
                    { day: "Wed", revenue: 289 },
                    { day: "Thu", revenue: 398 },
                    { day: "Fri", revenue: 445 },
                    { day: "Sat", revenue: 523 },
                    { day: "Sun", revenue: 467 },
                  ]}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>

      {/* Item Form Modal */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingItem ? "Edit Item" : "Add New Item"}
                </h2>
                <button
                  onClick={() => {
                    setShowItemForm(false);
                    setEditingItem(null);
                    resetItemForm();
                  }}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleItemSubmit} className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="main">Main</option>
                    <option value="snack">Snack</option>
                    <option value="drink">Drink</option>
                    <option value="dessert">Dessert</option>
                    <option value="salad">Salad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Price (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    value={itemForm.calories}
                    onChange={(e) => setItemForm({ ...itemForm, calories: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Prep Time (min)
                  </label>
                  <input
                    type="number"
                    value={itemForm.preparation_time}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, preparation_time: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={itemForm.image_url}
                  onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Dietary Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={itemForm.is_vegetarian}
                        onChange={(e) =>
                          setItemForm({ ...itemForm, is_vegetarian: e.target.checked })
                        }
                        className="rounded"
                      />
                      <span className="text-sm">🥗 Vegetarian</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={itemForm.is_vegan}
                        onChange={(e) =>
                          setItemForm({ ...itemForm, is_vegan: e.target.checked })
                        }
                        className="rounded"
                      />
                      <span className="text-sm">🌱 Vegan</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={itemForm.is_gluten_free}
                        onChange={(e) =>
                          setItemForm({ ...itemForm, is_gluten_free: e.target.checked })
                        }
                        className="rounded"
                      />
                      <span className="text-sm">🌾 Gluten-Free</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Promotions
                  </label>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={itemForm.is_daily_special}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, is_daily_special: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">⭐ Daily Special</span>
                  </label>
                  {itemForm.is_daily_special && (
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        Discount %
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={itemForm.discount_percentage}
                        onChange={(e) =>
                          setItemForm({ ...itemForm, discount_percentage: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                >
                  {editingItem ? "Update Item" : "Create Item"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowItemForm(false);
                    setEditingItem(null);
                    resetItemForm();
                  }}
                  className="px-6 py-3 rounded-lg bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, icon, color, trend }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    purple: "from-purple-500 to-purple-600",
    amber: "from-amber-500 to-amber-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 relative overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colors[color]} opacity-10 rounded-bl-full`}
      ></div>
      <div className="relative">
        <div className="text-3xl mb-2">{icon}</div>
        <div className="text-sm text-slate-600 mb-1">{title}</div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {trend && (
          <div className="text-xs text-emerald-600 font-semibold mt-1">{trend}</div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;