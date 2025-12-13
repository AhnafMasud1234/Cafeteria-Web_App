import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const API_BASE = "http://127.0.0.1:8000";
const STATUSES = ["pending", "preparing", "ready", "completed", "cancelled"];
const ADMIN_STORAGE_KEY = "cafeteria_admin_ok";

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-800",
    preparing: "bg-blue-100 text-blue-800",
    ready: "bg-purple-100 text-purple-800",
    completed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-rose-100 text-rose-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

function shortName(s, max = 10) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");

  // Inventory
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState("");

  // Orders
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Analytics
  const [topSelling, setTopSelling] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  // Restock
  const [restockQty, setRestockQty] = useState({});
  const [savingItemId, setSavingItemId] = useState(null);

  // Add item
  const [newItem, setNewItem] = useState({
    name: "",
    category: "main",
    price: 0,
    quantity: 0,
    image_url: "",
  });

  const fetchItems = async () => {
    setLoadingItems(true);
    setItemsError("");
    try {
      const res = await fetch(`${API_BASE}/api/items`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      setItems(data);

      setRestockQty((prev) => {
        const next = { ...prev };
        for (const it of data) {
          if (next[it.id] === undefined) next[it.id] = it.quantity;
        }
        return next;
      });
    } catch (e) {
      setItemsError(String(e));
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    setOrdersError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      setOrders(data);
    } catch (e) {
      setOrdersError(String(e));
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    setAnalyticsError("");
    try {
      const res1 = await fetch(
        `${API_BASE}/api/admin/analytics/top-selling?limit=8`
      );
      const topS = await res1.json();
      if (!res1.ok) throw new Error(topS?.detail || `HTTP ${res1.status}`);
      setTopSelling(topS);

      const res2 = await fetch(`${API_BASE}/api/items/top-rated?limit=8`);
      const topR = await res2.json();
      if (!res2.ok) throw new Error(topR?.detail || `HTTP ${res2.status}`);
      setTopRated(topR);
    } catch (e) {
      setAnalyticsError(String(e));
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchOrders();
    fetchAnalytics();
  }, []);

  const logout = () => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    navigate("/", { replace: true });
  };

  const setStatus = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    setOrdersError("");
    setToast("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      setToast(`✅ Order #${orderId} updated → ${status}`);
      await fetchOrders();
    } catch (e) {
      setOrdersError(String(e));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const restockItem = async (itemId) => {
    setSavingItemId(itemId);
    setItemsError("");
    setToast("");
    try {
      const qty = Number(restockQty[itemId]);
      if (!Number.isFinite(qty) || qty < 0)
        throw new Error("Quantity must be 0 or more");

      const res = await fetch(`${API_BASE}/api/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty, available: qty > 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      setToast(`✅ Stock updated for item #${itemId}`);
      await fetchItems();
    } catch (e) {
      setItemsError(String(e));
    } finally {
      setSavingItemId(null);
    }
  };

  const addNewItem = async (e) => {
    e.preventDefault();
    setToast("");
    setItemsError("");

    try {
      const payload = {
        name: newItem.name.trim(),
        category: newItem.category.trim(),
        price: Number(newItem.price),
        quantity: Number(newItem.quantity),
        available: Number(newItem.quantity) > 0,
        image_url: newItem.image_url.trim() || null,
      };

      const res = await fetch(`${API_BASE}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);

      setToast(`✅ Added item #${data.id}`);
      setNewItem({ name: "", category: "main", price: 0, quantity: 0, image_url: "" });
      await fetchItems();
      await fetchAnalytics();
    } catch (e) {
      setItemsError(String(e));
    }
  };

  // Chart data
  const sellingChartData = useMemo(
    () =>
      topSelling.map((x) => ({
        name: shortName(x.name, 12),
        units_sold: Number(x.units_sold || 0),
      })),
    [topSelling]
  );

  const ratedChartData = useMemo(
    () =>
      topRated.map((x) => ({
        name: shortName(x.name, 12),
        rating_avg: Number(x.rating_avg || 0),
      })),
    [topRated]
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Admin / Kitchen</h2>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg bg-white border font-semibold hover:bg-slate-50"
        >
          Logout
        </button>
      </div>

      {toast && <div className="bg-white border rounded-xl p-3">{toast}</div>}

      {/* Inventory */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold">Inventory / Restock</h3>
          <button
            onClick={fetchItems}
            className="px-4 py-2 rounded-lg bg-white border font-semibold hover:bg-slate-50"
          >
            Refresh items
          </button>
        </div>
        {itemsError && (
          <div className="mb-3 rounded-lg border p-2 text-red-600">{itemsError}</div>
        )}

        {loadingItems ? (
          <p>Loading items…</p>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="border rounded-xl p-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="font-bold">
                      #{it.id} {it.name}{" "}
                      <span className="text-sm text-slate-500 capitalize">
                        ({it.category})
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      Price: <b>€{it.price}</b> • Stock: <b>{it.quantity}</b> •{" "}
                      {it.available ? (
                        <b className="text-emerald-700">Available</b>
                      ) : (
                        <b className="text-rose-700">Unavailable</b>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      className="w-28 border rounded-lg px-2 py-2"
                      value={restockQty[it.id] ?? it.quantity}
                      onChange={(e) =>
                        setRestockQty((p) => ({ ...p, [it.id]: e.target.value }))
                      }
                    />
                    <button
                      onClick={() => restockItem(it.id)}
                      disabled={savingItemId === it.id}
                      className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:bg-slate-300"
                    >
                      {savingItemId === it.id ? "Saving…" : "Update stock"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add item */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-xl font-bold mb-3">Add New Item</h3>
        <form onSubmit={addNewItem} className="grid gap-3 md:grid-cols-2">
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Name"
            value={newItem.name}
            onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Category"
            value={newItem.category}
            onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}
          />
          <input
            className="border rounded-lg px-3 py-2"
            type="number"
            step="0.01"
            placeholder="Price"
            value={newItem.price}
            onChange={(e) => setNewItem((p) => ({ ...p, price: e.target.value }))}
          />
          <input
            className="border rounded-lg px-3 py-2"
            type="number"
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={(e) => setNewItem((p) => ({ ...p, quantity: e.target.value }))}
          />
          <input
            className="border rounded-lg px-3 py-2 md:col-span-2"
            placeholder="Image URL (optional)"
            value={newItem.image_url}
            onChange={(e) => setNewItem((p) => ({ ...p, image_url: e.target.value }))}
          />
          <button className="md:col-span-2 px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800">
            Add item
          </button>
        </form>
      </section>

      {/* Kitchen */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold">Kitchen Orders</h3>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 rounded-lg bg-white border font-semibold hover:bg-slate-50"
          >
            Refresh orders
          </button>
        </div>
        {ordersError && (
          <div className="mb-3 rounded-lg border p-2 text-red-600">{ordersError}</div>
        )}

        {loadingOrders ? (
          <p>Loading orders…</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 20).map((o) => (
              <div key={o.id} className="border rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">Order #{o.id}</div>
                    <div className="text-sm text-slate-600">
                      Total: <b>€{o.total_price}</b>
                    </div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>

                <div className="mt-2 text-sm text-slate-700">
                  {o.items?.map((line) => (
                    <div key={`${o.id}-${line.item_id}`} className="flex justify-between">
                      <span>
                        {line.name} × <b>{line.quantity}</b>
                      </span>
                      <span>€{Number(line.line_total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(o.id, s)}
                      disabled={updatingOrderId === o.id}
                      className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 text-sm font-semibold disabled:opacity-50"
                    >
                      {updatingOrderId === o.id ? "Updating…" : s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Analytics with charts */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold">Analytics</h3>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 rounded-lg bg-white border font-semibold hover:bg-slate-50"
          >
            Refresh analytics
          </button>
        </div>

        {analyticsError && (
          <div className="mb-3 rounded-lg border p-2 text-red-600">{analyticsError}</div>
        )}

        {loadingAnalytics ? (
          <p>Loading analytics…</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border rounded-xl p-3">
              <h4 className="font-bold mb-2">Top Selling (units)</h4>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={sellingChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="units_sold" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border rounded-xl p-3">
              <h4 className="font-bold mb-2">Top Rated (avg)</h4>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={ratedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="rating_avg" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}