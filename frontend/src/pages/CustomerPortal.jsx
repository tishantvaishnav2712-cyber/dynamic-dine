import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import {
  ShoppingBag,
  Bell,
  Utensils,
  ClipboardList,
  ChevronRight,
  Plus,
  Minus,
  Search,
  CheckCircle,
  HelpCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react';
import { API_URL } from '../config';

const CustomerPortal = () => {
  const { tableNumber } = useParams();
  const [searchParams] = useSearchParams();
  const socket = useSocket();

  // Route/Verification states
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState('');
  const [qrKey, setQrKey] = useState('');

  // Session states
  const [hasSession, setHasSession] = useState(false);
  const [session, setSession] = useState(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  // Menu states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart states
  const [cart, setCart] = useState({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  // Status/Tracker states
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'orders' | 'bill'
  const [placedOrders, setPlacedOrders] = useState([]);
  const [menuError, setMenuError] = useState('');
  const [categoriesError, setCategoriesError] = useState('');

  // Live price flash indicator state: { [productId]: 'up' | 'down' }
  const [priceFlash, setPriceFlash] = useState({});

  // Notifications
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Get QR key on mount
  useEffect(() => {
    const key = searchParams.get('key') || localStorage.getItem(`table_${tableNumber}_key`);
    if (key) {
      setQrKey(key);
      localStorage.setItem(`table_${tableNumber}_key`, key);
      verifyAccess(key);
    } else {
      setVerifying(false);
      setVerificationError('No secure table QR key detected. Please scan the QR code printed on the table.');
    }
  }, [tableNumber, searchParams]);

  // WebSocket listeners for live updates
  useEffect(() => {
    if (!socket || !verified || !session) return;

    // Join the table socket room
    socket.emit('join_table', tableNumber);

    // Live price update listener
    socket.on('price_updated', ({ productId, currentPrice, previousPrice, percentageChanged }) => {
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, currentPrice } : p))
      );

      const direction = percentageChanged > 0 ? 'up' : 'down';
      setPriceFlash((prev) => ({ ...prev, [productId]: direction }));

      // Clear the flash class after 1.5 seconds
      setTimeout(() => {
        setPriceFlash((prev) => {
          const updated = { ...prev };
          delete updated[productId];
          return updated;
        });
      }, 1500);
    });

    // Prices bulk reset listener
    socket.on('prices_reset', () => {
      fetchMenu();
    });

    // Kitchen/Waiter order status updates
    socket.on('order_status_updated', ({ tableNumber: tNum, overallStatus }) => {
      if (parseInt(tNum) === parseInt(tableNumber)) {
        showToast(`Order status updated to: ${overallStatus.toUpperCase()}`, 'info');
        fetchActiveSession(qrKey, session?.sessionToken);
      }
    });

    // Order served
    socket.on('notification', ({ type, message, tableNumber: tNum }) => {
      if (type === 'order_ready' && parseInt(tNum) === parseInt(tableNumber)) {
        showToast('Your food is ready and being served!', 'success');
      }
    });

    // Settle bill / payment checkout listener
    socket.on('payment_completed', ({ tableNumber: tNum }) => {
      if (parseInt(tNum) === parseInt(tableNumber)) {
        localStorage.removeItem(`table_${tableNumber}_session`);
        localStorage.removeItem(`table_${tableNumber}_key`);
        setIsCheckedOut(true);
      }
    });

    return () => {
      socket.off('price_updated');
      socket.off('prices_reset');
      socket.off('order_status_updated');
      socket.off('notification');
      socket.off('payment_completed');
    };
  }, [socket, verified, session]);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  const verifyAccess = async (key) => {
    try {
      const { data } = await axios.post(`${API_URL}/tables/${tableNumber}/verify`, { key });
      if (data.success) {
        setVerified(true);
        if (data.table.activeSession) {
          setSession(data.table.activeSession);
          setHasSession(true);
          localStorage.setItem(`table_${tableNumber}_session`, data.table.activeSession.sessionToken);
          fetchActiveSession(key, data.table.activeSession.sessionToken);
        } else {
          setHasSession(false);
        }
      }
    } catch (err) {
      setVerificationError(err.response?.data?.message || 'Access Verification Failed');
    } finally {
      setVerifying(false);
    }
  };

  const startDining = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_URL}/sessions/start`, {
        tableNumber,
        customerName: custName,
        customerPhone: custPhone,
        qrKey,
      });

      if (data.success) {
        setSession(data.session);
        setHasSession(true);
        localStorage.setItem(`table_${tableNumber}_session`, data.session.sessionToken);
        fetchActiveSession(qrKey, data.session.sessionToken);
        showToast('Dining session started. Enjoy your meal!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start session', 'error');
    }
  };

  const fetchActiveSession = async (key, explicitToken = null) => {
    try {
      const token = explicitToken || session?.sessionToken || localStorage.getItem(`table_${tableNumber}_session`);
      const { data } = await axios.get(`${API_URL}/sessions/active/${tableNumber}?token=${token}`);
      if (data.success && data.active) {
        setSession(data.session);
        localStorage.setItem(`table_${tableNumber}_session`, data.session.sessionToken);
        setPlacedOrders(data.session.orders || []);
        fetchCategories();
        fetchMenu();
      } else {
        if (hasSession) {
          localStorage.removeItem(`table_${tableNumber}_session`);
          localStorage.removeItem(`table_${tableNumber}_key`);
          setIsCheckedOut(true);
        } else {
          setHasSession(false);
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to sync dining session', 'error');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/categories`);
      if (data.success) {
        setCategories(data.categories);
        setCategoriesError('');
      }
    } catch (err) {
      console.error(err);
      setCategoriesError(err.response?.data?.message || err.message || 'Failed to fetch categories');
    }
  };

  const fetchMenu = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/products`);
      if (data.success) {
        setProducts(data.products);
        setMenuError('');
      }
    } catch (err) {
      console.error(err);
      setMenuError(err.response?.data?.message || err.message || 'Failed to fetch menu items');
    }
  };

  // Cart operations
  const addToCart = (product) => {
    if (product.stock === 0) {
      showToast('Product out of stock', 'error');
      return;
    }
    setCart((prev) => {
      const currentQty = prev[product._id]?.quantity || 0;
      if (currentQty >= product.stock) {
        showToast(`Cannot add more. Stock limit: ${product.stock}`, 'error');
        return prev;
      }
      return {
        ...prev,
        [product._id]: {
          product,
          quantity: currentQty + 1,
        },
      };
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (!updated[productId]) return prev;
      if (updated[productId].quantity === 1) {
        delete updated[productId];
      } else {
        updated[productId].quantity -= 1;
      }
      return updated;
    });
  };

  const getCartTotal = () => {
    return Object.values(cart).reduce((sum, item) => sum + item.product.currentPrice * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  };

  const placeOrder = async () => {
    const cartItems = Object.values(cart);
    if (cartItems.length === 0) return;

    try {
      const { data } = await axios.post(`${API_URL}/orders`, {
        sessionId: session._id,
        sessionToken: session.sessionToken,
        specialInstructions,
        items: cartItems.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
        })),
      });

      if (data.success) {
        showToast('Order sent to the kitchen!', 'success');
        setCart({});
        setSpecialInstructions('');
        setCartOpen(false);
        fetchActiveSession(qrKey);
        setActiveTab('orders');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to place order', 'error');
    }
  };

  const callWaiter = () => {
    if (socket) {
      socket.emit('call_waiter_client', { tableNumber });
      showToast('Waiter has been summoned.', 'success');
    }
  };

  const requestSettle = async () => {
    try {
      const { data } = await axios.post(`${API_URL}/sessions/${session._id}/request-bill`, {
        token: session.sessionToken,
      });
      if (data.success) {
        showToast('Checkout requested. Waiter will present your bill.', 'success');
      }
    } catch (err) {
      showToast('Failed to request bill', 'error');
    }
  };

  const getActiveInvoiceItems = () => {
    const itemsMap = {};
    placedOrders.forEach((order) => {
      if (order.overallStatus === 'cancelled') return;
      order.items.forEach((item) => {
        if (item.status === 'cancelled') return;
        const key = item.product?._id || item.product;
        if (itemsMap[key]) {
          itemsMap[key].quantity += item.quantity;
        } else {
          itemsMap[key] = {
            name: item.name,
            quantity: item.quantity,
            priceAtOrder: item.priceAtOrder,
          };
        }
      });
    });
    return Object.values(itemsMap);
  };

  const activeInvoiceItems = getActiveInvoiceItems();
  const invoiceSubtotal = activeInvoiceItems.reduce((sum, item) => sum + (item.priceAtOrder * item.quantity), 0);
  const invoiceGst = parseFloat((invoiceSubtotal * 0.05).toFixed(2));
  const invoiceTotal = parseFloat((invoiceSubtotal + invoiceGst).toFixed(2));

  const handleCheckoutDone = () => {
    setIsCheckedOut(false);
    setHasSession(false);
    setVerified(false);
    setSession(null);
    
    // Attempt to close the browser tab
    window.close();
    
    // Fallback: redirect to a blank page to exit the website
    setTimeout(() => {
      window.location.href = 'about:blank';
    }, 100);
  };

  // Render layouts
  if (isCheckedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-900 text-white px-4">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-neoncyan/20 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neoncyan/5 to-transparent pointer-events-none"></div>
          <div className="inline-flex p-4 bg-neoncyan/10 rounded-2xl text-neoncyan animate-bounce mb-2">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white animate-pulse">Thank You!</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your table billing check has been settled successfully. We hope you had an amazing dynamic dining experience!
          </p>
          <div className="bg-obsidian-800/50 p-4 rounded-xl border border-slate-700/50">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Receipt reference</p>
            <p className="text-[10px] text-slate-400 font-mono select-all">Table {tableNumber} Session Closed</p>
          </div>
          <button
            onClick={handleCheckoutDone}
            className="w-full bg-neoncyan text-obsidian-900 font-black py-3 rounded-xl hover:bg-neoncyan/95 transition-all text-xs cursor-pointer shadow-lg shadow-neoncyan/15 uppercase tracking-wider"
          >
            Exit Portal
          </button>
        </div>
      </div>
    );
  }

  // Render layouts
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-900 text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-neoncyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Verifying secure QR access...</p>
        </div>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-900 text-white px-4">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-red-500/20 text-center">
          <div className="inline-flex p-3 bg-red-500/10 rounded-xl text-red-500 mb-4">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">{verificationError}</p>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Dynamic Dine Secure Terminal</div>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-900 text-white px-4">
        <form onSubmit={startDining} className="max-w-md w-full glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center">
            <Utensils className="w-10 h-10 text-neoncyan mx-auto mb-2" />
            <h2 className="text-2xl font-bold">Welcome to Table {tableNumber}</h2>
            <p className="text-sm text-slate-400">Register table session to unlock the dynamic pricing menu</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Your Name</label>
              <input
                type="text"
                required
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="w-full bg-obsidian-800 border border-slate-700/50 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-neoncyan text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                type="text"
                required
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className="w-full bg-obsidian-800 border border-slate-700/50 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-neoncyan text-sm"
                placeholder="Enter mobile number"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-neoncyan text-obsidian-900 font-bold py-3 rounded-xl hover:bg-neoncyan/95 transition-all text-sm cursor-pointer shadow-lg shadow-neoncyan/15"
          >
            Start Ordering
          </button>
        </form>
      </div>
    );
  }

  // Active Dining layout
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? product.category?._id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-obsidian-900 text-slate-100 flex flex-col max-w-md mx-auto relative border-x border-slate-800/80 shadow-2xl">
      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-80 bg-obsidian-800 border border-neoncyan/30 p-3 rounded-xl text-center shadow-lg text-xs font-semibold animate-pulse text-white flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-neoncyan" /> {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="px-4 py-4 border-b border-slate-800 bg-obsidian-800/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-neoncyan uppercase tracking-widest font-extrabold">Dynamic Dine</div>
          <div className="text-lg font-black text-white">Table {tableNumber}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={callWaiter}
            className="p-2 bg-obsidian-700 hover:bg-obsidian-600 rounded-xl border border-slate-700/50 text-slate-300 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            title="Call Waiter"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCartOpen(true)}
            className="p-2 bg-neoncyan text-obsidian-900 rounded-xl font-bold hover:bg-neoncyan/90 relative active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          >
            <ShoppingBag className="w-5 h-5" />
            {getCartItemCount() > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center border-2 border-obsidian-900 font-extrabold">
                {getCartItemCount()}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="flex border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 bg-obsidian-800/20">
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'menu' ? 'border-neoncyan text-neoncyan bg-neoncyan/5' : 'border-transparent text-slate-400'
          }`}
        >
          Menu
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer relative ${
            activeTab === 'orders' ? 'border-neoncyan text-neoncyan bg-neoncyan/5' : 'border-transparent text-slate-400'
          }`}
        >
          My Orders
          {placedOrders.length > 0 && (
            <span className="absolute right-2 top-3 w-1.5 h-1.5 bg-neoncyan rounded-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('bill')}
          className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'bill' ? 'border-neoncyan text-neoncyan bg-neoncyan/5' : 'border-transparent text-slate-400'
          }`}
        >
          Invoice
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-20 overflow-y-auto">
        {activeTab === 'menu' && (
          <div className="space-y-4">
            {(menuError || categoriesError) && (
              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-red-400 text-xs font-semibold space-y-1">
                {categoriesError && <div>⚠️ Categories: {categoriesError}</div>}
                {menuError && <div>⚠️ Menu: {menuError}</div>}
              </div>
            )}
            {/* Search & Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-obsidian-800 border border-slate-700/50 rounded-xl py-2 pl-9 pr-4 text-white focus:outline-none focus:border-neoncyan text-sm"
                placeholder="Search dishes..."
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === '' ? 'bg-neoncyan text-obsidian-900' : 'bg-obsidian-800 text-slate-400 border border-slate-700/50'
                }`}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat._id ? 'bg-neoncyan text-obsidian-900' : 'bg-obsidian-800 text-slate-400 border border-slate-700/50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Product Cards */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No items available in this category.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product) => {
                  const flashState = priceFlash[product._id];
                  const flashClass = flashState === 'up' ? 'price-up' : flashState === 'down' ? 'price-down' : '';
                  return (
                    <div
                      key={product._id}
                      className={`bg-obsidian-800/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between shadow-md transition-all hover-grow cursor-pointer ${flashClass}`}
                    >
                      <div className="flex items-center flex-1 pr-3 overflow-hidden">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-14 h-14 object-cover rounded-xl border border-slate-700 mr-3 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm truncate">{product.name}</span>
                            {flashState === 'up' && <TrendingUp className="w-3.5 h-3.5 text-neongreen shrink-0" />}
                            {flashState === 'down' && <TrendingDown className="w-3.5 h-3.5 text-neonred shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">{product.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm font-black text-neoncyan">₹{product.currentPrice.toFixed(2)}</span>
                            {product.currentPrice !== product.basePrice && (
                              <span className="text-[10px] line-through text-slate-500">₹{product.basePrice.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-center gap-2">
                        {cart[product._id] ? (
                          <div className="flex items-center bg-obsidian-700 border border-slate-600 rounded-lg p-0.5 text-sm font-bold">
                            <button
                              onClick={() => removeFromCart(product._id)}
                              className="p-1 hover:text-neoncyan text-slate-300"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 text-white text-xs">{cart[product._id].quantity}</span>
                            <button
                              onClick={() => addToCart(product)}
                              className="p-1 hover:text-neoncyan text-slate-300"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              product.stock === 0
                                ? 'bg-slate-800 text-slate-500 border-slate-700'
                                : 'bg-neoncyan/10 border-neoncyan/30 text-neoncyan hover:bg-neoncyan hover:text-obsidian-900'
                            }`}
                          >
                            {product.stock === 0 ? 'Sold Out' : 'Add'}
                          </button>
                        )}
                        <span className="text-[9px] text-slate-500">Stock: {product.stock}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
              <ClipboardList className="w-4 h-4 text-neoncyan" /> Order Summary
            </h3>

            {placedOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No orders placed yet. Add items to your cart and place an order!
              </div>
            ) : (
              placedOrders.map((order, oIdx) => (
                <div key={order._id || oIdx} className="bg-obsidian-800/80 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                    <span className="text-xs font-black text-slate-300">Order #{oIdx + 1}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      order.overallStatus === 'completed' || order.overallStatus === 'served'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : order.overallStatus === 'ready'
                        ? 'bg-neoncyan/10 text-neoncyan border border-neoncyan/30'
                        : order.overallStatus === 'cancelled'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {order.overallStatus}
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-slate-300">
                        <span>{item.name} <span className="text-slate-500 font-bold">x{item.quantity}</span></span>
                        <span className="font-semibold text-white">₹{(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Status Timeline */}
                  <div className="border-t border-slate-700/50 pt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span className={order.overallStatus === 'pending' ? 'text-neoncyan' : ''}>Queued</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className={order.overallStatus === 'preparing' ? 'text-neoncyan' : ''}>Cooking</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className={order.overallStatus === 'ready' ? 'text-neoncyan' : ''}>Ready</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className={order.overallStatus === 'served' || order.overallStatus === 'completed' ? 'text-emerald-400' : ''}>Served</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'bill' && (
          <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-center font-black text-white text-lg border-b border-slate-800 pb-3">Bill Invoice Details</h3>
            
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Diner:</span>
                <span className="font-semibold text-white">{session.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Table:</span>
                <span className="font-semibold text-white">Table {tableNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Session Started:</span>
                <span className="font-semibold text-white">{new Date(session.startTime).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Consolidated Orders list */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ordered Items</div>
              {activeInvoiceItems.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">No active items ordered yet.</div>
              ) : (
                activeInvoiceItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-300">
                    <span>{item.name} (x{item.quantity})</span>
                    <span>₹{(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-slate-800 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal:</span>
                <span>₹{invoiceSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>GST (5.0%):</span>
                <span>₹{invoiceGst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white font-black text-base border-t border-slate-800 pt-2">
                <span>Total Bill:</span>
                <span className="text-neoncyan">
                  ₹{invoiceTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={requestSettle}
              disabled={placedOrders.length === 0}
              className="w-full bg-neoncyan text-obsidian-900 font-bold py-3.5 rounded-xl hover:bg-neoncyan/95 transition-all text-sm mt-4 shadow-lg shadow-neoncyan/15 cursor-pointer flex items-center justify-center gap-2"
            >
              Request Bill Settlement
            </button>
          </div>
        )}
      </main>

      {/* Cart Drawer Modal */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-sm bg-obsidian-800 border-l border-slate-800 p-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-neoncyan" /> Cart List
              </h3>
              <button onClick={() => setCartOpen(false)} className="p-1 hover:text-neoncyan text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {Object.values(cart).length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Your cart is empty. Tap 'Add' on the menu items!
                </div>
              ) : (
                Object.values(cart).map(({ product, quantity }) => (
                  <div key={product._id} className="flex justify-between items-center bg-obsidian-900 p-3 rounded-xl border border-slate-800">
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-white text-xs">{product.name}</div>
                      <div className="text-xs font-black text-neoncyan mt-1">₹{product.currentPrice.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center bg-obsidian-800 border border-slate-700 rounded-lg p-0.5 font-bold">
                      <button onClick={() => removeFromCart(product._id)} className="p-1 text-slate-300">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 text-white text-xs">{quantity}</span>
                      <button onClick={() => addToCart(product)} className="p-1 text-slate-300">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {Object.values(cart).length > 0 && (
              <div className="border-t border-slate-700/50 pt-4 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Special Cooking requests</label>
                  <textarea
                    rows="2"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full bg-obsidian-900 border border-slate-700/50 rounded-lg p-2 text-xs focus:outline-none focus:border-neoncyan text-white resize-none"
                    placeholder="E.g., No onions, extra spicy..."
                  ></textarea>
                </div>

                <div className="flex justify-between items-center text-sm font-black border-t border-slate-800 pt-3">
                  <span className="text-slate-400">Total Sum:</span>
                  <span className="text-neoncyan text-lg">₹{getCartTotal().toFixed(2)}</span>
                </div>

                <button
                  onClick={placeOrder}
                  className="w-full bg-neoncyan text-obsidian-900 font-bold py-3 rounded-xl hover:bg-neoncyan/95 transition-all text-xs cursor-pointer shadow-lg shadow-neoncyan/15 flex items-center justify-center gap-1.5"
                >
                  Send Order to Chef
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPortal;
