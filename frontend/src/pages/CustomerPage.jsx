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
} from "recharts";

const API_BASE = "http://127.0.0.1:8000";
const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#f97316", "#64748b"];

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

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);

  // Cart
  const [cart, setCart] = useState({});
  const [checkoutMsg, setCheckoutMsg] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  // Ratings feedback
  const [ratingMsg, setRatingMsg] = useState("");

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

  useEffect(() => {
    fetchItems();
    fetchMyOrders();
    fetchTopSelling();

    // refresh order statuses periodically
    const t1 = setInterval(fetchMyOrders, 5000);
    // refresh popular list occasionally
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
    return items.filter((i) => {
      if (availableOnly && !i.available) return false;
      if (category !== "all" && i.category !== category) return false;
      if (!s) return true;
      return i.name.toLowerCase().includes(s) || i.category.toLowerCase().includes(s);
    });
  }, [items, search, category, availableOnly]);

  // Join top-selling with item info (image/price) if available
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

  // Chart data
  const sellingChartData = useMemo(
    () =>
      popularRows.map((x) => ({
        name: shortName(x.name, 12),
        units_sold: Number(x.units_sold || 0),
      })),
    [popularRows]
  );

  // Cart helpers
  const addToCart = (itemId) => {
    setCart((prev) => ({ ...prev, [itemId]: Number(prev[itemId] || 0) + 1 }));
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

  const clearCart = () => setCart({});

  const cartLines = useMemo(() => {
    const byId = new Map(items.map((i) => [i.id, i]));
    return Object.entries(cart)
      .map(([idStr, qty]) => {
        const id = Number(idStr);
        const item = byId.get(id);
        if (!item) return null;
        const q = Number(qty);
        if (!q || q <= 0) return null;
        return {
          item_id: id,
          name: item.name,
          unit_price: item.price,
          quantity: q,
          line_total: item.price * q,
          available: item.available,
        };
      })
      .filter(Boolean);
  }, [cart, items]);

  const cartTotal = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.line_total, 0),
    [cartLines]
  );

  const checkout = async () => {
    setCheckoutMsg("");
    if (cartLines.length === 0) {
      setCheckoutMsg("❌ Cart is empty.");
      return;
    }

    const bad = cartLines.find((l) => !l.available);
    if (bad) {
      setCheckoutMsg(`❌ "${bad.name}" is unavailable. Remove it from cart.`);
      return;
    }

    setCheckingOut(true);
    try {
      const payload = {
        customer_id: customerId,
        items: cartLines.map((l) => ({ item_id: l.item_id, quantity: l.quantity })),
      };

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Checkout failed");

      setCheckoutMsg(`✅ Order #${data.id} placed. Status: ${data.status}`);
      clearCart();
      await fetchItems();
      await fetchMyOrders();
      await fetchTopSelling();
    } catch (e) {
      setCheckoutMsg(`❌ ${String(e)}`);
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
      if (!res.ok) throw new Error(data?.detail || "Rating failed");
      setRatingMsg(`✅ Rated item #${itemId} with ${rating}★`);
      await fetchItems();
      await fetchTopSelling();
    } catch (e) {
      setRatingMsg(`❌ ${String(e)}`);
    }
  };

  return (
    <div className="space-y-10">
      {/* Customer ID */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <div className="text-xs text-slate-500">
          Customer ID: <span className="font-mono">{customerId}</span>
        </div>
      </section>

      {/* Most Popular (Chart + list) */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-slate-900">🔥 Most Popular</h2>
          <button
            onClick={fetchTopSelling}
            className="px-4 py-2 rounded-lg bg-white border font-semibold hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {popularRows.length === 0 ? (
          <p className="text-slate-600">No sales data yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Chart */}
            <div className="border rounded-xl p-3">
              <div className="text-sm font-semibold text-slate-900 mb-2">
                Top selling (units)
              </div>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={sellingChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="units_sold">
                      {sellingChartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {popularRows.map((x) => (
                <div key={x.item_id} className="border rounded-xl p-3 flex gap-3 items-center">
                  <div className="h-14 w-14 rounded-lg bg-slate-200 overflow-hidden flex items-center justify-center">
                    {x.image_url ? (
                      <img src={x.image_url} alt={x.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-600">No image</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{x.name}</div>
                    <div className="text-xs text-slate-500 capitalize">
                      {x.category || "item"} {x.price != null ? `• €${x.price}` : ""}
                    </div>
                  </div>

                  <div className="text-sm text-slate-700">
                    sold: <b>{x.units_sold}</b>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Filters */}
      <section className="bg-white rounded-xl shadow-sm p-4 grid gap-3 md:grid-cols-3">
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All categories" : c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-slate-700">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />
          Available only
        </label>
      </section>

      {/* Menu + Cart */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Menu */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-slate-900">Menu</h2>
            <button
              onClick={fetchItems}
              className="px-4 py-2 rounded-lg bg-white border font-semibold hover:bg-slate-50"
            >
              Refresh menu
            </button>
          </div>

          {loadingItems && <p>Loading items…</p>}
          {itemsError && <p className="text-red-600">{itemsError}</p>}

          {!loadingItems && !itemsError && (
            <div className="grid gap-6 sm:grid-cols-2">
              {filteredItems.map((it) => (
                <div key={it.id} className="bg-white rounded-xl shadow-sm p-4 flex flex-col">
                  <div className="h-36 rounded-lg bg-slate-200 overflow-hidden flex items-center justify-center">
                    {it.image_url ? (
                      <img src={it.image_url} alt={it.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-600 text-sm">No image</span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{it.name}</h3>
                    <span
                      className={
                        it.available
                          ? "px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 font-semibold"
                          : "px-2 py-1 text-xs rounded-full bg-rose-100 text-rose-700 font-semibold"
                      }
                    >
                      {it.available ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 capitalize">{it.category}</p>

                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-bold">€{it.price}</p>
                    <p className="text-sm text-slate-700">
                      Stock: <b>{it.quantity}</b>
                    </p>
                  </div>

                  <p className="mt-1 text-xs text-slate-600">
                    Rating: <b>{Number(it.rating_avg).toFixed(1)}</b> ({it.rating_count})
                  </p>

                  <button
                    onClick={() => addToCart(it.id)}
                    disabled={!it.available}
                    className={
                      !it.available
                        ? "mt-4 py-2 rounded-lg bg-slate-200 text-slate-500 font-semibold"
                        : "mt-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                    }
                  >
                    Add to cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="bg-white rounded-xl shadow-sm p-4 h-fit">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Cart</h2>

          {cartLines.length === 0 ? (
            <p className="text-slate-600">Your cart is empty.</p>
          ) : (
            <div className="space-y-3">
              {cartLines.map((l) => (
                <div key={l.item_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{l.name}</div>
                      <div className="text-sm text-slate-600">€{l.unit_price} each</div>
                    </div>
                    <div className="text-sm font-semibold">€{l.line_total.toFixed(2)}</div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <button className="px-3 py-1 rounded-lg border" onClick={() => setCartQty(l.item_id, l.quantity - 1)}>-</button>
                    <input className="w-16 border rounded-lg px-2 py-1 text-center" value={l.quantity} onChange={(e) => setCartQty(l.item_id, e.target.value)} />
                    <button className="px-3 py-1 rounded-lg border" onClick={() => setCartQty(l.item_id, l.quantity + 1)}>+</button>
                    <button className="ml-auto px-3 py-1 rounded-lg bg-rose-100 text-rose-700 font-semibold" onClick={() => setCartQty(l.item_id, 0)}>Remove</button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-semibold">Total</span>
                <span className="font-bold">€{cartTotal.toFixed(2)}</span>
              </div>

              {checkoutMsg && <div className="rounded-lg border p-2 text-sm">{checkoutMsg}</div>}

              <button onClick={checkout} disabled={checkingOut} className="w-full py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800">
                {checkingOut ? "Placing order…" : "Checkout"}
              </button>

              <button onClick={clearCart} className="w-full py-2 rounded-lg bg-white border font-semibold hover:bg-slate-50">
                Clear cart
              </button>
            </div>
          )}
        </div>
      </section>

      {/* My Orders */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-slate-900">My Orders</h2>
          <button
            onClick={fetchMyOrders}
            className="px-4 py-2 rounded-lg bg-white border font-semibold hover:bg-slate-50"
          >
            Refresh orders
          </button>
        </div>

        {loadingOrders && <p>Loading orders…</p>}
        {ordersError && <p className="text-red-600">{ordersError}</p>}
        {ratingMsg && <div className="mb-3 rounded-lg border bg-white p-2 text-sm">{ratingMsg}</div>}

        {!loadingOrders && !ordersError && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-4">No orders yet.</div>
            ) : (
              orders.slice(0, 10).map((o) => (
                <div key={o.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">Order #{o.id}</div>
                      <div className="text-sm text-slate-600">
                        Total: <b>€{o.total_price}</b>
                        {o.estimated_ready_at ? <> • ETA: <b>{formatETA(o.estimated_ready_at)}</b></> : null}
                      </div>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  <div className="mt-3 text-sm text-slate-700">
                    {o.items?.map((line) => (
                      <div key={`${o.id}-${line.item_id}`} className="flex justify-between">
                        <span>{line.name} × <b>{line.quantity}</b></span>
                        <span>€{Number(line.line_total).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {o.status === "completed" && o.items?.length ? (
                    <div className="mt-3 border-t pt-3">
                      <div className="text-sm font-semibold mb-2">Rate items:</div>
                      <div className="flex flex-wrap gap-2">
                        {o.items.map((line) => (
                          <div key={`rate-${o.id}-${line.item_id}`} className="border rounded-lg px-3 py-2">
                            <div className="text-sm font-semibold">{line.name}</div>
                            <div className="flex gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((r) => (
                                <button
                                  key={r}
                                  onClick={() => rateItem(line.item_id, r)}
                                  className="px-2 py-1 rounded bg-slate-900 text-white text-xs hover:bg-slate-800"
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
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}