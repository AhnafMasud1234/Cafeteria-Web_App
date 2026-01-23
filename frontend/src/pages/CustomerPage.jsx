// frontend/src/pages/CustomerPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

function getCustomerId() {
  const key = "cafeteria_customer_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? `guest-${crypto.randomUUID()}`
        : `guest-${Math.random().toString(16).slice(2)}-${Date.now()}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse",
    preparing: "bg-blue-100 text-blue-800 border-blue-200 animate-pulse",
    ready: "bg-purple-100 text-purple-800 border-purple-200 pulse-glow",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelled: "bg-rose-100 text-rose-800 border-rose-200",
  };
  const icons = {
    pending: "⏳",
    preparing: "👨‍🍳",
    ready: "✨",
    completed: "✅",
    cancelled: "❌",
  };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || "bg-slate-100 text-slate-700"}`}>
      <span>{icons[status]}</span>
      {status.toUpperCase()}
    </span>
  );
}

function formatETA(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return String(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function shortName(s, max = 12) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// Confetti Component
function Confetti({ show, onComplete }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        >
          <div
            className="w-3 h-3 rotate-45"
            style={{
              backgroundColor: COLORS[Math.floor(Math.random() * COLORS.length)],
            }}
          />
        </div>
      ))}
    </div>
  );
}

// Toast Notification Component
function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
    error: "bg-gradient-to-r from-rose-500 to-rose-600 text-white",
    info: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
  };

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
  };

  return (
    <div className={`fixed top-4 right-4 px-6 py-4 rounded-xl shadow-2xl animate-slide-in z-50 ${styles[type]}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icons[type]}</span>
        <span className="font-semibold">{message}</span>
        <button onClick={onClose} className="ml-2 text-xl hover:opacity-80">×</button>
      </div>
    </div>
  );
}

// Item Detail Modal
function ItemModal({ item, onClose, onAddToCart, isFavorite, onToggleFavorite }) {
  if (!item) return null;

  const nutritionData = [
    { subject: "Protein", value: 65, fullMark: 100 },
    { subject: "Carbs", value: 75, fullMark: 100 },
    { subject: "Fat", value: 45, fullMark: 100 },
    { subject: "Fiber", value: 55, fullMark: 100 },
    { subject: "Vitamins", value: 80, fullMark: 100 },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
        {/* Image Header */}
        <div className="relative h-64 bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-6xl">
              🍽️
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition text-slate-600 hover:text-slate-900 text-2xl font-bold shadow-lg"
          >
            ×
          </button>
          {item.is_daily_special && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-wiggle">
              🌟 {item.discount_percentage}% OFF
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">{item.name}</h2>
                <p className="text-slate-600 capitalize mt-1">{item.category}</p>
              </div>
              <button
                onClick={() => onToggleFavorite(item.id)}
                className="text-3xl hover:scale-110 transition-transform"
              >
                {isFavorite ? "❤️" : "🤍"}
              </button>
            </div>
            {item.description && (
              <p className="text-slate-700 mt-3">{item.description}</p>
            )}
          </div>

          {/* Price & Rating */}
          <div className="flex items-center gap-6 pb-6 border-b">
            <div>
              {item.discount_percentage > 0 ? (
                <div>
                  <div className="text-3xl font-bold text-slate-900">
                    €{(item.price * (1 - item.discount_percentage / 100)).toFixed(2)}
                  </div>
                  <div className="text-lg line-through text-slate-400">€{item.price}</div>
                </div>
              ) : (
                <div className="text-3xl font-bold text-slate-900">€{item.price}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">⭐</span>
              <div>
                <div className="text-xl font-bold text-slate-900">{item.rating_avg.toFixed(1)}</div>
                <div className="text-sm text-slate-600">{item.rating_count} reviews</div>
              </div>
            </div>
          </div>

          {/* Dietary Tags */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Dietary Information</h3>
            <div className="flex flex-wrap gap-2">
              {item.is_vegetarian && (
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  🥗 Vegetarian
                </span>
              )}
              {item.is_vegan && (
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  🌱 Vegan
                </span>
              )}
              {item.is_gluten_free && (
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  🌾 Gluten-Free
                </span>
              )}
              {item.calories && (
                <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">
                  🔥 {item.calories} cal
                </span>
              )}
              {item.preparation_time && (
                <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                  ⏱️ {item.preparation_time} min
                </span>
              )}
            </div>
          </div>

          {/* Nutrition Radar Chart */}
          {item.calories && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Nutrition Profile</h3>
              <div className="bg-slate-50 rounded-xl p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={nutritionData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#475569", fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#64748b" }} />
                    <Radar
                      name="Nutrition"
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Allergens */}
          {item.allergens && item.allergens.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <h3 className="font-semibold text-rose-900 mb-2">⚠️ Allergen Information</h3>
              <p className="text-sm text-rose-800">
                Contains: {item.allergens.join(", ")}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                onAddToCart(item.id);
                onClose();
              }}
              disabled={!item.available}
              className={
                !item.available
                  ? "flex-1 py-4 rounded-xl bg-slate-200 text-slate-500 font-bold cursor-not-allowed"
                  : "flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl transform hover:scale-105"
              }
            >
              {item.available ? "🛒 Add to Cart" : "Sold Out"}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-4 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerPage() {
  const customerId = getCustomerId();

  // Menu items
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState("");

  // Orders
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  // Popular (top-selling)
  const [topSelling, setTopSelling] = useState([]);

  // Daily Specials
  const [dailySpecials, setDailySpecials] = useState([]);

  // Favorites
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [vegetarian, setVegetarian] = useState(false);
  const [vegan, setVegan] = useState(false);
  const [glutenFree, setGlutenFree] = useState(false);

  // Cart
  const [cart, setCart] = useState({});
  const [checkoutMsg, setCheckoutMsg] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  // Ratings feedback
  const [ratingMsg, setRatingMsg] = useState("");

  // Toast notifications
  const [toast, setToast] = useState(null);

  // View mode
  const [viewMode, setViewMode] = useState("all"); // all, favorites, specials

  // Modal
  const [selectedItem, setSelectedItem] = useState(null);

  // Confetti
  const [showConfetti, setShowConfetti] = useState(false);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const fetchItems = async () => {
    setLoadingItems(true);
    setItemsError("");
    try {
      const res = await fetch(`${API_BASE}/api/items`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      setItems(data);
    } catch (e) {
      setItemsError(String(e));
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    setOrdersError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/orders?customer_id=${encodeURIComponent(customerId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      setOrders(data);
    } catch (e) {
      setOrdersError(String(e));
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchTopSelling = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/top-selling?limit=5`);
      const data = await res.json();
      if (res.ok) setTopSelling(data);
    } catch {
      // ignore
    }
  };

  const fetchDailySpecials = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/daily-specials`);
      const data = await res.json();
      if (res.ok) setDailySpecials(data);
    } catch {
      // ignore
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/favorites?customer_id=${encodeURIComponent(customerId)}`);
      const data = await res.json();
      if (res.ok) {
        setFavorites(data);
        setFavoriteIds(new Set(data.map(item => item.id)));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchItems();
    fetchMyOrders();
    fetchTopSelling();
    fetchDailySpecials();
    fetchFavorites();

    const t1 = setInterval(fetchMyOrders, 5000);
    const t2 = setInterval(fetchTopSelling, 15000);

    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return ["all", ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    const s = search.trim().toLowerCase();
    let result = items;

    if (viewMode === "favorites") {
      result = result.filter(i => favoriteIds.has(i.id));
    } else if (viewMode === "specials") {
      result = result.filter(i => i.is_daily_special);
    }

    return result.filter((i) => {
      if (availableOnly && !i.available) return false;
      if (category !== "all" && i.category !== category) return false;
      if (vegetarian && !i.is_vegetarian) return false;
      if (vegan && !i.is_vegan) return false;
      if (glutenFree && !i.is_gluten_free) return false;
      if (!s) return true;
      return (
        i.name.toLowerCase().includes(s) ||
        i.category.toLowerCase().includes(s) ||
        (i.description && i.description.toLowerCase().includes(s))
      );
    });
  }, [items, search, category, availableOnly, vegetarian, vegan, glutenFree, viewMode, favoriteIds]);

  const popularRows = useMemo(() => {
    const byId = new Map(items.map((i) => [i.id, i]));
    return topSelling.map((x) => {
      const item = byId.get(Number(x.item_id));
      return {
        ...x,
        image_url: item?.image_url || null,
        price: item?.price ?? null,
        category: item?.category || null,
      };
    });
  }, [topSelling, items]);

  const sellingChartData = useMemo(
    () =>
      popularRows.map((x) => ({
        name: shortName(x.name, 12),
        units_sold: Number(x.units_sold || 0),
      })),
    [popularRows]
  );

  const addToCart = (itemId) => {
    setCart((prev) => ({ ...prev, [itemId]: Number(prev[itemId] || 0) + 1 }));
    showToast("Added to cart! 🎉", "success");
  };

  const setCartQty = (itemId, qty) => {
    const q = Number(qty);
    setCart((prev) => {
      const next = { ...prev };
      if (!q || q <= 0) delete next[itemId];
      else next[itemId] = q;
      return next;
    });
  };

  const clearCart = () => {
    setCart({});
    showToast("Cart cleared", "info");
  };

  const cartLines = useMemo(() => {
    const byId = new Map(items.map((i) => [i.id, i]));
    return Object.entries(cart)
      .map(([idStr, qty]) => {
        const id = Number(idStr);
        const item = byId.get(id);
        if (!item) return null;
        const q = Number(qty);
        if (!q || q <= 0) return null;

        let price = item.price;
        if (item.discount_percentage > 0) {
          price = price * (1 - item.discount_percentage / 100);
        }

        return {
          item_id: id,
          name: item.name,
          unit_price: price,
          original_price: item.price,
          quantity: q,
          line_total: price * q,
          available: item.available,
          discount: item.discount_percentage,
        };
      })
      .filter(Boolean);
  }, [cart, items]);

  const cartTotal = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.line_total, 0),
    [cartLines]
  );

  const checkout = async () => {
    if (cartLines.length === 0) {
      setCheckoutMsg("❌ Cart is empty");
      return;
    }

    const unavailable = cartLines.filter((l) => !l.available);
    if (unavailable.length > 0) {
      setCheckoutMsg(`❌ Some items are unavailable: ${unavailable.map((x) => x.name).join(", ")}`);
      return;
    }

    setCheckingOut(true);
    setCheckoutMsg("");

    try {
      const itemsPayload = cartLines.map((l) => ({
        item_id: l.item_id,
        quantity: l.quantity,
      }));

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          items: itemsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);

      setCheckoutMsg(`✅ Order #${data.id} placed! ETA: ${formatETA(data.estimated_ready_at)}`);
      showToast(`Order #${data.id} placed successfully! 🎉`, "success");
      setShowConfetti(true);
      setCart({});
      await fetchMyOrders();
      await fetchItems();
    } catch (e) {
      setCheckoutMsg(`❌ ${String(e)}`);
      showToast("Order failed. Please try again.", "error");
    } finally {
      setCheckingOut(false);
    }
  };

  const rateItem = async (itemId, rating) => {
    setRatingMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/items/${itemId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);

      setRatingMsg(`✅ Rated item #${itemId} with ${rating} stars!`);
      showToast(`Rated ${rating} stars! ⭐`, "success");
      await fetchItems();
    } catch (e) {
      setRatingMsg(`❌ ${String(e)}`);
    }
  };

  const toggleFavorite = async (itemId) => {
    const isFav = favoriteIds.has(itemId);
    try {
      if (isFav) {
        const res = await fetch(`${API_BASE}/api/favorites/${itemId}?customer_id=${encodeURIComponent(customerId)}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setFavoriteIds(prev => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
          });
          showToast("Removed from favorites 💔", "info");
          await fetchFavorites();
        }
      } else {
        const res = await fetch(`${API_BASE}/api/favorites/${itemId}?customer_id=${encodeURIComponent(customerId)}`, {
          method: "POST",
        });
        if (res.ok) {
          setFavoriteIds(prev => new Set(prev).add(itemId));
          showToast("Added to favorites! ❤️", "success");
          await fetchFavorites();
        }
      }
    } catch (e) {
      showToast("Action failed", "error");
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={addToCart}
          isFavorite={favoriteIds.has(selectedItem.id)}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* Hero Section with Daily Specials */}
      {dailySpecials.length > 0 && (
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-3xl shadow-2xl p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full translate-y-48 -translate-x-48 blur-3xl"></div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-4xl font-bold mb-2 animate-fade-in-up">🌟 Today's Specials</h2>
                <p className="text-amber-100 text-lg">Limited time offers - Save big today!</p>
              </div>
              <div className="text-6xl animate-wiggle">🎉</div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {dailySpecials.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white/20 backdrop-blur-lg rounded-2xl p-5 hover:bg-white/30 transition-all transform hover:scale-105 cursor-pointer border border-white/30"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-xl">{item.name}</h3>
                      <p className="text-sm text-amber-100 capitalize">{item.category}</p>
                    </div>
                    <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      {item.discount_percentage}% OFF
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold">
                      €{(item.price * (1 - item.discount_percentage / 100)).toFixed(2)}
                    </span>
                    <span className="text-lg line-through text-amber-200">€{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Animated Stats Bar */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Menu Items", value: items.length, icon: "🍽️", color: "from-blue-500 to-blue-600" },
          { label: "Available Now", value: items.filter(i => i.available).length, icon: "✅", color: "from-emerald-500 to-emerald-600" },
          { label: "My Orders", value: orders.length, icon: "📦", color: "from-purple-500 to-purple-600" },
          { label: "Favorites", value: favoriteIds.size, icon: "❤️", color: "from-rose-500 to-rose-600" },
        ].map((stat, idx) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all cursor-pointer overflow-hidden relative group"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
            <div className="relative">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-sm text-slate-600 mb-1">{stat.label}</div>
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Popular Items Chart */}
      {topSelling.length > 0 && (
        <section className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span>🔥</span>
            Most Popular Items
          </h2>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={sellingChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="units_sold" radius={[12, 12, 0, 0]}>
                  {sellingChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* View Mode Tabs */}
      <div className="flex gap-3 bg-white rounded-2xl shadow-lg p-2">
        {[
          { mode: "all", label: "All Items", count: items.length, icon: "🍽️" },
          { mode: "favorites", label: "Favorites", count: favoriteIds.size, icon: "❤️" },
          { mode: "specials", label: "Specials", count: dailySpecials.length, icon: "⭐" },
        ].map((tab) => (
          <button
            key={tab.mode}
            onClick={() => setViewMode(tab.mode)}
            className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all transform ${
              viewMode === tab.mode
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-105 shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="text-sm opacity-75">({tab.count})</span>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <section className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">🔍 Filter Menu</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <input
            className="border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="🔍 Search menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border-2 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 px-4 py-3 border-2 rounded-xl cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={vegetarian}
                onChange={(e) => setVegetarian(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-semibold">🥗 Vegetarian</span>
            </label>
            <label className="flex items-center gap-2 px-4 py-3 border-2 rounded-xl cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={vegan}
                onChange={(e) => setVegan(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-semibold">🌱 Vegan</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 px-4 py-3 border-2 rounded-xl cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={glutenFree}
                onChange={(e) => setGlutenFree(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-semibold">🌾 Gluten-Free</span>
            </label>
            <label className="flex items-center gap-2 px-4 py-3 border-2 rounded-xl cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-semibold">✓ Available</span>
            </label>
          </div>
        </div>
      </section>

      {/* Menu + Cart Grid */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Menu Items */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-slate-900">
              Menu <span className="text-slate-500 text-xl">({filteredItems.length})</span>
            </h2>
            <button
              onClick={fetchItems}
              className="px-6 py-3 rounded-xl bg-white border-2 font-bold hover:bg-slate-50 transition-all transform hover:scale-105 shadow-sm"
            >
              🔄 Refresh
            </button>
          </div>

          {loadingItems && (
            <div className="grid gap-6 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-4 animate-pulse">
                  <div className="h-48 bg-slate-200 rounded-xl mb-4"></div>
                  <div className="h-6 bg-slate-200 rounded mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          )}

          {!loadingItems && filteredItems.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-slate-600 text-xl">No items found matching your filters</p>
            </div>
          )}

          {!loadingItems && filteredItems.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2">
              {filteredItems.map((it, idx) => (
                <div
                  key={it.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group transform hover:-translate-y-2 cursor-pointer"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  onClick={() => setSelectedItem(it)}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
                    {it.image_url ? (
                      <img
                        src={it.image_url}
                        alt={it.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-5xl">
                        🍽️
                      </div>
                    )}
                    {it.is_daily_special && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-wiggle">
                        {it.discount_percentage}% OFF
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(it.id);
                      }}
                      className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all transform hover:scale-110 shadow-lg"
                    >
                      {favoriteIds.has(it.id) ? (
                        <span className="text-2xl">❤️</span>
                      ) : (
                        <span className="text-2xl">🤍</span>
                      )}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition">
                          {it.name}
                        </h3>
                        <p className="text-sm text-slate-500 capitalize">{it.category}</p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-bold ${
                          it.available
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {it.available ? "Available" : "Sold Out"}
                      </span>
                    </div>

                    {/* Dietary Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {it.is_vegetarian && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                          🥗
                        </span>
                      )}
                      {it.is_vegan && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                          🌱
                        </span>
                      )}
                      {it.is_gluten_free && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                          🌾
                        </span>
                      )}
                      {it.calories && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-semibold">
                          {it.calories} cal
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        {it.discount_percentage > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-slate-900">
                              €{(it.price * (1 - it.discount_percentage / 100)).toFixed(2)}
                            </span>
                            <span className="text-sm line-through text-slate-400">€{it.price}</span>
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-slate-900">€{it.price}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <span className="text-xl">⭐</span>
                        <span className="font-bold">{it.rating_avg.toFixed(1)}</span>
                        <span className="text-xs text-slate-600">({it.rating_count})</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(it.id);
                        }}
                        disabled={!it.available}
                        className={
                          !it.available
                            ? "flex-1 py-3 rounded-xl bg-slate-200 text-slate-500 font-bold cursor-not-allowed"
                            : "flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                        }
                      >
                        {it.available ? "🛒 Add" : "Sold Out"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(it);
                        }}
                        className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition"
                      >
                        ℹ️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl p-6 h-fit sticky top-4 border-2 border-blue-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span>🛒</span>
            Cart
          </h2>

          {cartLines.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-7xl mb-4 animate-bounce">🛒</div>
              <p className="text-slate-600 text-lg font-semibold">Your cart is empty</p>
              <p className="text-sm text-slate-500 mt-2">Add items to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartLines.map((l) => (
                <div key={l.item_id} className="border-2 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-bold text-slate-900">{l.name}</div>
                      <div className="text-sm text-slate-600">
                        €{l.unit_price.toFixed(2)} each
                        {l.discount > 0 && (
                          <span className="ml-2 text-xs text-amber-600 font-bold bg-amber-100 px-2 py-1 rounded-full">
                            {l.discount}% off
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      €{l.line_total.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="w-10 h-10 rounded-xl border-2 hover:bg-slate-50 font-bold text-lg transition-all transform hover:scale-110"
                      onClick={() => setCartQty(l.item_id, l.quantity - 1)}
                    >
                      −
                    </button>
                    <input
                      className="w-16 border-2 rounded-xl px-2 py-2 text-center font-bold text-lg"
                      value={l.quantity}
                      onChange={(e) => setCartQty(l.item_id, e.target.value)}
                    />
                    <button
                      className="w-10 h-10 rounded-xl border-2 hover:bg-slate-50 font-bold text-lg transition-all transform hover:scale-110"
                      onClick={() => setCartQty(l.item_id, l.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      className="ml-auto px-4 py-2 rounded-xl bg-rose-100 text-rose-700 font-bold hover:bg-rose-200 transition text-sm"
                      onClick={() => setCartQty(l.item_id, 0)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-4 border-t-2">
                <span className="font-bold text-xl">Total</span>
                <span className="font-bold text-3xl text-blue-600">€{cartTotal.toFixed(2)}</span>
              </div>

              {checkoutMsg && (
                <div className="rounded-xl border-2 p-4 text-sm bg-blue-50 text-blue-900 font-semibold">
                  {checkoutMsg}
                </div>
              )}

              <button
                onClick={checkout}
                disabled={checkingOut}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-lg hover:from-emerald-700 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed"
              >
                {checkingOut ? "Processing... ⏳" : "🎉 Checkout Now"}
              </button>

              <button
                onClick={clearCart}
                className="w-full py-3 rounded-xl bg-white border-2 font-bold hover:bg-slate-50 transition"
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>
      </section>

      {/* My Orders */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <span>📦</span>
            My Orders
          </h2>
          <button
            onClick={fetchMyOrders}
            className="px-6 py-3 rounded-xl bg-white border-2 font-bold hover:bg-slate-50 transition-all transform hover:scale-105 shadow-sm"
          >
            🔄 Refresh
          </button>
        </div>

        {ratingMsg && (
          <div className="mb-4 rounded-xl border-2 bg-blue-50 p-4 text-sm text-blue-900 font-semibold">
            {ratingMsg}
          </div>
        )}

        {!loadingOrders && orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-7xl mb-4">📦</div>
            <p className="text-slate-600 text-xl font-semibold">No orders yet</p>
            <p className="text-sm text-slate-500 mt-2">Place your first order to see it here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 10).map((o, idx) => (
              <div
                key={o.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-bold text-xl text-slate-900">Order #{o.id}</div>
                    <div className="text-sm text-slate-600 mt-1">
                      Total: <span className="font-bold text-lg">€{o.total_price.toFixed(2)}</span>
                      {o.estimated_ready_at && (
                        <span className="ml-4">
                          🕐 ETA: <span className="font-bold">{formatETA(o.estimated_ready_at)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 space-y-2 border">
                  {o.items?.map((line) => (
                    <div key={`${o.id}-${line.item_id}`} className="flex justify-between text-sm">
                      <span className="text-slate-700 font-semibold">
                        {line.name} <span className="font-bold text-blue-600">× {line.quantity}</span>
                      </span>
                      <span className="font-bold text-slate-900">€{Number(line.line_total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {o.status === "completed" && o.items?.length ? (
                  <div className="mt-4 border-t-2 pt-4">
                    <div className="text-sm font-bold text-slate-900 mb-3">⭐ Rate your experience:</div>
                    <div className="flex flex-wrap gap-3">
                      {o.items.map((line) => (
                        <div key={`rate-${o.id}-${line.item_id}`} className="border-2 rounded-xl px-4 py-3 bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-md transition">
                          <div className="text-sm font-bold text-slate-900 mb-2">{line.name}</div>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((r) => (
                              <button
                                key={r}
                                onClick={() => rateItem(line.item_id, r)}
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold hover:from-amber-500 hover:to-orange-600 transition-all transform hover:scale-110 shadow-md"
                              >
                                {r}★
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add custom CSS for confetti animation */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}