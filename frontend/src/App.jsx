import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import CustomerPage from "./pages/CustomerPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

const ADMIN_STORAGE_KEY = "cafeteria_admin_ok";
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || "cafeteria123"; // change later if you want

function AdminGate({ children }) {
  const navigate = useNavigate();
  const [keyInput, setKeyInput] = useState("");
  const [err, setErr] = useState("");

  const authed = localStorage.getItem(ADMIN_STORAGE_KEY) === "1";

  const onSubmit = (e) => {
    e.preventDefault();
    setErr("");

    if (keyInput === ADMIN_KEY) {
      localStorage.setItem(ADMIN_STORAGE_KEY, "1");
      navigate("/admin", { replace: true });
      return;
    }
    setErr("Wrong admin key.");
  };

  if (authed) return children;

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm p-6 border">
      <h2 className="text-xl font-bold text-slate-900">Staff / Admin Login</h2>
      <p className="text-slate-600 mt-1">
        Enter the admin key to access kitchen + inventory.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Admin key"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
        />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800">
          Enter Admin
        </button>
      </form>

      <p className="text-xs text-slate-500 mt-4">
        (For your project demo. Later you can replace this with real login.)
      </p>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Student Cafeteria</h1>
          <p className="text-slate-600">Customer website</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <Routes>
          <Route path="/" element={<CustomerPage />} />
          <Route
            path="/admin"
            element={
              <AdminGate>
                <AdminPage />
              </AdminGate>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="max-w-6xl mx-auto px-6 pb-8 text-xs text-slate-500">
        Staff access: go to <span className="font-mono">/admin</span> and enter key.
      </footer>
    </div>
  );
}