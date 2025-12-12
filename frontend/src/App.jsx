import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);

  // Ordering UI state
  const [qtyById, setQtyById] = useState({});
  const [orderingId, setOrderingId] = useState(null);
  const [orderMsg, setOrderMsg] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/items`);
      if (!res.ok) throw new Error(`Failed to load items (HTTP ${res.status})`);
      const data = await res.json();
      setItems(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
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
      return (
        String(i.name).toLowerCase().includes(s) ||
        String(i.category).toLowerCase().includes(s)
      );
    });
  }, [items, search, category, availableOnly]);

  const placeOrder = async (itemId) => {
    setOrderingId(itemId);
    setOrderMsg("");

    const qty = Number(qtyById[itemId] ?? 1);
    if (!Number.isFinite(qty) || qty <= 0) {
      setOrderMsg("❌ Quantity must be at least 1.");
      setOrderingId(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, quantity: qty }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const detail = data?.detail || `Order failed (HTTP ${res.status})`;
        throw new Error(detail);
      }

      setOrderMsg(`✅ Order #${data.id} created. Status: ${data.status}`);
      await fetchItems(); // refresh stock from MongoDB
    } catch (e) {
      setOrderMsg(`❌ ${String(e)}`);
    } finally {
      setOrderingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Student Cafeteria</h1>
          <p className="text-slate-600">
            Modern UI (React + Tailwind) • Backend (FastAPI + MongoDB)
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 grid gap-3 md:grid-cols-3">
          <input
            className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
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
        </div>

        {/* Status message */}
        {orderMsg && (
          <div className="mb-4 rounded-xl border bg-white p-3 text-slate-900 shadow-sm">
            {orderMsg}
          </div>
        )}

        {loading && <p className="text-slate-700">Loading menu…</p>}
        {error && <p className="text-red-600">{error}</p>}

        {/* Items Grid */}
        {!loading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((it) => (
              <div
                key={it.id}
                className="bg-white rounded-xl shadow-sm p-4 flex flex-col"
              >
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-900">{it.name}</h2>
                  <p className="text-sm text-slate-500 capitalize">{it.category}</p>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-lg font-bold text-slate-900">€{it.price}</p>
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

                  <p className="mt-2 text-sm text-slate-700">
                    Stock: <span className="font-semibold">{it.quantity}</span>
                  </p>
                </div>

                <div className="mt-4 flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    className="w-20 border rounded-lg px-2 py-2 text-slate-900"
                    value={qtyById[it.id] ?? 1}
                    onChange={(e) =>
                      setQtyById((prev) => ({
                        ...prev,
                        [it.id]: e.target.value,
                      }))
                    }
                  />

                  <button
                    onClick={() => placeOrder(it.id)}
                    disabled={!it.available || orderingId === it.id}
                    className={
                      !it.available
                        ? "flex-1 py-2 rounded-lg bg-slate-200 text-slate-500 font-semibold"
                        : "flex-1 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                    }
                  >
                    {orderingId === it.id ? "Ordering…" : "Order"}
                  </button>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="text-slate-600">No items match your filters.</div>
            )}
          </div>
        )}

        {/* Footer note */}
        <p className="mt-6 text-sm text-slate-500">
          Tip: After ordering, stock updates automatically because React refetches items from FastAPI.
        </p>
      </main>
    </div>
  );
}