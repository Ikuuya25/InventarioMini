import React, { useEffect, useState } from 'react';
import { Package, ShoppingCart, TrendingUp, Settings, LogOut, Plus, Search, Edit2, Trash2, Check, X, AlertCircle, Minus, DollarSign, Receipt, BarChart3, Users, Menu, Eye, EyeOff, Box, TrendingDown, Moon, Sun } from 'lucide-react';
import { db } from "./firebase";
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot } from "firebase/firestore";

export default function ManagementSystem() {
  // Autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
  // Navegación
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false); // start closed for mobile
  const [darkMode, setDarkMode] = useState(false);
  
  // Roles-Usuarios
  const users = [
    { id: 1, username: 'admin', password: 'admin123', name: 'Administrador', role: 'admin' },
    { id: 2, username: 'vendedor', password: 'vend123', name: 'Vendedor', role: 'vendedor' },
    { id: 3, username: 'supervisor', password: 'super123', name: 'Supervisor', role: 'supervisor' }
  ];

  

  // Sistema de permisos
  const permissions = {
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
      sectionAccess: ['dashboard', 'inventario', 'ventas', 'proveedores', 'reportes', 'configuracion']
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
      sectionAccess: ['dashboard', 'inventario', 'ventas', 'proveedores', 'reportes', 'configuracion']
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
      sectionAccess: ['dashboard', 'inventario', 'ventas', 'proveedores']
    }
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    return permissions[currentUser.role]?.[permission] || false;
  };

  const canAccessSection = (section) => {
    if (!currentUser) return false;
    return permissions[currentUser.role]?.sectionAccess.includes(section) || false;
  };

  const clpFormatter = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    });

  const formatCurrency = (amount) => clpFormatter.format(amount);

  // Modo oscuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Estado productos
  const [products, setProducts] = useState([]);

  // Estado venta
  const [sales, setSales] = useState([]);
  const [cart, setCart] = useState([]);
  

  // Estado Proveedores
  const [suppliers, setSuppliers] = useState([]);
  useEffect(() => {
    const unsubscribeProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        setProducts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    );

    const unsubscribeSales = onSnapshot(
      collection(db, "sales"),
      (snapshot) => {
        setSales(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    );

    // Listener para proveedores
    const unsubscribeSuppliers = onSnapshot(
      collection(db, "suppliers"),
      (snapshot) => {
        setSuppliers(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeSales();
      unsubscribeSuppliers();
    };
  }, []);

  // Estado Modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Formulario productos
  const [newProduct, setNewProduct] = useState({
    name: '', sku: '', quantity: '', minStock: '', price: '', category: 'Electrónica', supplier: ''
  });

  // Formulario proveedores
  const [newSupplier, setNewSupplier] = useState({
    name: '', contact: '', phone: '', address: ''
  });

  // Estados nuevos: ventas semanal y mensual
  const [weeklySalesTotal, setWeeklySalesTotal] = useState(0);
  const [monthlySalesTotal, setMonthlySalesTotal] = useState(0);

  // Login
  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
      // ensure sidebar is closed on mobile when login
      setSidebarOpen(false);
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  };

  // Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLoginForm({ username: '', password: '' });
  };

  // Logica productos
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.sku) return;

    const basePrice = parseFloat(newProduct.price) || 0;

    const priceWithIVA = basePrice * 1.19; 
    const priceWithIncrease = priceWithIVA * 1.40; 

    const product = {
      name: newProduct.name,
      sku: newProduct.sku,
      quantity: parseInt(newProduct.quantity) || 0,
      minStock: parseInt(newProduct.minStock) || 0,
      price: basePrice,
      priceIVA: priceWithIVA,
      price40: priceWithIncrease,
      finalPrice: "", 
      category: newProduct.category,
      supplier: newProduct.supplier,
      status: "En stock",
    };

    // Actualizar estado según stock
    if (product.quantity === 0) product.status = "Agotado";
    else if (product.quantity <= product.minStock) product.status = "Stock bajo";

    try {
    await addDoc(collection(db, "products"), product);
    } catch (error) {
    console.error("Error al agregar producto:", error);
    }

    setNewProduct({
      name: "",
      sku: "",
      quantity: "",
      minStock: "",
      price: "",
      category: "",
      supplier: ""
    });

    setShowAddProductModal(false);
  };

  const handleDeleteProduct = async (id) => {
    if (!hasPermission("canDeleteProducts")) {
      alert("No tienes permiso para eliminar productos");
      return;
    }

    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;

    try {
      await deleteDoc(doc(db, "products", id));
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!hasPermission("canEditProducts")) {
      alert("No tienes permiso para editar productos");
      return;
      }

      const updated = { ...editingProduct };

 
      const basePrice = parseFloat(updated.price) || 0;
      const priceWithIVA = basePrice * 1.19;
      const priceWithIncrease = priceWithIVA * 1.40; 

      updated.price = basePrice;
      updated.priceIVA = priceWithIVA;
      updated.price40 = priceWithIncrease;

    // Estado según stock
    if (updated.quantity === 0) updated.status = "Agotado";
    else if (updated.quantity <= updated.minStock) updated.status = "Stock bajo";
    else updated.status = "En stock";

    try {
    await updateDoc(doc(db, "products", updated.id), updated);
    } catch (error) {
    console.error("Error al actualizar producto:", error);
    }

    setEditingProduct(null);
    };

  const handleAddSupplier = async () => {
    if (!newSupplier.name) {
      alert('El nombre del proveedor es obligatorio');
      return;
    }
    
    try {
      await addDoc(collection(db, "suppliers"), {
        name: newSupplier.name,
        contact: newSupplier.contact || '',
        phone: newSupplier.phone || '',
        address: newSupplier.address || ''
      });
      
      setNewSupplier({ name: '', contact: '', phone: '', address: '' });
      setShowAddSupplierModal(false);
      alert('Proveedor agregado exitosamente');
    } catch (error) {
      console.error("Error al agregar proveedor:", error);
      alert("Hubo un error al agregar el proveedor");
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const hasProducts = products.some(p => p.supplier === supplier.name);

    if (hasProducts) {
      alert('No puedes eliminar este proveedor porque tiene productos asociados');
      return;
    }
    
    if (window.confirm(`¿Estás seguro de eliminar el proveedor "${supplier.name}"?`)) {
      try {
        await deleteDoc(doc(db, "suppliers", supplierId));
        alert('Proveedor eliminado exitosamente');
      } catch (error) {
        console.error("Error al eliminar proveedor:", error);
        alert("Hubo un error al eliminar el proveedor");
      }
    }
  };
  const [editingSupplier, setEditingSupplier] = useState(null);


  // logica carrito
  const addToCart = (product) => {
    if (product.quantity === 0) {
      alert('Producto agotado');
      return;
    }
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        alert('No hay suficiente stock');
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    if (newQuantity > product.quantity) {
      alert('No hay suficiente stock');
      return;
    }
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    const sale = {
      date: new Date().toISOString(),
      items: [...cart],
      total: cartTotal,
      vendedor: currentUser.name
    };

    try {
      await addDoc(collection(db, "sales"), sale);

      for (const cartItem of cart) {
        const productRef = doc(db, "products", cartItem.id);
        const newQuantity = cartItem.quantity > 0
          ? (products.find(p => p.id === cartItem.id).quantity - cartItem.quantity)
          : 0;

        let newStatus = 'En stock';
        const original = products.find(p => p.id === cartItem.id);
        if (newQuantity === 0) newStatus = 'Agotado';
        else if (newQuantity <= original.minStock) newStatus = 'Stock bajo';

        await updateDoc(productRef, {
          quantity: newQuantity,
          status: newStatus
        });
      }

      setCart([]);
      setShowSalesModal(false);
      alert('Venta registrada exitosamente');

    } catch (error) {
      console.error("Error al registrar venta:", error);
      alert("Hubo un error al registrar la venta.");
    }
  };


  // Calculos
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalSalesCount = sales.length;
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'En stock': return 'bg-green-100 text-green-800';
      case 'Stock bajo': return 'bg-yellow-100 text-yellow-800';
      case 'Agotado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const salesByCategory = products.reduce((acc, product) => {
    const soldItems = sales.flatMap(s => s.items).filter(item => item.id === product.id);
    const totalSold = soldItems.reduce((sum, item) => sum + item.quantity, 0);
    if (!acc[product.category]) acc[product.category] = 0;
    acc[product.category] += totalSold * product.price;
    return acc;
  }, {});

  const handleEditSupplier = (supplier) => {
    setEditingSupplier({ ...supplier });
  };

  const handleSaveSupplierEdit = async () => {
    if (!editingSupplier.name) {
      alert('El nombre del proveedor es obligatorio');
      return;
    }

    try {
      const supplierRef = doc(db, "suppliers", editingSupplier.id);
      
      // Si cambió el nombre, actualizar también los productos asociados
      const oldSupplier = suppliers.find(s => s.id === editingSupplier.id);
      if (oldSupplier.name !== editingSupplier.name) {
        const productsToUpdate = products.filter(p => p.supplier === oldSupplier.name);
        
        for (const product of productsToUpdate) {
          await updateDoc(doc(db, "products", product.id), {
            supplier: editingSupplier.name
          });
        }
      }
      
      // Actualizar el proveedor
      await updateDoc(supplierRef, {
        name: editingSupplier.name,
        contact: editingSupplier.contact || '',
        phone: editingSupplier.phone || '',
        address: editingSupplier.address || ''
      });
      
      setEditingSupplier(null);
      alert('Proveedor actualizado exitosamente');
    } catch (error) {
      console.error("Error al actualizar proveedor:", error);
      alert("Hubo un error al actualizar el proveedor");
    }
  };

  // Calculo de ventas semanal y mensual a partir del estado `sales`
  useEffect(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Las ventas almacenadas usan la propiedad `date` en ISO (creadas al completar venta)
    const weekly = sales.filter((sale) => {
      try {
        const d = new Date(sale.date);
        return d >= sevenDaysAgo && d <= now;
      } catch {
        return false;
      }
    });
    const weeklyTotal = weekly.reduce((acc, v) => acc + (v.total ?? 0), 0);
    setWeeklySalesTotal(weeklyTotal);

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthly = sales.filter((sale) => {
      try {
        const d = new Date(sale.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      } catch {
        return false;
      }
    });
    const monthlyTotal = monthly.reduce((acc, v) => acc + (v.total ?? 0), 0);
    setMonthlySalesTotal(monthlyTotal);
  }, [sales]);

  // Login
  if (!isAuthenticated) {
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
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ingresa tu usuario"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Iniciar Sesión
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-semibold mb-2">Usuarios de prueba:</p>
            <p className="text-xs text-gray-600">👤 <strong>admin</strong> / admin123 - Acceso total</p>
            <p className="text-xs text-gray-600">👤 <strong>supervisor</strong> / super123 - Gestión sin eliminar</p>
            <p className="text-xs text-gray-600">👤 <strong>vendedor</strong> / vend123 - Solo ventas</p>
          </div>
        </div>
      </div>
    );
  }

  // Aplicación (RESPONSIVE LAYOUT COMPLETO)
  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>

      {/* Overlay mobile when sidebar open */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar (drawer on mobile, fixed on lg+) */}
      <aside className={`fixed z-40 inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:relative w-64 transition-transform duration-300 ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-lg`}>
        <div className="h-full flex flex-col">
          <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-2">
              <Package className={`w-6 h-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sistema</span>
            </div>
            <button className="lg:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800" onClick={() => setSidebarOpen(false)}>
              <X className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {canAccessSection('dashboard') && (
              <button onClick={() => { setActiveSection('dashboard'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition text-left ${activeSection === 'dashboard' ? `${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}` : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}`}>
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </button>
            )}

            {canAccessSection('inventario') && (
              <button onClick={() => { setActiveSection('inventario'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition text-left ${activeSection === 'inventario' ? `${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}` : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}`}>
                <Package className="w-5 h-5" />
                <span className="font-medium">Inventario</span>
              </button>
            )}

            {canAccessSection('ventas') && (
              <button onClick={() => { setActiveSection('ventas'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition text-left ${activeSection === 'ventas' ? `${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}` : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}`}>
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">Ventas</span>
              </button>
            )}

            {canAccessSection('proveedores') && (
              <button onClick={() => { setActiveSection('proveedores'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition text-left ${activeSection === 'proveedores' ? `${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}` : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}`}>
                <Users className="w-5 h-5" />
                <span className="font-medium">Proveedores</span>
              </button>
            )}

            {canAccessSection('reportes') && (
              <button onClick={() => { setActiveSection('reportes'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition text-left ${activeSection === 'reportes' ? `${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}` : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}`}>
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Reportes</span>
              </button>
            )}

            {canAccessSection('configuracion') && (
              <button onClick={() => { setActiveSection('configuracion'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition text-left ${activeSection === 'configuracion' ? `${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}` : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}`}>
                <Settings className="w-5 h-5" />
                <span className="font-medium">Configuración</span>
              </button>
            )}
          </nav>

          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button onClick={() => setDarkMode(!darkMode)} className={`w-full mb-3 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="text-sm font-medium">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>

            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${darkMode ? 'bg-indigo-900' : 'bg-indigo-100'} rounded-full flex items-center justify-center`}>
                <Users className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentUser.name}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'supervisor' ? '⭐ Supervisor' : '👤 Vendedor'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className={`w-full mt-3 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition ${darkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'} shadow-sm border-b px-4 sm:px-6 py-3 flex items-center justify-between w-full`}>
            <div className="flex items-center space-x-3">
              <button
                className="lg:hidden p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
              </button>

              <div>
                <h1 className={`text-lg md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {activeSection === 'dashboard'
                    ? 'Dashboard'
                    : activeSection === 'inventario'
                    ? 'Gestión de Inventario'
                    : activeSection === 'ventas'
                    ? 'Ventas'
                    : activeSection === 'proveedores'
                    ? 'Proveedores'
                    : activeSection === 'reportes'
                    ? 'Reportes y Estadísticas'
                    : 'Configuración'}
                </h1>

                <p
                  className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {activeSection === 'dashboard'
                    ? 'Resumen general de tu negocio'
                    : activeSection === 'inventario'
                    ? 'Administra tu catálogo de productos'
                    : activeSection === 'ventas'
                    ? 'Registra y consulta ventas'
                    : activeSection === 'proveedores'
                    ? 'Gestión de proveedores'
                    : activeSection === 'reportes'
                    ? 'Análisis detallado'
                    : 'Ajustes del sistema'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {activeSection === 'inventario' && (
                <button
                  onClick={() => {
                    if (!hasPermission('canAddProducts')) {
                      alert('No tienes permiso para agregar productos');
                      return;
                    }
                    setShowAddProductModal(true);
                  }}
                  className="hidden sm:inline-flex items-center space-x-2 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  <Plus className="w-4 h-4" /> <span>Nuevo Producto</span>
                </button>
              )}

              {activeSection === 'ventas' && (
                <button
                  onClick={() => {
                    if (!hasPermission('canMakeSales')) {
                      alert('❌ No tienes permiso para realizar ventas');
                      return;
                    }
                    setShowSalesModal(true);
                  }}
                  className="hidden sm:inline-flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <ShoppingCart className="w-4 h-4" />{' '}
                  <span>Nueva Venta ({cart.length})</span>
                </button>
              )}

              {activeSection === 'proveedores' && (
                <button
                  onClick={() => {
                    if (!hasPermission('canAddProducts')) {
                      alert('❌ No tienes permiso para agregar proveedores');
                      return;
                    }
                    setShowAddSupplierModal(true);
                  }}
                  className="hidden sm:inline-flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  <Plus className="w-4 h-4" /> <span>Nuevo Proveedor</span>
                </button>
              )}
            </div>
          </header>


        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">

          {/* Dashboard */}
          {activeSection === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">⚠️ Alertas de Stock</h3>
                  <div className="space-y-3">
                    {products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).slice(0, 3).map(product => (
                      <div key={product.id} className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Stock: {product.quantity}</p>
                        </div>
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      </div>
                    ))}
                    {products.filter(p => p.quantity === 0).slice(0, 2).map(product => (
                      <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Agotado</p>
                        </div>
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                    ))}
                    {lowStockCount + outOfStockCount === 0 && (
                      <p className="text-gray-500 text-center py-8 dark:text-gray-300">✓ Sin alertas de stock</p>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">📊 Ventas Recientes</h3>
                  <div className="space-y-3">
                    {sales.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Venta #{sale.id}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-300">{new Date(sale.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <span className="text-green-600 font-semibold">{formatCurrency(sale.total)}</span>
                      </div>
                    ))}
                    {sales.length === 0 && (
                      <p className="text-gray-500 text-center py-8 dark:text-gray-300">No hay ventas registradas</p>
                    )}
                  </div>
                </div>
              </div>

              {/*Resumen ventas semanal/mensual en dashboard */}
              <div className="mt-8 space-y-6">
                <h2 className="text-lg md:text-2xl font-bold text-gray-900">Resumen de Ventas</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CARD SEMANAL */}
                  <div className="p-4 rounded-xl shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-lg mb-2 dark:text-white">Ventas Semanales</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Resumen de ventas realizadas en los últimos 7 días.</p>
                    <div className="mt-4 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(weeklySalesTotal)}
                    </div>
                  </div>

                  {/* CARD MENSUAL */}
                  <div className="p-4 rounded-xl shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-lg mb-2 dark:text-white">Ventas Mensuales</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total del mes en curso.</p>
                    <div className="mt-4 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(monthlySalesTotal)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Inventario (responsive) */}
          {activeSection === 'inventario' && (
            <>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                {/* Tabla movil */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Iva</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">40%</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            {editingProduct?.id === product.id ? (
                              <>
                                <td className="px-3 py-2"><input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-2 py-1 border rounded" /></td>
                                <td className="px-3 py-2"><input type="text" value={editingProduct.sku} onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})} className="w-full px-2 py-1 border rounded" /></td>
                                <td className="px-3 py-2"><select value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full px-2 py-1 border rounded"><option>Electrónica</option><option>Accesorios</option><option>Audio</option></select></td>
                                <td className="px-3 py-2"><input type="text" value={editingProduct.supplier} onChange={(e) => setEditingProduct({...editingProduct, supplier: e.target.value})} className="w-full px-2 py-1 border rounded" /></td>
                                <td className="px-3 py-2"><input type="number" value={editingProduct.quantity} onChange={(e) => setEditingProduct({...editingProduct, quantity: parseInt(e.target.value) || 0})} className="w-14 px-2 py-1 border rounded" /></td>
                                <td className="px-3 py-2"><input type="number" step="0.01" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} className="w-16 px-2 py-1 border rounded" /></td>
                                <td className="px-3 py-2"><input type="number" step="0.01" value={editingProduct.priceIVA} onChange={(e) => setEditingProduct({...editingProduct, priceIVA: parseFloat(e.target.value) || 0})} className="w-16 px-2 py-1 border rounded" /></td>
                                <td className="px-3 py-2"><input type="number" step="0.01" value={editingProduct.price40} onChange={(e) => setEditingProduct({...editingProduct, price40: parseFloat(e.target.value) || 0})} className="w-16 px-2 py-1 border rounded" /></td>
                                <td className="px-3 py-2"><input type="number" step="0.01" value={editingProduct.finalPrice} onChange={(e) => setEditingProduct({...editingProduct, finalPrice: parseFloat(e.target.value) || 0})} className="w-16 px-2 py-1 border rounded" /></td>
                                <td className="px-3 py-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(editingProduct.status)}`}>{editingProduct.status}</span></td>
                                <td className="px-3 py-2"><div className="flex space-x-2"><button onClick={handleSaveEdit} className="text-green-600 hover:text-green-900"><Check className="w-5 h-5" /></button><button onClick={() => setEditingProduct(null)} className="text-gray-600 hover:text-gray-900"><X className="w-5 h-5" /></button></div></td>
                              </>
                            ) : (
                              <>
                                <td className="px-3 py-2"><div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div></td>
                                <td className="px-3 py-2"><div className="text-sm text-gray-500 dark:text-gray-300">{product.sku}</div></td>
                                <td className="px-3 py-2"><div className="text-sm text-gray-500 dark:text-gray-300">{product.category}</div></td>
                                <td className="px-3 py-2"><div className="text-sm text-gray-500 dark:text-gray-300">{product.supplier}</div></td>
                                <td className="px-3 py-2"><div className="text-sm text-gray-900 dark:text-white">{product.quantity}</div></td>
                                <td className="px-3 py-2"><div className="text-sm text-gray-900 dark:text-white">{formatCurrency(product.price)}</div></td>
                                <td className="px-3 py-2"><div className="text-sm text-gray-900 dark:text-white">{formatCurrency(product.priceIVA)}</div></td>
                                <td className="px-3 py-2"><div className="text-sm text-gray-900 dark:text-white">{formatCurrency(product.price40)}</div></td>
                                <td className="px-3 py-2"><div className="text-sm text-gray-900 dark:text-white">{formatCurrency(product.finalPrice)}</div></td>
                                <td className="px-3 py-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>{product.status}</span></td>
                                <td className="px-3 py-2"><div className="flex space-x-3">{hasPermission('canEditProducts') && (<button onClick={() => setEditingProduct({ ...product })} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="w-5 h-5" /></button>)}{hasPermission('canDeleteProducts') ? (<button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5" /></button>) : (<button onClick={() => alert('❌ No tienes permiso para eliminar productos')} className="text-gray-400 cursor-not-allowed"><Trash2 className="w-5 h-5" /></button>)}</div></td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cards for small screens */}
                <div className="md:hidden p-4 space-y-3">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>{product.status}</span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-300">SKU: {product.sku}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-300">Proveedor: {product.supplier}</p>
                          <p className="text-sm text-gray-900 dark:text-white mt-2">{formatCurrency(product.price)} • Stock: {product.quantity}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-end space-x-2">
                        {hasPermission('canEditProducts') && (<button onClick={() => setEditingProduct({ ...product })} className="p-2 bg-indigo-50 rounded"><Edit2 className="w-4 h-4 text-indigo-600" /></button>)}
                        {hasPermission('canDeleteProducts') ? (<button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>) : (<button onClick={() => alert('❌ No tienes permiso para eliminar productos')} className="p-2 bg-gray-50 rounded"><Trash2 className="w-4 h-4 text-gray-400" /></button>)}
                        <button onClick={() => addToCart(product)} className="ml-2 px-3 py-1 bg-green-600 text-white rounded text-sm">Agregar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Ventas */}
          {activeSection === 'ventas' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500 dark:text-gray-400">Total Ventas</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSalesCount}</p></div>
                    <Receipt className="w-10 h-10 text-indigo-600" />
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500 dark:text-gray-400">Ingresos Totales</p><p className="text-2xl font-bold text-green-600">{formatCurrency(totalSales)}</p></div>
                    <DollarSign className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500 dark:text-gray-400">Promedio Venta</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(totalSalesCount > 0 ? (totalSales / totalSalesCount) : 0)}</p></div>
                    <TrendingUp className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500 dark:text-gray-400">Carrito Actual</p><p className="text-2xl font-bold text-purple-600">{formatCurrency(cartTotal)}</p></div>
                    <ShoppingCart className="w-10 h-10 text-purple-600" />
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(sale.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">Venta #{sale.id}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Vendedor: {sale.vendedor}</p>
                          </div>
                          <div className="text-right mt-3 sm:mt-0"><p className="text-sm text-gray-500 dark:text-gray-400">Total</p><p className="text-2xl font-bold text-green-600">{formatCurrency(sale.total)}</p></div>
                        </div>
                        <div className="space-y-2">
                          {sale.items.map((item, idx) => (
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
            </>
          )}

          {/* Proveedores */}
          {activeSection === 'proveedores' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 dark:text-gray-400">Total Proveedores</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{suppliers.length}</p></div><Users className="w-10 h-10 text-indigo-600" /></div></div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 dark:text-gray-400">Productos Total</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p></div><Package className="w-10 h-10 text-green-600" /></div></div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 dark:text-gray-400">Con Productos</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{suppliers.filter(s => products.some(p => p.supplier === s.name)).length}</p></div><TrendingUp className="w-10 h-10 text-blue-600" /></div></div>
              </div>

              <div className="space-y-6">
                {suppliers.length === 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center"><Users className="w-16 h-16 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No hay proveedores registrados</h3><p className="text-gray-600 dark:text-gray-300">Haz clic en "Nuevo Proveedor" para comenzar</p></div>
                )}

                {suppliers.map((supplier) => {
                  const supplierProducts = products.filter(p => p.supplier === supplier.name);
                  const totalValue = supplierProducts.reduce((sum, p) => sum + (p.quantity * p.price), 0);
                  const totalStock = supplierProducts.reduce((sum, p) => sum + p.quantity, 0);
                  
                  return (
                    <div key={supplier.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-xl font-bold text-white">{supplier.name}</h3>
                              {hasPermission('canEditProducts') && (<button onClick={() => setEditingSupplier({ ...supplier })} className="p-1.5 bg-white/20 hover:bg-white/30 rounded transition" title="Editar proveedor"><Edit2 className="w-4 h-4 text-white" /></button>)}
                              {hasPermission('canDeleteProducts') && (<button onClick={() => handleDeleteSupplier(supplier.id)} className="p-1 hover:bg-white/20 rounded transition" title="Eliminar proveedor"><Trash2 className="w-4 h-4 text-white" /></button>)}
                            </div>
                            <div className="mt-2 space-y-1 text-indigo-100">
                              {supplier.contact && (<p className="text-sm">📧 {supplier.contact}</p>)}
                              {supplier.phone && (<p className="text-sm">📞 {supplier.phone}</p>)}
                              {supplier.address && (<p className="text-sm">📍 {supplier.address}</p>)}
                            </div>
                          </div>
                          <div className="text-right mt-4 sm:mt-0"><p className="text-sm text-indigo-100">Valor en Stock</p><p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p></div>
                        </div>
                      </div>

                      {supplierProducts.length > 0 ? (
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg"><Package className="w-8 h-8 text-blue-600" /><div><p className="text-xs text-gray-600 dark:text-gray-300">Productos</p><p className="text-lg font-bold text-gray-900 dark:text-white">{supplierProducts.length}</p></div></div>
                            <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg"><Box className="w-8 h-8 text-green-600" /><div><p className="text-xs text-gray-600 dark:text-gray-300">Stock Total</p><p className="text-lg font-bold text-gray-900 dark:text-white">{totalStock}</p></div></div>
                            <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg"><DollarSign className="w-8 h-8 text-purple-600" /><div><p className="text-xs text-gray-600 dark:text-gray-300">Valor Promedio</p><p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(supplierProducts.reduce((sum, p) => sum + p.price, 0) / supplierProducts.length)}</p></div></div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio IVA</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio 40%</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Final</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {supplierProducts.map((product) => (
                                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-4 py-3"><div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div></td>
                                    <td className="px-4 py-3"><div className="text-sm text-gray-500 dark:text-gray-300">{product.sku}</div></td>
                                    <td className="px-4 py-3"><div className="text-sm text-gray-500 dark:text-gray-300">{product.category}</div></td>
                                    <td className="px-4 py-3"><div className="text-sm text-gray-900 dark:text-white">{product.quantity}</div></td>
                                    <td className="px-4 py-3"><div className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(product.price)}</div></td>
                                    <td className="px-4 py-3"><div className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(product.priceIVA)}</div></td>
                                    <td className="px-4 py-3"><div className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(product.price40)}</div></td>
                                    <td className="px-4 py-3"><div className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(product.finalPrice)}</div></td>
                                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>{product.status}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center"><Package className="w-12 h-12 text-gray-400 mx-auto mb-2" /><p className="text-gray-500 dark:text-gray-300 text-sm">No hay productos de este proveedor</p></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Reportes */}
          {activeSection === 'reportes' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Productos Totales</h3><p className="text-3xl font-bold text-indigo-600">{totalProducts}</p><p className="text-sm text-gray-500 dark:text-gray-400 mt-2">En catálogo</p></div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Valor Inventario</h3><p className="text-3xl font-bold text-green-600">{formatCurrency(totalValue)}</p><p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Total en stock</p></div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Ingresos por Ventas</h3><p className="text-3xl font-bold text-blue-600">{formatCurrency(totalSales)}</p><p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Total vendido</p></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 dark:text-white">Ventas por Categoría</h3>
                  <div className="space-y-3">
                    {Object.entries(salesByCategory).map(([category, amount]) => (
                      <div key={category}>
                        <div className="flex justify-between mb-1"><span className="text-sm font-medium text-gray-700 dark:text-gray-300">{category}</span><span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(amount)}</span></div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700"><div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${totalSales > 0 ? (amount / totalSales) * 100 : 0}%` }}></div></div>
                      </div>
                    ))}
                    {Object.keys(salesByCategory).length === 0 && (<p className="text-gray-500 text-center py-8 dark:text-gray-300">No hay datos de ventas por categoría</p>)}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 dark:text-white">Productos Más Vendidos</h3>
                  <div className="space-y-3">
                    {products.map(product => ({ ...product, sold: sales.flatMap(s => s.items).filter(item => item.id === product.id).reduce((sum, item) => sum + item.quantity, 0) })).filter(p => p.sold > 0).sort((a,b)=>b.sold-a.sold).slice(0,5).map((product, index)=> (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><div className="flex items-center space-x-3"><span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full font-bold text-sm">{index+1}</span><div><p className="font-medium text-gray-900 dark:text-white">{product.name}</p><p className="text-sm text-gray-500 dark:text-gray-300">Vendidos: {product.sold}</p></div></div><span className="text-sm font-semibold text-green-600">{formatCurrency(product.sold * product.price)}</span></div>
                    ))}
                    {products.filter(p => sales.flatMap(s=>s.items).some(item=>item.id===p.id)).length === 0 && (<p className="text-gray-500 text-center py-8 dark:text-gray-300">No hay productos vendidos aún</p>)}
                  </div>
                </div>
              </div>

              {/* Ventas Semanales y Mensuales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* CARD SEMANAL */}
                <div className="p-6 rounded-xl shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1 dark:text-white">Ventas Semanales</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Últimos 7 días</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(weeklySalesTotal)}
                  </div>
                </div>

                {/* CARD MENSUAL */}
                <div className="p-6 rounded-xl shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1 dark:text-white">Ventas Mensuales</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Mes en curso</p>
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

          {/* Configuración */}
          {activeSection === 'configuracion' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Información del Usuario</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input type="text" value={currentUser.name} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                    <input type="text" value={currentUser.username} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                    <input 
                      type="text" 
                      value={currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'supervisor' ? 'Supervisor' : 'Vendedor'} 
                      disabled 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Permisos de tu Rol</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-200">Ver productos</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasPermission('canViewProducts') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hasPermission('canViewProducts') ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-200">Agregar productos</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasPermission('canAddProducts') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hasPermission('canAddProducts') ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-200">Editar productos</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasPermission('canEditProducts') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hasPermission('canEditProducts') ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-200">Eliminar productos</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasPermission('canDeleteProducts') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hasPermission('canDeleteProducts') ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-200">Realizar ventas</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasPermission('canMakeSales') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hasPermission('canMakeSales') ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-200">Ver reportes</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasPermission('canViewReports') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hasPermission('canViewReports') ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-200">Editar configuración</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasPermission('canEditConfig') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hasPermission('canEditConfig') ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Categorías de Productos</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-200">Electrónica</span>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{products.filter(p => p.category === 'Electrónica').length} productos</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-200">Accesorios</span>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{products.filter(p => p.category === 'Accesorios').length} productos</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-200">Audio</span>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{products.filter(p => p.category === 'Audio').length} productos</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Bebidas</span>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{products.filter(p => p.category === 'Bebidas').length} productos</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Lácteos y Fiambres</span>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{products.filter(p => p.category === 'Lácteos y Fiambres').length} productos</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Panadería y Pastelería</span>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{products.filter(p => p.category === 'Panadería y Pastelería').length} productos</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Snacks y Dulces</span>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{products.filter(p => p.category === 'Snacks y Dulces').length} productos</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Abarrotes</span>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{products.filter(p => p.category === 'Abarrotes').length} productos</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Modales (ejemplos básicos responsivos) */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"> 
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowAddProductModal(false)} />
          <div className="relative z-50 w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow p-6 overflow-auto max-h-[90vh]">
            <h3 className="text-lg font-semibold mb-4">Agregar Producto</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label><input value={newProduct.name} onChange={(e)=>setNewProduct({...newProduct,name:e.target.value})} className="w-full px-3 py-2 border rounded" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">SKU</label><input value={newProduct.sku} onChange={(e)=>setNewProduct({...newProduct,sku:e.target.value})} className="w-full px-3 py-2 border rounded" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label><select value={newProduct.category} onChange={(e)=>setNewProduct({...newProduct,category:e.target.value})} className="w-full px-3 py-2 border rounded"><option>Electrónica</option><option>Accesorios</option><option>Audio</option></select></div></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label><input type="number" value={newProduct.quantity} onChange={(e)=>setNewProduct({...newProduct,quantity:e.target.value})} className="w-full px-3 py-2 border rounded" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Stock Min</label><input type="number" value={newProduct.minStock} onChange={(e)=>setNewProduct({...newProduct,minStock:e.target.value})} className="w-full px-3 py-2 border rounded" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Precio</label><input type="number" value={newProduct.price} onChange={(e)=>setNewProduct({...newProduct,price:e.target.value})} className="w-full px-3 py-2 border rounded" /></div></div>
              <div className="flex justify-end space-x-2"><button onClick={()=>setShowAddProductModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button><button onClick={handleAddProduct} className="px-4 py-2 bg-indigo-600 text-white rounded">Agregar</button></div>
            </div>
          </div>
        </div>
      )}

      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={()=>setShowAddSupplierModal(false)} />
          <div className="relative z-50 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-6 overflow-auto max-h-[90vh]">
            <h3 className="text-lg font-semibold mb-4">Agregar Proveedor</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label><input value={newSupplier.name} onChange={(e)=>setNewSupplier({...newSupplier,name:e.target.value})} className="w-full px-3 py-2 border rounded" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input value={newSupplier.contact} onChange={(e)=>setNewSupplier({...newSupplier,contact:e.target.value})} className="w-full px-3 py-2 border rounded" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input value={newSupplier.phone} onChange={(e)=>setNewSupplier({...newSupplier,phone:e.target.value})} className="w-full px-3 py-2 border rounded" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label><input value={newSupplier.address} onChange={(e)=>setNewSupplier({...newSupplier,address:e.target.value})} className="w-full px-3 py-2 border rounded" /></div></div>
              <div className="flex justify-end space-x-2"><button onClick={()=>setShowAddSupplierModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button><button onClick={handleAddSupplier} className="px-4 py-2 bg-purple-600 text-white rounded">Agregar</button></div>
            </div>
          </div>
        </div>
      )}

      {showSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={()=>setShowSalesModal(false)} />
          <div className="relative z-50 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow p-6 overflow-auto max-h-[90vh]">
            <h3 className="text-lg font-semibold mb-4">Registrar Venta</h3>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900"><tr><th className="px-4 py-2 text-left text-sm">Producto</th><th className="px-4 py-2 text-left text-sm">Precio</th><th className="px-4 py-2 text-left text-sm">Cantidad</th><th className="px-4 py-2 text-left text-sm">Subtotal</th><th className="px-4 py-2 text-left text-sm">Acciones</th></tr></thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id} className="border-b"><td className="px-4 py-2">{item.name}</td><td className="px-4 py-2">{formatCurrency(item.price)}</td><td className="px-4 py-2"><input type="number" value={item.quantity} onChange={(e)=>updateCartQuantity(item.id, parseInt(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded" /></td><td className="px-4 py-2">{formatCurrency(item.price*item.quantity)}</td><td className="px-4 py-2"><button onClick={()=>removeFromCart(item.id)} className="text-red-600">Eliminar</button></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center"><div></div><div><p className="text-lg font-semibold">Total: {formatCurrency(cartTotal)}</p><div className="mt-2 flex space-x-2"><button onClick={()=>setShowSalesModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button><button onClick={completeSale} className="px-4 py-2 bg-green-600 text-white rounded">Completar Venta</button></div></div></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
