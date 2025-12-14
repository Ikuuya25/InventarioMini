// App.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Settings,
  LogOut,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Minus,
  DollarSign,
  Receipt,
  BarChart3,
  Users,
  Menu,
  Eye,
  EyeOff,
  Moon,
  Sun,
} from "lucide-react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

/* -------------------- Helpers -------------------- */
const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
});
const formatCurrency = (amount) => clpFormatter.format(amount || 0);

const defaultUsers = [
  { id: 1, username: "admin", password: "admin123", name: "Administrador", role: "admin" },
  { id: 2, username: "vendedor", password: "vend123", name: "Vendedor", role: "vendedor" },
  { id: 3, username: "supervisor", password: "super123", name: "Supervisor", role: "supervisor" },
];

const defaultPermissions = {
  admin: {
    canViewProducts: true,
    canAddProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canViewInventory: true,
    canViewSales: true,
    canMakeSales: true,
    canViewReports: true,
    canViewConfig: true,
    canEditConfig: true,
    // Supplier permissions
    canAddSuppliers: true,
    canEditSuppliers: true,
    canDeleteSuppliers: true,
    sectionAccess: ["dashboard", "inventario", "ventas", "proveedores", "reportes", "configuracion"],
  },
  supervisor: {
    canViewProducts: true,
    canAddProducts: true,
    canEditProducts: true,
    canDeleteProducts: false,
    canViewInventory: true,
    canViewSales: true,
    canMakeSales: true,
    canViewReports: true,
    canViewConfig: true,
    canEditConfig: false,
    canAddSuppliers: true,
    canEditSuppliers: true,
    canDeleteSuppliers: false,
    sectionAccess: ["dashboard", "inventario", "ventas", "proveedores", "reportes", "configuracion"],
  },
  vendedor: {
    canViewProducts: true,
    canAddProducts: false,
    canEditProducts: false,
    canDeleteProducts: false,
    canViewInventory: true,
    canViewSales: true,
    canMakeSales: true,
    canViewReports: false,
    canViewConfig: false,
    canEditConfig: false,
    canAddSuppliers: false,
    canEditSuppliers: false,
    canDeleteSuppliers: false,
    sectionAccess: ["dashboard", "inventario", "ventas", "proveedores"],
  },
};

/* -------------------- Subcomponents -------------------- */
function Login({ onLogin, showPassword, setShowPassword, loginForm, setLoginForm }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Package className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Gestión</h1>
          <p className="text-gray-600 mt-2">Ingresa tus credenciales</p>
        </div>

        <form onSubmit={onLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Ingresa tu usuario"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={loginForm.password}
                onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Ingresa tu contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
          <p className="font-semibold mb-1">Usuarios de prueba:</p>
          <p>admin / admin123 — admin</p>
          <p>supervisor / super123 — supervisor</p>
          <p>vendedor / vend123 — vendedor</p>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ darkMode, setDarkMode, currentUser, onLogout, canAccessSection, activeSection, setActiveSection, sidebarOpen, setSidebarOpen }) {
  const sections = [
    { key: "dashboard", icon: BarChart3, label: "Dashboard" },
    { key: "inventario", icon: Package, label: "Inventario" },
    { key: "ventas", icon: ShoppingCart, label: "Ventas" },
    { key: "proveedores", icon: Users, label: "Proveedores" },
    { key: "reportes", icon: TrendingUp, label: "Reportes" },
    { key: "configuracion", icon: Settings, label: "Configuración" },
  ];

  return (
    <aside className={`fixed z-40 inset-y-0 left-0 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:relative w-64 transition-transform duration-300 ${darkMode ? "bg-gray-900" : "bg-white"} shadow-lg`}>
      <div className="h-full flex flex-col">
        <div className={`p-4 border-b flex items-center justify-between ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className="flex items-center space-x-2">
            <Package className={`w-6 h-6 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`} />
            <span className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Sistema</span>
          </div>
          <button className="lg:hidden p-2 rounded" onClick={() => setSidebarOpen(false)}>
            <X className={`w-6 h-6 ${darkMode ? "text-white" : "text-gray-900"}`} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sections.map((s) => canAccessSection(s.key) && (
            <button key={s.key} onClick={() => { setActiveSection(s.key); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${activeSection===s.key ? (darkMode ? "bg-indigo-900 text-indigo-300" : "bg-indigo-50 text-indigo-600") : (darkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-50")}`}>
              <s.icon className="w-5 h-5" />
              <span className="font-medium">{s.label}</span>
            </button>
          ))}
        </nav>

        <div className={`p-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <button onClick={() => setDarkMode((d) => !d)} className={`w-full mb-3 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg ${darkMode ? "bg-gray-800 text-yellow-400" : "bg-gray-100 text-gray-700"}`}>
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="text-sm font-medium">{darkMode ? "Modo Claro" : "Modo Oscuro"}</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${darkMode ? "bg-indigo-900" : "bg-indigo-100"} rounded-full flex items-center justify-center`}>
              <Users className={`w-5 h-5 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{currentUser.name}</p>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{currentUser.role === "admin" ? "Administrador" : currentUser.role === "supervisor" ? "⭐ Supervisor" : "👤 Vendedor" }</p>
            </div>
          </div>

          <button onClick={onLogout} className={`w-full mt-3 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg ${darkMode ? "bg-red-900 text-red-300" : "bg-red-50 text-red-600"}`}>
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function Header({ activeSection, darkMode, setSidebarOpen, onOpenAddProduct, onOpenAddSupplier, cartLength, onOpenSales }) {
  return (
    <header className={`${darkMode ? "bg-gray-900 border-gray-700" : "bg-white"} shadow-sm border-b px-4 sm:px-6 py-3 flex items-center justify-between w-full`}>
      <div className="flex items-center space-x-3">
        <button className="lg:hidden p-2 rounded" onClick={() => setSidebarOpen(true)}>
          <Menu className={`w-6 h-6 ${darkMode ? "text-white" : "text-gray-900"}`} />
        </button>
        <div>
          <h1 className={`text-lg md:text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {activeSection === "dashboard" ? "Dashboard" : activeSection === "inventario" ? "Gestión de Inventario" : activeSection === "ventas" ? "Ventas" : activeSection === "proveedores" ? "Proveedores" : activeSection === "reportes" ? "Reportes" : "Configuración"}
          </h1>
          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            {activeSection === "dashboard" ? "Resumen general" : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {activeSection === "inventario" && <button onClick={onOpenAddProduct} className="hidden sm:inline-flex items-center space-x-2 bg-indigo-600 text-white px-3 py-2 rounded-lg"><Plus className="w-4 h-4" /><span>Nuevo Producto</span></button>}
        {activeSection === "ventas" && <button onClick={onOpenSales} className="hidden sm:inline-flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg"><ShoppingCart className="w-4 h-4" /><span>Nueva Venta ({cartLength})</span></button>}
        {activeSection === "proveedores" && <button onClick={onOpenAddSupplier} className="hidden sm:inline-flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg"><Plus className="w-4 h-4" /><span>Nuevo Proveedor</span></button>}
      </div>
    </header>
  );
}

/* -------------------- Main App -------------------- */
export default function App() {
  // Auth & UI
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Data
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // UI & forms
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", sku: "", quantity: "", minStock: "", price: "", category: "Electrónica", supplier: "", iva: 19, ganancia: 40 });
  const [newSupplier, setNewSupplier] = useState({ name: "", contact: "", phone: "", address: "" });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Cart
  const [cart, setCart] = useState([]);

  // Users & permissions
  const users = useMemo(() => defaultUsers, []);
  const permissions = useMemo(() => defaultPermissions, []);

  const hasPermission = useCallback((permission) => {
    if (!currentUser) return false;
    return permissions[currentUser.role]?.[permission] || false;
  }, [currentUser, permissions]);

  const canAccessSection = useCallback((section) => {
    if (!currentUser) return false;
    return permissions[currentUser.role]?.sectionAccess.includes(section) || false;
  }, [currentUser, permissions]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  // Firestore subscriptions
  useEffect(() => {
    const unsubP = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubS = onSnapshot(collection(db, "sales"), (snap) => {
      setSales(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubSup = onSnapshot(collection(db, "suppliers"), (snap) => {
      setSuppliers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubP();
      unsubS();
      unsubSup();
    };
  }, []);

  // Derived values
  const totalProducts = useMemo(() => products.length, [products]);
  const totalValue = useMemo(() => products.reduce((s, p) => s + (p.quantity * (p.price || 0)), 0), [products]);
  const lowStockCount = useMemo(() => products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length, [products]);
  const outOfStockCount = useMemo(() => products.filter(p => p.quantity === 0).length, [products]);
  const totalSales = useMemo(() => sales.reduce((s, x) => s + (x.total || 0), 0), [sales]);
  const totalSalesCount = useMemo(() => sales.length, [sales]);
  const cartTotal = useMemo(() => cart.reduce((s, i) => s + (i.price * i.quantity), 0), [cart]);
  const salesByCategory = useMemo(() => {
    const map = {};

    sales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const product = products.find((p) => p.id === item.id);
        const category = product?.category || "Sin categoría";
        
        if (!map[category]) map[category] = 0;
        map[category] += item.price * item.quantity;
      });
    });

    return map;
  }, [sales, products]);


  // Weekly/monthly totals
  const weeklySalesTotal = useMemo(() => {
    const now = new Date(); const sevenAgo = new Date(); sevenAgo.setDate(now.getDate() - 7);
    return sales.filter(s => { try { const d = new Date(s.date); return d >= sevenAgo && d <= now; } catch { return false; } }).reduce((a, v) => a + (v.total || 0), 0);
  }, [sales]);

  const monthlySalesTotal = useMemo(() => {
    const now = new Date(); const m = now.getMonth(), y = now.getFullYear();
    return sales.filter(s => { try { const d = new Date(s.date); return d.getMonth() === m && d.getFullYear() === y; } catch { return false; } }).reduce((a, v) => a + (v.total || 0), 0);
  }, [sales]);

  // Login / logout
  const handleLogin = useCallback((e) => {
    e.preventDefault();
    const u = users.find(x => x.username === loginForm.username && x.password === loginForm.password);
    if (u) { setIsAuthenticated(true); setCurrentUser(u); setSidebarOpen(false); }
    else alert("Usuario o contraseña incorrectos");
  }, [loginForm, users]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLoginForm({ username: "", password: "" });
  }, []);

  // Product CRUD
  const handleAddProduct = useCallback(async () => {
    if (!newProduct.name || !newProduct.sku) return alert("Nombre y SKU obligatorios");
    const precioBase = parseFloat(newProduct.price) || 0;
    const priceIVA = newProduct.price * 1.19;
    const price40 = newProduct.priceIVA * 1.40;
    const finalPrice = 0;
    const product = {
      name: newProduct.name,
      sku: newProduct.sku,
      quantity: parseInt(newProduct.quantity) || 0,
      minStock: parseInt(newProduct.minStock) || 0,
      price: precioBase,
      priceIVA,
      price40,
      finalPrice,
      category: newProduct.category,
      supplier: newProduct.supplier,
      status: "En stock",
    };
    if (product.quantity === 0) product.status = "Agotado";
    else if (product.quantity <= product.minStock) product.status = "Stock bajo";
    try { await addDoc(collection(db, "products"), product); setNewProduct({ name: "", sku: "", quantity: "", minStock: "", price: "", category: "Electrónica", supplier: "", iva: 19, ganancia: 40 }); setShowAddProductModal(false); } catch (e) { console.error(e); alert("Error al agregar producto"); }
  }, [newProduct]);

  const handleDeleteProduct = useCallback(async (id) => {
    if (!hasPermission("canDeleteProducts")) { alert("No tienes permiso"); return; }
    if (!window.confirm("¿Eliminar producto?")) return;
    try { await deleteDoc(doc(db, "products", id)); } catch (e) { console.error(e); alert("Error"); }
  }, [hasPermission]);

  const handleSaveEditProduct = useCallback(async (updated) => {
    if (!hasPermission("canEditProducts")) { alert("No tienes permiso"); return; }
    const u = { ...updated };
    if (u.quantity === 0) u.status = "Agotado"; else if (u.quantity <= u.minStock) u.status = "Stock bajo"; else u.status = "En stock";
    try { await updateDoc(doc(db, "products", u.id), u); setEditingProduct(null); } catch (e) { console.error(e); alert("Error"); }
  }, [hasPermission]);

  // Suppliers CRUD
  const handleAddSupplier = useCallback(async () => {
    if (!hasPermission("canAddSuppliers")) { alert("No tienes permiso"); return; }
    if (!newSupplier.name) return alert("Nombre obligatorio");
    try { await addDoc(collection(db, "suppliers"), { name: newSupplier.name, contact: newSupplier.contact || "", phone: newSupplier.phone || "", address: newSupplier.address || "" }); setNewSupplier({ name: "", contact: "", phone: "", address: "" }); setShowAddSupplierModal(false); alert("Proveedor agregado"); } catch (e) { console.error(e); alert("Error"); }
  }, [newSupplier, hasPermission]);

  const handleDeleteSupplier = useCallback(async (supplierId) => {
    if (!hasPermission("canDeleteSuppliers")) { alert("No tienes permiso"); return; }
    const supplierObj = suppliers.find(s => s.id === supplierId);
    if (!supplierObj) return;
    const hasProducts = products.some(p => p.supplier === supplierObj.name);
    if (hasProducts) { alert("No puedes eliminar proveedor con productos asociados"); return; }
    if (!window.confirm(`¿Eliminar proveedor "${supplierObj.name}"?`)) return;
    try { await deleteDoc(doc(db, "suppliers", supplierId)); alert("Proveedor eliminado"); } catch (e) { console.error(e); alert("Error"); }
  }, [suppliers, products, hasPermission]);

  const handleSaveSupplierEdit = useCallback(async (updated) => {
    if (!hasPermission("canEditSuppliers")) { alert("No tienes permiso"); return; }
    if (!updated || !updated.name) return alert("Nombre obligatorio");
    try {
      const old = suppliers.find(s => s.id === updated.id);
      if (old && old.name !== updated.name) {
        // actualizar productos asociados
        const productsToUpdate = products.filter(p => p.supplier === old.name);
        for (const p of productsToUpdate) {
          await updateDoc(doc(db, "products", p.id), { supplier: updated.name });
        }
      }
      await updateDoc(doc(db, "suppliers", updated.id), { name: updated.name, contact: updated.contact || "", phone: updated.phone || "", address: updated.address || "" });
      setEditingSupplier(null); alert("Proveedor actualizado");
    } catch (e) { console.error(e); alert("Error"); }
  }, [suppliers, products, hasPermission]);

  // Cart logic
  const addToCart = useCallback((product) => {
    if (product.quantity === 0) return alert("Producto agotado");
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        if (exists.quantity >= product.quantity) { alert("No hay suficiente stock"); return prev; }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id) => setCart(prev => prev.filter(i => i.id !== id)), []);
  const updateCartQuantity = useCallback((id, newQ) => {
    const p = products.find(x => x.id === id); if (!p) return;
    if (newQ > p.quantity) return alert("No hay suficiente stock");
    if (newQ <= 0) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: newQ } : i));
  }, [products, removeFromCart]);

  const completeSale = useCallback(async () => {
    if (cart.length === 0) return alert("Carrito vacío");
    const sale = { date: new Date().toISOString(), items: [...cart], total: cartTotal, vendedor: currentUser?.name || "Anon" };
    try {
      await addDoc(collection(db, "sales"), sale);
      // actualizar stock
      for (const item of cart) {
        const prod = products.find(p => p.id === item.id);
        const newQuantity = Math.max(0, (prod?.quantity || 0) - item.quantity);
        let status = "En stock"; if (newQuantity === 0) status = "Agotado"; else if (prod && newQuantity <= prod.minStock) status = "Stock bajo";
        await updateDoc(doc(db, "products", item.id), { quantity: newQuantity, status });
      }
      setCart([]); setShowSalesModal(false); alert("Venta registrada exitosamente");
    } catch (e) { console.error(e); alert("Error al registrar venta"); }
  }, [cart, cartTotal, currentUser, products]);

  // Filtered products
  const filteredProducts = useMemo(() => products.filter(p => (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku || "").toLowerCase().includes(searchTerm.toLowerCase())), [products, searchTerm]);

  // If not logged
  if (!isAuthenticated) return <Login onLogin={handleLogin} showPassword={showPassword} setShowPassword={setShowPassword} loginForm={loginForm} setLoginForm={setLoginForm} />;

  /* -------------------- Render -------------------- */
  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? "dark" : ""}`}>
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} currentUser={currentUser} onLogout={handleLogout} canAccessSection={canAccessSection} activeSection={activeSection} setActiveSection={setActiveSection} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeSection={activeSection} darkMode={darkMode} setSidebarOpen={setSidebarOpen} onOpenAddProduct={() => setShowAddProductModal(true)} onOpenAddSupplier={() => setShowAddSupplierModal(true)} cartLength={cart.length} onOpenSales={() => setShowSalesModal(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* DASHBOARD */}
          {activeSection === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Productos</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
                    </div>
                    <Package className="w-10 h-10 text-indigo-600" />
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Valor Inventario</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalValue)}</p>
                    </div>
                    <DollarSign className="w-10 h-10 text-green-600" />
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ventas Totales</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSales)}</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-green-600" />
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Alertas</p>
                      <p className="text-2xl font-bold text-red-600">{lowStockCount + outOfStockCount}</p>
                    </div>
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-lg mb-2 dark:text-white">Ventas Semanales</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Últimos 7 días</p>
                  <div className="mt-4 text-3xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(weeklySalesTotal)}</div>
                </div>

                <div className="p-4 rounded-xl shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-lg mb-2 dark:text-white">Ventas Mensuales</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mes actual</p>
                  <div className="mt-4 text-3xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(monthlySalesTotal)}</div>
                </div>
              </div>
            </div>
          )}

          {/* INVENTARIO */}
          {activeSection === "inventario" && (
            <div>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Buscar productos..." />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Precio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Iva</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">40%</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredProducts.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          
                          <td className="px-6 py-4 text-gray-900 dark:text-white">{p.name}</td>

                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{p.sku}</td>

                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                            {editingProduct?.id === p.id
                              ? <input type="number" value={editingProduct.quantity} onChange={e => setEditingProduct({ ...editingProduct, quantity: Number(e.target.value) || 0 })} className="w-20 px-2 py-1 border rounded" />
                              : p.quantity}
                          </td>

                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                            {editingProduct?.id === p.id
                              ? <input type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) || 0 })} className="w-24 px-2 py-1 border rounded" />
                              : formatCurrency(p.price)}
                          </td>

                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{formatCurrency(p.priceIVA)}</td>

                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{formatCurrency(p.price40)}</td>

                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                            {editingProduct?.id === p.id
                              ? <input type="number" step="0.01" value={editingProduct.finalPrice} onChange={e => setEditingProduct({ ...editingProduct, finalPrice: Number(e.target.value) || 0 })} className="w-24 px-2 py-1 border rounded" />
                              : formatCurrency(p.finalPrice)}
                          </td>

                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${p.status === "Agotado" ? "bg-red-100 text-red-800" : p.status === "Stock bajo" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>{p.status}</span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {editingProduct?.id === p.id
                                ? <>
                                    <button onClick={() => handleSaveEditProduct(editingProduct)} className="text-green-600" title="Guardar">💾</button>
                                    <button onClick={() => setEditingProduct(null)} className="text-gray-500" title="Cancelar">❌</button>
                                  </>
                                : hasPermission("canEditProducts") && <button onClick={() => setEditingProduct({ ...p })} className="text-indigo-600" title="Editar"><Edit2 className="w-5 h-5" /></button>}
                              
                              {hasPermission("canDeleteProducts")
                                ? <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600" title="Eliminar"><Trash2 className="w-5 h-5" /></button>
                                : <button onClick={() => alert("No tienes permiso")} className="text-gray-400"><Trash2 className="w-5 h-5" /></button>}
                              
                              <button onClick={() => addToCart(p)} className="bg-green-600 text-white px-2 py-1 rounded">Agregar</button>
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden p-4 space-y-3">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow border">
                      
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{p.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {p.sku}</p>
                        </div>

                        {/* Acciones */}
                        <div className="ml-2 flex flex-col space-y-2">
                          {editingProduct?.id === p.id
                            ? <>
                                <button onClick={() => handleSaveEditProduct(editingProduct)} className="text-green-600 text-sm">💾</button>
                                <button onClick={() => setEditingProduct(null)} className="text-gray-500 text-sm">❌</button>
                              </>
                            : hasPermission("canEditProducts") && (
                                <button onClick={() => setEditingProduct({ ...p })} className="text-indigo-600 text-sm">✏️</button>
                              )
                          }

                          {hasPermission("canDeleteProducts")
                            ? <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 text-sm">🗑️</button>
                            : <button onClick={() => alert("No tienes permiso")} className="text-gray-400 text-sm cursor-not-allowed">🗑️</button>
                          }

                          <button onClick={() => addToCart(p)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Agregar</button>
                        </div>

                      </div>

                      {/* Precios */}
                      <div className="mt-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Precio</span>
                          {editingProduct?.id === p.id
                            ? <input type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) || 0 })} className="w-24 px-2 py-1 border rounded text-right" />
                            : <span className="text-gray-900 dark:text-white">{formatCurrency(p.price)}</span>}
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-500">IVA</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(p.priceIVA)}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-500">40%</span>
                          <span className="text-gray-900 dark:text-white">{formatCurrency(p.price40)}</span>
                        </div>

                        <div className="flex justify-between font-semibold">
                          <span className="text-gray-700 dark:text-gray-300">Final</span>
                          {editingProduct?.id === p.id
                            ? <input type="number" step="0.01" value={editingProduct.finalPrice} onChange={e => setEditingProduct({ ...editingProduct, finalPrice: Number(e.target.value) || 0 })} className="w-24 px-2 py-1 border rounded text-right font-semibold" />
                            : <span className="text-gray-900 dark:text-white">{formatCurrency(p.finalPrice)}</span>}
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-500">Stock</span>
                          {editingProduct?.id === p.id
                            ? <input type="number" value={editingProduct.quantity} onChange={e => setEditingProduct({ ...editingProduct, quantity: Number(e.target.value) || 0 })} className="w-20 px-2 py-1 border rounded text-right" />
                            : <span className="text-gray-900 dark:text-white">{p.quantity}</span>}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* floating cart */}
              {cart.length > 0 && (
                <div className="fixed bottom-4 right-4 z-30">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-indigo-500 w-80 max-h-96 overflow-hidden">
                    <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between text-white">
                      <div className="flex items-center space-x-2"><ShoppingCart className="w-5 h-5" /><h3 className="font-semibold">Carrito ({cart.length})</h3></div>
                      <button onClick={() => setCart([])}><Trash2 className="w-4 h-4 text-white" /></button>
                    </div>
                    <div className="p-4 max-h-64 overflow-y-auto">
                      <div className="space-y-3">
                        {cart.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium text-gray-900 dark:text-white">{item.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(item.price)} × {item.quantity}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="p-1 bg-gray-200 rounded"><Minus className="w-3 h-3" /></button>
                              <span className="w-6 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="p-1 bg-gray-200 rounded"><Plus className="w-3 h-3" /></button>
                              <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-600"><X className="w-4 h-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t p-4 bg-gray-50 dark:bg-gray-900">
                      <div className="flex justify-between mb-3"><span>Total:</span><span className="font-bold text-green-600">{formatCurrency(cartTotal)}</span></div>
                      <button onClick={() => { if (!hasPermission("canMakeSales")) return alert("No tienes permiso"); completeSale(); }} className="w-full bg-green-600 text-white py-2 rounded">Completar Venta</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VENTAS */}
          {activeSection === "ventas" && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos Totales</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSales)}</p>
                    </div>
                    <DollarSign className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Promedio Venta</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalSalesCount > 0 ? (totalSales / totalSalesCount) : 0)}</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Carrito Actual</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(cartTotal)}</p>
                    </div>
                    <ShoppingCart className="w-10 h-10 text-purple-600" />
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Cantidad Ventas</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSalesCount}</p>
                    </div>
                    <Receipt className="w-10 h-10 text-indigo-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Historial de Ventas</h2>
                </div>

                {sales.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-300">No hay ventas registradas</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sales.map((sale) => (
                      <div key={sale.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(sale.date).toLocaleString("es-CL")}</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">Venta #{sale.id}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Vendedor: {sale.vendedor}</p>
                          </div>
                          <div className="text-right mt-3 sm:mt-0">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(sale.total)}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {(sale.items || []).map((item, idx) => (
                            <div key={`${sale.id}-${idx}`} className="flex justify-between text-sm">
                              <span className="text-gray-700 dark:text-gray-300">{item.name} <span className="text-gray-500 dark:text-gray-400">x{item.quantity}</span></span>
                              <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* PROVEEDORES */}
          {activeSection === "proveedores" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Proveedores</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{suppliers.length}</p>
                    </div>
                    <Users className="w-10 h-10 text-indigo-600" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Productos Total</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
                    </div>
                    <Package className="w-10 h-10 text-green-600" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Con Productos</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{suppliers.filter(s => products.some(p => p.supplier === s.name)).length}</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {suppliers.length === 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No hay proveedores registrados</h3>
                    <p className="text-gray-600 dark:text-gray-300">Haz clic en "Nuevo Proveedor" para comenzar</p>
                  </div>
                )}

                {suppliers.map((supplier) => {
                  const supplierProducts = products.filter(p => p.supplier === supplier.name);
                  const totalValueSupplier = supplierProducts.reduce((s, p) => s + (p.quantity * (p.price || 0)), 0);
                  const totalStockSupplier = supplierProducts.reduce((s, p) => s + (p.quantity || 0), 0);

                  return (
                    <div key={supplier.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-xl font-bold text-white">{supplier.name}</h3>
                              {hasPermission("canEditSuppliers") && <button onClick={() => setEditingSupplier({ ...supplier })} className="p-1.5 bg-white/20 hover:bg-white/30 rounded transition" title="Editar proveedor"><Edit2 className="w-4 h-4 text-white" /></button>}
                              {hasPermission("canDeleteSuppliers") && <button onClick={() => handleDeleteSupplier(supplier.id)} className="p-1 hover:bg-white/20 rounded transition" title="Eliminar proveedor"><Trash2 className="w-4 h-4 text-white" /></button>}
                            </div>
                            <div className="mt-2 space-y-1 text-indigo-100">
                              {supplier.contact && <p className="text-sm">📧 {supplier.contact}</p>}
                              {supplier.phone && <p className="text-sm">📞 {supplier.phone}</p>}
                              {supplier.address && <p className="text-sm">📍 {supplier.address}</p>}
                            </div>
                          </div>
                          <div className="text-right mt-4 sm:mt-0">
                            <p className="text-sm text-indigo-100">Valor en Stock</p>
                            <p className="text-2xl font-bold text-white">{formatCurrency(totalValueSupplier)}</p>
                          </div>
                        </div>
                      </div>

                      {supplierProducts.length > 0 ? (
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {supplierProducts.map(prod => (
                              <div key={prod.id} className="p-3 border rounded">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{prod.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {prod.sku}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{prod.quantity} uds</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(prod.price)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-600 dark:text-gray-300">Sin productos del proveedor</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* REPORTES (simple resumen) */}
          {activeSection === "reportes" && (
  <>
    {/* RESUMEN PRINCIPAL */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Productos Totales
        </h3>
        <p className="text-3xl font-bold text-indigo-600">
          {totalProducts}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          En catálogo
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Valor Inventario
        </h3>
        <p className="text-3xl font-bold text-green-600">
          {formatCurrency(totalValue)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Total en stock
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Ingresos por Ventas
        </h3>
        <p className="text-3xl font-bold text-blue-600">
          {formatCurrency(totalSales)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Total vendido
        </p>
      </div>
    </div>

    {/* VENTAS POR CATEGORÍA & PRODUCTOS MÁS VENDIDOS */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* VENTAS POR CATEGORÍA */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">
          Ventas por Categoría
        </h3>

        <div className="space-y-3">
          {Object.entries(salesByCategory).map(([category, amount]) => (
            <div key={category}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {category}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(amount)}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{
                    width: `${totalSales > 0 ? (amount / totalSales) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}

          {Object.keys(salesByCategory).length === 0 && (
            <p className="text-gray-500 text-center py-8 dark:text-gray-300">
              No hay datos de ventas por categoría
            </p>
          )}
        </div>
      </div>

      {/* PRODUCTOS MÁS VENDIDOS */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">
          Productos Más Vendidos
        </h3>

        <div className="space-y-3">
          {products
            .map((product) => ({
              ...product,
              sold: sales
                .flatMap((s) => s.items)
                .filter((item) => item.id === product.id)
                .reduce((sum, item) => sum + item.quantity, 0),
            }))
            .filter((p) => p.sold > 0)
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 5)
            .map((product, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full font-bold text-sm">
                    {index + 1}
                  </span>

                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      Vendidos: {product.sold}
                    </p>
                  </div>
                </div>

                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(product.sold * product.price)}
                </span>
              </div>
            ))}

          {products.filter((p) =>
            sales.flatMap((s) => s.items).some((item) => item.id === p.id)
          ).length === 0 && (
            <p className="text-gray-500 text-center py-8 dark:text-gray-300">
              No hay productos vendidos aún
            </p>
          )}
        </div>
      </div>
    </div>

    {/* VENTAS SEMANALES Y MENSUALES */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* SEMANAL */}
      <div className="p-6 rounded-xl shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg mb-1 dark:text-white">
              Ventas Semanales
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Últimos 7 días
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
          {formatCurrency(weeklySalesTotal)}
        </div>
      </div>

      {/* MENSUAL */}
      <div className="p-6 rounded-xl shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg mb-1 dark:text-white">
              Ventas Mensuales
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mes en curso
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
          {formatCurrency(monthlySalesTotal)}
        </div>
      </div>
    </div>
  </>
)}



          {/* CONFIG */}
          {activeSection === "configuracion" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Configuración</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <p className="text-gray-600 dark:text-gray-300">Ajustes básicos del sistema.</p>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Usuario actual: <span className="font-medium text-gray-900 dark:text-white">{currentUser.name}</span></p>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Modals */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Agregar Producto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Nombre" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} className="p-2 border rounded" />
              <input placeholder="SKU" value={newProduct.sku} onChange={e => setNewProduct(p => ({ ...p, sku: e.target.value }))} className="p-2 border rounded" />
              <input placeholder="Cantidad" value={newProduct.quantity} onChange={e => setNewProduct(p => ({ ...p, quantity: e.target.value }))} className="p-2 border rounded" />
              <input placeholder="Stock mínimo" value={newProduct.minStock} onChange={e => setNewProduct(p => ({ ...p, minStock: e.target.value }))} className="p-2 border rounded" />
              <input placeholder="Precio base" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} className="p-2 border rounded" />
              <select value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))} className="p-2 border rounded">
                <option>Electrónica</option>
                <option>Accesorios</option>
                <option>Audio</option>
              </select>
              <input placeholder="Proveedor" value={newProduct.supplier} onChange={e => setNewProduct(p => ({ ...p, supplier: e.target.value }))} className="p-2 border rounded col-span-1 sm:col-span-2" />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => setShowAddProductModal(false)} className="px-4 py-2">Cancelar</button>
              <button onClick={handleAddProduct} className="px-4 py-2 bg-indigo-600 text-white rounded">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Agregar Proveedor</h3>
            <input placeholder="Nombre" value={newSupplier.name} onChange={e => setNewSupplier(s => ({ ...s, name: e.target.value }))} className="w-full mb-2 p-2 border rounded" />
            <input placeholder="Contacto" value={newSupplier.contact} onChange={e => setNewSupplier(s => ({ ...s, contact: e.target.value }))} className="w-full mb-2 p-2 border rounded" />
            <input placeholder="Teléfono" value={newSupplier.phone} onChange={e => setNewSupplier(s => ({ ...s, phone: e.target.value }))} className="w-full mb-2 p-2 border rounded" />
            <input placeholder="Dirección" value={newSupplier.address} onChange={e => setNewSupplier(s => ({ ...s, address: e.target.value }))} className="w-full mb-2 p-2 border rounded" />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowAddSupplierModal(false)} className="px-4 py-2">Cancelar</button>
              <button onClick={handleAddSupplier} className="px-4 py-2 bg-purple-600 text-white rounded">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {showSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Registrar Venta</h3>
            <div className="mb-4">
              {cart.length === 0 ? <p className="text-gray-500">Carrito vacío</p> : (
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <div><strong>{item.name}</strong> <span className="text-sm text-gray-500">x{item.quantity}</span></div>
                      <div>{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowSalesModal(false)} className="px-4 py-2">Cerrar</button>
              <button onClick={completeSale} className="px-4 py-2 bg-green-600 text-white rounded">Completar Venta</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit supplier modal */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar Proveedor</h3>
            <input value={editingSupplier.name} onChange={e => setEditingSupplier(s => ({ ...s, name: e.target.value }))} className="w-full mb-2 p-2 border rounded" />
            <input value={editingSupplier.contact} onChange={e => setEditingSupplier(s => ({ ...s, contact: e.target.value }))} className="w-full mb-2 p-2 border rounded" />
            <input value={editingSupplier.phone} onChange={e => setEditingSupplier(s => ({ ...s, phone: e.target.value }))} className="w-full mb-2 p-2 border rounded" />
            <input value={editingSupplier.address} onChange={e => setEditingSupplier(s => ({ ...s, address: e.target.value }))} className="w-full mb-2 p-2 border rounded" />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setEditingSupplier(null)} className="px-4 py-2">Cancelar</button>
              <button onClick={() => handleSaveSupplierEdit(editingSupplier)} className="px-4 py-2 bg-indigo-600 text-white rounded">Guardar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
