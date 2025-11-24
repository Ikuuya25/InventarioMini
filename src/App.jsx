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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  // Login
  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
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

    const product = {
      name: newProduct.name,
      sku: newProduct.sku,
      quantity: parseInt(newProduct.quantity) || 0,
      minStock: parseInt(newProduct.minStock) || 0,
      price: parseFloat(newProduct.price) || 0,
      category: newProduct.category,
      supplier: newProduct.supplier,
      status: "En stock"
    };

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
      category: "Electrónica",
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
      // Agregar proveedor a Firebase
      const docRef = await addDoc(collection(db, "suppliers"), {
        name: newSupplier.name,
        contact: newSupplier.contact,
        phone: newSupplier.phone,
        address: newSupplier.address
      });

      // Mantener tu estado local actualizado
      const supplier = {
        id: docRef.id, // ahora usamos ID de Firestore
        name: newSupplier.name,
        contact: newSupplier.contact,
        phone: newSupplier.phone,
        address: newSupplier.address
      };

      setSuppliers([...suppliers, supplier]);
      setNewSupplier({ name: '', contact: '', phone: '', address: '' });
      setShowAddSupplierModal(false);

      alert('Proveedor agregado exitosamente');

    } catch (error) {
      console.error("Error agregando proveedor:", error);
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

    if (!window.confirm(`¿Estás seguro de eliminar el proveedor "${supplier.name}"?`)) {
      return;
    }

    try {
      // Eliminar en Firebase
      await deleteDoc(doc(db, "suppliers", supplierId));

      // Eliminar en tu estado local
      setSuppliers(suppliers.filter(s => s.id !== supplierId));

      alert('Proveedor eliminado');

    } catch (error) {
      console.error("Error eliminando proveedor:", error);
      alert("Hubo un error al eliminar el proveedor");
    }
  };


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
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Firebase listeners
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

    const unsubscribeSuppliers = onSnapshot(
      collection(db, "suppliers"),
      (snapshot) => {
        const firebaseSuppliers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSuppliers(firebaseSuppliers);
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeSales();
      unsubscribeSuppliers();
    };
  }, []);

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

  // Aplicación
  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-lg transition-all duration-300`}>
        <div className="h-full flex flex-col">
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            {sidebarOpen && (
              <div className="flex items-center space-x-2">
                <Package className={`w-6 h-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sistema</span>
              </div>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded`}>
              <Menu className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
            </button>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {canAccessSection('dashboard') && (
              <button
                onClick={() => setActiveSection('dashboard')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeSection === 'dashboard' 
                    ? `${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}` 
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                {sidebarOpen && <span className="font-medium">Dashboard</span>}
              </button>
            )}
            
            {canAccessSection('inventario') && (
              <button
                onClick={() => setActiveSection('inventario')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeSection === 'inventario' 
                    ? `${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}` 
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`
                }`}
              >
                <Package className="w-5 h-5" />
                {sidebarOpen && <span className="font-medium">Inventario</span>}
              </button>
            )}
            
            {canAccessSection('ventas') && (
              <button
                onClick={() => setActiveSection('ventas')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeSection === 'ventas' 
                    ? `${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}` 
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {sidebarOpen && <span className="font-medium">Ventas</span>}
              </button>
            )}
            
            {canAccessSection('proveedores') && (
              <button
                onClick={() => setActiveSection('proveedores')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeSection === 'proveedores' 
                    ? `${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}` 
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`
                }`}
              >
                <Users className="w-5 h-5" />
                {sidebarOpen && <span className="font-medium">Proveedores</span>}
              </button>
            )}
            
            {canAccessSection('reportes') && (
              <button
                onClick={() => setActiveSection('reportes')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeSection === 'reportes' 
                    ? `${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}` 
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                {sidebarOpen && <span className="font-medium">Reportes</span>}
              </button>
            )}
            
            {canAccessSection('configuracion') && (
              <button
                onClick={() => setActiveSection('configuracion')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeSection === 'configuracion' 
                    ? `${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}` 
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`
                }`}
              >
                <Settings className="w-5 h-5" />
                {sidebarOpen && <span className="font-medium">Configuración</span>}
              </button>
            )}
          </nav>
          
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full mb-3 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition ${
                darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {sidebarOpen && <span className="text-sm font-medium">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>}
            </button>
            
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${darkMode ? 'bg-indigo-900' : 'bg-indigo-100'} rounded-full flex items-center justify-center`}>
                <Users className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              {sidebarOpen && (
                <div className="flex-1">
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentUser.name}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'supervisor' ? '⭐ Supervisor' : '👤 Vendedor'}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`w-full mt-3 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition ${
                darkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              <LogOut className="w-4 h-4" />
              {sidebarOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-auto ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'} shadow-sm border-b px-8 py-4`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {activeSection === 'dashboard' && 'Dashboard'}
                {activeSection === 'inventario' && 'Gestión de Inventario'}
                {activeSection === 'ventas' && 'Ventas'}
                {activeSection === 'proveedores' && 'Proveedores'}
                {activeSection === 'reportes' && 'Reportes y Estadísticas'}
                {activeSection === 'configuracion' && 'Configuración'}
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                {activeSection === 'dashboard' && 'Resumen general de tu negocio'}
                {activeSection === 'inventario' && 'Administra tu catálogo de productos'}
                {activeSection === 'ventas' && 'Registra y consulta ventas'}
                {activeSection === 'proveedores' && 'Gestión de proveedores y sus productos'}
                {activeSection === 'reportes' && 'Análisis detallado de tu negocio'}
                {activeSection === 'configuracion' && 'Ajustes del sistema'}
              </p>
            </div>
            
            {activeSection === 'inventario' && (
              <button
                onClick={() => {
                  if (!hasPermission('canAddProducts')) {
                    alert('No tienes permiso para agregar productos');
                    return;
                  }
                  setShowAddProductModal(true);
                }}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-5 h-5" />
                <span>Nuevo Producto</span>
              </button>
            )}
            
            {activeSection === 'ventas' && (
              <button
                onClick={() => {
                  if (!hasPermission('canMakeSales')) {
                    alert('No tienes permiso para realizar ventas');
                    return;
                  }
                  setShowSalesModal(true);
                }}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Nueva Venta ({cart.length})</span>
              </button>
            )}

            {activeSection === 'proveedores' && (
              <button
                onClick={() => {
                  if (!hasPermission('canAddProducts')) {
                    alert('No tienes permiso para agregar proveedores');
                    return;
                  }
                  setShowAddSupplierModal(true);
                }}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                <Plus className="w-5 h-5" />
                <span>Nuevo Proveedor</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-8">
          {activeSection === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-600">Total Productos</p><p className="text-2xl font-bold text-gray-900">{totalProducts}</p></div>
                    <Package className="w-10 h-10 text-indigo-600" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-600">Valor Inventario</p><p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p></div>
                    <DollarSign className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-600">Ventas Totales</p><p className="text-2xl font-bold text-green-600">{formatCurrency(totalSales)}</p></div>
                    <TrendingUp className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-600">Alertas</p><p className="text-2xl font-bold text-red-600">{lowStockCount + outOfStockCount}</p></div>
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">⚠️ Alertas de Stock</h3>
                  <div className="space-y-3">
                    {products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).slice(0, 3).map(product => (
                      <div key={product.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <div><p className="font-medium text-gray-900">{product.name}</p><p className="text-sm text-gray-600">Stock: {product.quantity}</p></div>
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      </div>
                    ))}
                    {products.filter(p => p.quantity === 0).slice(0, 2).map(product => (
                      <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <div><p className="font-medium text-gray-900">{product.name}</p><p className="text-sm text-gray-600">Agotado</p></div>
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                    ))}
                    {lowStockCount + outOfStockCount === 0 && (
                      <p className="text-gray-500 text-center py-8">✓ Sin alertas de stock</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">📊 Ventas Recientes</h3>
                  <div className="space-y-3">
                    {sales.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Venta #{sale.id}</p>
                          <p className="text-xs text-gray-500">{new Date(sale.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <span className="text-green-600 font-semibold">{formatCurrency(sale.total)}</span>
                      </div>
                    ))}
                    {sales.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No hay ventas registradas</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Estado del Inventario</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div><p className="text-sm text-gray-600">En Stock</p><p className="text-2xl font-bold text-green-700">{products.filter(p => p.status === 'En stock').length}</p></div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><Package className="w-6 h-6 text-green-600" /></div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div><p className="text-sm text-gray-600">Stock Bajo</p><p className="text-2xl font-bold text-yellow-700">{lowStockCount}</p></div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center"><AlertCircle className="w-6 h-6 text-yellow-600" /></div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div><p className="text-sm text-gray-600">Agotados</p><p className="text-2xl font-bold text-red-700">{outOfStockCount}</p></div>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><TrendingDown className="w-6 h-6 text-red-600" /></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'inventario' && (
            <>
              <div className="mb-6">
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

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        {editingProduct?.id === product.id ? (
                          <>
                            <td className="px-6 py-4">
                              <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-2 py-1 border rounded" />
                            </td>
                            <td className="px-6 py-4">
                              <input type="text" value={editingProduct.sku} onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})} className="w-full px-2 py-1 border rounded" />
                            </td>
                            <td className="px-6 py-4">
                              <select value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full px-2 py-1 border rounded">
                                <option>Electrónica</option>
                                <option>Accesorios</option>
                                <option>Audio</option>
                                <option>Bebidas</option>
                                <option>Lácteos y Fiambres</option>
                                <option>Panadería y Pastelería</option>
                                <option>Snacks y Dulces</option>
                                <option>Abarrotes</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <select type="text" value={editingProduct.supplier} onChange={(e) => setEditingProduct({...editingProduct, supplier: e.target.value})} className="w-full px-2 py-1 border rounded">
                                <option value="">Seleccionar proveedor…</option>
                                  {suppliers.map(supplier => 
                                    <option key={supplier.id} value={supplier.name}>
                                      {supplier.name}
                                    </option>
                                  )}
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <input type="number" value={editingProduct.quantity} onChange={(e) => setEditingProduct({...editingProduct, quantity: parseInt(e.target.value) || 0})} className="w-20 px-2 py-1 border rounded" />
                            </td>
                            <td className="px-6 py-4">
                              <input type="number" step="0.01" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} className="w-24 px-2 py-1 border rounded" />
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(editingProduct.status)}`}>{editingProduct.status}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-900"><Check className="w-5 h-5" /></button>
                                <button onClick={() => setEditingProduct(null)} className="text-gray-600 hover:text-gray-900"><X className="w-5 h-5" /></button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{product.name}</div></td>
                            <td className="px-6 py-4"><div className="text-sm text-gray-500">{product.sku}</div></td>
                            <td className="px-6 py-4"><div className="text-sm text-gray-500">{product.category}</div></td>
                            <td className="px-6 py-4"><div className="text-sm text-gray-500">{product.supplier}</div></td>
                            <td className="px-6 py-4"><div className="text-sm text-gray-900">{product.quantity}</div></td>
                            <td className="px-6 py-4"><div className="text-sm text-gray-900">{formatCurrency(product.price)}</div></td>
                            <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>{product.status}</span></td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-3">
                                {hasPermission('canEditProducts') && (
                                  <button onClick={() => setEditingProduct({ ...product })} className="text-indigo-600 hover:text-indigo-900">
                                    <Edit2 className="w-5 h-5" />
                                  </button>
                                )}
                                {hasPermission('canDeleteProducts') ? (
                                  <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-900">
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => alert('No tienes permiso para eliminar productos')} 
                                    className="text-gray-400 cursor-not-allowed"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeSection === 'ventas' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-600">Total Ventas</p><p className="text-2xl font-bold text-gray-900">{totalSalesCount}</p></div>
                    <Receipt className="w-10 h-10 text-indigo-600" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-600">Ingresos Totales</p><p className="text-2xl font-bold text-green-600">{formatCurrency(totalSales)}</p></div>
                    <DollarSign className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-600">Promedio Venta</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(totalSalesCount > 0 ? (totalSales / totalSalesCount) : 0)}</p></div>
                    <TrendingUp className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-600">Carrito Actual</p><p className="text-2xl font-bold text-purple-600">{formatCurrency(cartTotal)}</p></div>
                    <ShoppingCart className="w-10 h-10 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Historial de Ventas</h2>
                </div>
                {sales.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay ventas registradas</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {sales.map((sale) => (
                      <div key={sale.id} className="p-6 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-sm text-gray-500">{new Date(sale.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">Venta #{sale.id}</p>
                            <p className="text-sm text-gray-600">Vendedor: {sale.vendedor}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(sale.total)}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {sale.items.map((item, idx) => (
                            <div key={`${sale.id}-${idx}`} className="flex justify-between text-sm">
                              <span className="text-gray-700">{item.name} <span className="text-gray-500">x{item.quantity}</span></span>
                              <span className="text-gray-900 font-medium">{formatCurrency(item.price * item.quantity)}</span>
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

          {activeSection === 'proveedores' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Proveedores</p>
                      <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
                    </div>
                    <Users className="w-10 h-10 text-indigo-600" />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Productos Total</p>
                      <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                    </div>
                    <Package className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Con Productos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {suppliers.filter(s => products.some(p => p.supplier === s.name)).length}
                      </p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {suppliers.map((supplier) => {
                  const supplierProducts = products.filter(p => p.supplier === supplier.name);
                  const totalValue = supplierProducts.reduce((sum, p) => sum + (p.quantity * p.price), 0);
                  const totalStock = supplierProducts.reduce((sum, p) => sum + p.quantity, 0);
                  
                  return (
                    <div key={supplier.id} className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-xl font-bold text-white">{supplier.name}</h3>
                              {hasPermission('canDeleteProducts') && (
                                <button
                                  onClick={() => handleDeleteSupplier(supplier.id)}
                                  className="p-1 hover:bg-white/20 rounded transition"
                                  title="Eliminar proveedor"
                                >
                                  <Trash2 className="w-4 h-4 text-white" />
                                </button>
                              )}
                            </div>
                            <div className="mt-2 space-y-1">
                              {supplier.contact && (
                                <p className="text-indigo-100 text-sm">📧 {supplier.contact}</p>
                              )}
                              {supplier.phone && (
                                <p className="text-indigo-100 text-sm">📞 {supplier.phone}</p>
                              )}
                              {supplier.address && (
                                <p className="text-indigo-100 text-sm">📍 {supplier.address}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-indigo-100">Valor en Stock</p>
                            <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
                          </div>
                        </div>
                      </div>
                      
                      {supplierProducts.length > 0 ? (
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                              <Package className="w-8 h-8 text-blue-600" />
                              <div>
                                <p className="text-xs text-gray-600">Productos</p>
                                <p className="text-lg font-bold text-gray-900">{supplierProducts.length}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                              <Box className="w-8 h-8 text-green-600" />
                              <div>
                                <p className="text-xs text-gray-600">Stock Total</p>
                                <p className="text-lg font-bold text-gray-900">{totalStock}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                              <DollarSign className="w-8 h-8 text-purple-600" />
                              <div>
                                <p className="text-xs text-gray-600">Valor Promedio</p>
                                <p className="text-lg font-bold text-gray-900">
                                  {formatCurrency(supplierProducts.reduce((sum, p) => sum + p.price, 0) / supplierProducts.length)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {supplierProducts.map((product) => (
                                  <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-gray-500">{product.sku}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-gray-500">{product.category}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-gray-900">{product.quantity}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm font-medium text-gray-900">{formatCurrency(product.price)}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                                        {product.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No hay productos de este proveedor</p>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {suppliers.length === 0 && (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay proveedores registrados</h3>
                    <p className="text-gray-600">Haz clic en "Nuevo Proveedor" para comenzar</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === 'reportes' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Productos Totales</h3>
                  <p className="text-3xl font-bold text-indigo-600">{totalProducts}</p>
                  <p className="text-sm text-gray-500 mt-2">En catálogo</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Valor Inventario</h3>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(totalValue)}</p>
                  <p className="text-sm text-gray-500 mt-2">Total en stock</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Ingresos por Ventas</h3>
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalSales)}</p>
                  <p className="text-sm text-gray-500 mt-2">Total vendido</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Ventas por Categoría</h3>
                  <div className="space-y-3">
                    {Object.entries(salesByCategory).map(([category, amount]) => (
                      <div key={category}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{category}</span>
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(amount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${totalSales > 0 ? (amount / totalSales) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                    ))}
                    {Object.keys(salesByCategory).length === 0 && (
                      <p className="text-gray-500 text-center py-8">No hay datos de ventas por categoría</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Productos Más Vendidos</h3>
                  <div className="space-y-3">
                    {products.map(product => ({
                      ...product,
                      sold: sales.flatMap(s => s.items).filter(item => item.id === product.id).reduce((sum, item) => sum + item.quantity, 0)
                    })).filter(p => p.sold > 0).sort((a, b) => b.sold - a.sold).slice(0, 5).map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full font-bold text-sm">{index + 1}</span>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">Vendidos: {product.sold}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-green-600">{formatCurrency(product.sold * product.price)}</span>
                      </div>
                    ))}
                    {products.filter(p => sales.flatMap(s => s.items).some(item => item.id === p.id)).length === 0 && (
                      <p className="text-gray-500 text-center py-8">No hay productos vendidos aún</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Resumen General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-3">Estado del Inventario</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span className="text-sm text-gray-700">En Stock</span>
                        <span className="font-semibold text-green-700">{products.filter(p => p.status === 'En stock').length}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                        <span className="text-sm text-gray-700">Stock Bajo</span>
                        <span className="font-semibold text-yellow-700">{lowStockCount}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <span className="text-sm text-gray-700">Agotados</span>
                        <span className="font-semibold text-red-700">{outOfStockCount}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-3">Métricas de Ventas</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span className="text-sm text-gray-700">Total Transacciones</span>
                        <span className="font-semibold text-blue-700">{totalSalesCount}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span className="text-sm text-gray-700">Ticket Promedio</span>
                        <span className="font-semibold text-green-700">{formatCurrency(totalSalesCount > 0 ? (totalSales / totalSalesCount) : 0)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                        <span className="text-sm text-gray-700">Productos Vendidos</span>
                        <span className="font-semibold text-purple-700">{sales.flatMap(s => s.items).reduce((sum, item) => sum + item.quantity, 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'configuracion' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Información del Usuario</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input type="text" value={currentUser.name} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                    <input type="text" value={currentUser.username} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                    <input 
                      type="text" 
                      value={currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'supervisor' ? 'Supervisor' : 'Vendedor'} 
                      disabled 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Permisos de tu Rol</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Ver productos</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasPermission('canViewProducts') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hasPermission('canViewProducts') ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Agregar productos</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasPermission('canAddProducts') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hasPermission('canAddProducts') ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Editar productos</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasPermission('canEditProducts') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hasPermission('canEditProducts') ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Eliminar productos</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasPermission('canDeleteProducts') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hasPermission('canDeleteProducts') ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Realizar ventas</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasPermission('canMakeSales') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hasPermission('canMakeSales') ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Ver reportes</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasPermission('canViewReports') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hasPermission('canViewReports') ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Editar configuración</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasPermission('canEditConfig') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {hasPermission('canEditConfig') ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Categorías de Productos</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Electrónica</span>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{products.filter(p => p.category === 'Electrónica').length} productos</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Accesorios</span>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{products.filter(p => p.category === 'Accesorios').length} productos</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Audio</span>
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

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-red-600">Zona de Peligro</h3>
                <p className="text-sm text-gray-600 mb-4">Las siguientes acciones son irreversibles. Por favor, ten cuidado.</p>
                {hasPermission('canEditConfig') ? (
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                    Restablecer Sistema
                  </button>
                ) : (
                  <button 
                    onClick={() => alert('No tienes permiso para modificar la configuración del sistema')}
                    className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                  >
                    Restablecer Sistema (Bloqueado)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Agregar Producto */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Agregar Nuevo Producto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Laptop HP Pavilion" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input type="text" value={newProduct.sku} onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Ej: LPT-006" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <input type="number" value={newProduct.quantity} onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                  <input type="number" value={newProduct.minStock} onChange={(e) => setNewProduct({...newProduct, minStock: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                <input type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option>Electrónica</option>
                  <option>Accesorios</option>
                  <option>Audio</option>
                  <option>Bebidas</option>
                  <option>Lácteos y Fiambres</option>
                  <option>Panadería y Pastelería</option>
                  <option>Snacks y Dulces</option>
                  <option>Abarrotes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <select value={newProduct.supplier} onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Samsung" >
                  <option value="">Seleccionar proveedor…</option>
                  {suppliers.map(supplier => 
                    <option key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </option>
                  )}
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={handleAddProduct} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">Agregar</button>
              <button onClick={() => setShowAddProductModal(false)} className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ventas */}
      {showSalesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nueva Venta</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Productos Disponibles</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {products.filter(p => p.quantity > 0).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">Stock: {product.quantity} | {formatCurrency(product.price)}</p>
                      </div>
                      <button onClick={() => addToCart(product)} className="ml-2 bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Carrito de Compra</h3>
                {cart.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Carrito vacío</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500">{formatCurrency(item.price)} c/u</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="bg-gray-200 p-1 rounded hover:bg-gray-300">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="bg-gray-200 p-1 rounded hover:bg-gray-300">
                              <Plus className="w-4 h-4" />
                            </button>
                            <button onClick={() => removeFromCart(item.id)} className="ml-2 text-red-600 hover:text-red-800">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold">Total:</span>
                        <span className="text-2xl font-bold text-green-600">{formatCurrency(cartTotal)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={completeSale} disabled={cart.length === 0} className={`flex-1 px-4 py-2 rounded-lg transition ${cart.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                Completar Venta
              </button>
              <button onClick={() => setShowSalesModal(false)} className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Proveedor */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Agregar Nuevo Proveedor</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Proveedor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: Apple Inc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contacto</label>
                <input
                  type="email"
                  value={newSupplier.contact}
                  onChange={(e) => setNewSupplier({...newSupplier, contact: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: contacto@proveedor.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: +56 9 1234 5678"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: Santiago, Chile"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddSupplier}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                Agregar
              </button>
              <button
                onClick={() => {
                  setShowAddSupplierModal(false);
                  setNewSupplier({ name: '', contact: '', phone: '', address: '' });
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}