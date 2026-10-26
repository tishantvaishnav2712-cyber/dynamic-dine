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
  Sparkles,
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
  const [isCheckedOut, setIsCheckedOut] = useState(() => {
    return localStorage.getItem(`table_${tableNumber}_completed`) === 'true';
  });
  const [tableStatus, setTableStatus] = useState('');

  // Menu states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart states
  const [cart, setCart] = useState({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Status/Tracker states
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'orders' | 'bill'
  const [placedOrders, setPlacedOrders] = useState([]);
  const [menuError, setMenuError] = useState('');
  const [categoriesError, setCategoriesError] = useState('');

  // Live price flash indicator state: { [productId]: 'up' | 'down' }
  const [priceFlash, setPriceFlash] = useState({});

  // Notifications
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [foodReadyAlert, setFoodReadyAlert] = useState({ show: false, message: '' });



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

  // Table-level WebSocket listener (Active even before session or during cleaning)
  useEffect(() => {
    if (!socket || !verified) return;

    socket.emit('join_table', tableNumber);

    const onTableStatus = ({ tableNumber: tNum, status }) => {
      if (parseInt(tNum) === parseInt(tableNumber)) {
        setTableStatus(status);
        if (status === 'available') {
          // Table was officially released by staff as ready for new guests
          localStorage.removeItem(`table_${tableNumber}_completed`);
          setIsCheckedOut(false);
        }
      }
    };

    socket.on('table_status_updated', onTableStatus);

    return () => {
      socket.off('table_status_updated', onTableStatus);
    };
  }, [socket, verified, tableNumber]);

  // WebSocket listeners for live updates during active session
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
        setFoodReadyAlert({ show: true, message: 'Your order is hot and ready! The waiter is bringing it to your table.' });
        // Auto-close after 8 seconds
        setTimeout(() => setFoodReadyAlert({ show: false, message: '' }), 8000);
      }
    });

    // Settle bill / payment checkout listener
    socket.on('payment_completed', ({ tableNumber: tNum }) => {
      if (parseInt(tNum) === parseInt(tableNumber)) {
        localStorage.setItem(`table_${tableNumber}_completed`, 'true');
        localStorage.removeItem(`table_${tableNumber}_session`);
        setTableStatus('cleaning');
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
  }, [socket, verified, session, tableNumber]);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  const verifyAccess = async (key) => {
    try {
      const { data } = await axios.post(`${API_URL}/tables/${tableNumber}/verify`, { key });
      if (data.success) {
        setVerified(true);
        setTableStatus(data.table.status);

        // If this guest previously completed their session on this table, keep them on the conclusion screen
        if (localStorage.getItem(`table_${tableNumber}_completed`) === 'true' && data.table.status !== 'available') {
          setIsCheckedOut(true);
          return;
        }

        if (data.table.activeSession) {
          if (data.table.activeSession.paymentStatus === 'paid') {
            localStorage.setItem(`table_${tableNumber}_completed`, 'true');
            setIsCheckedOut(true);
            return;
          }
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
    if (tableStatus && tableStatus !== 'available') {
      showToast(
        tableStatus === 'cleaning'
          ? `Table ${tableNumber} is currently being cleaned. Please wait for staff.`
          : `Table ${tableNumber} is currently ${tableStatus}.`,
        'error'
      );
      return;
    }
    const cleanPhone = custPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      showToast('Mobile number must be exactly 10 digits', 'error');
      return;
    }
    try {
      const { data } = await axios.post(`${API_URL}/sessions/start`, {
        tableNumber,
        customerName: custName,
        customerPhone: cleanPhone,
        qrKey,
      });

      if (data.success) {
        // Clear any old completed state
        localStorage.removeItem(`table_${tableNumber}_completed`);
        setIsCheckedOut(false);
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
      if (!token) {
        setHasSession(false);
        return;
      }
      const { data } = await axios.get(`${API_URL}/sessions/active/${tableNumber}?token=${token}`);
      if (data.success && data.active && data.session) {
        setSession(data.session);
        setHasSession(true);
        localStorage.setItem(`table_${tableNumber}_session`, data.session.sessionToken);
        setPlacedOrders(data.session.orders || []);
        fetchCategories();
        fetchMenu();
      } else if (data.success && data.session && data.session.paymentStatus === 'paid') {
        localStorage.setItem(`table_${tableNumber}_completed`, 'true');
        localStorage.removeItem(`table_${tableNumber}_session`);
        setIsCheckedOut(true);
      }
    } catch (err) {
      console.error('Session sync error:', err);
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
    if (cartItems.length === 0 || isPlacingOrder) return;

    setIsPlacingOrder(true);
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
        await fetchActiveSession(qrKey, session?.sessionToken);
        setActiveTab('orders');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to place order', 'error');
    } finally {
      setIsPlacingOrder(false);
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
    (placedOrders || []).forEach((order) => {
      if (!order || order.overallStatus === 'cancelled') return;
      (order.items || []).forEach((item) => {
        if (!item || item.status === 'cancelled') return;
        const key = item.product?._id || item.product || item.name;
        const price = Number(item.priceAtOrder) || 0;
        const qty = Number(item.quantity) || 1;
        if (itemsMap[key]) {
          itemsMap[key].quantity += qty;
        } else {
          itemsMap[key] = {
            name: item.name || 'Item',
            quantity: qty,
            priceAtOrder: price,
          };
        }
      });
    });
    return Object.values(itemsMap);
  };

  const activeInvoiceItems = getActiveInvoiceItems();
  const invoiceSubtotal = activeInvoiceItems.reduce(
    (sum, item) => sum + ((Number(item.priceAtOrder) || 0) * (Number(item.quantity) || 1)),
    0
  );
  const invoiceGst = parseFloat((invoiceSubtotal * 0.05).toFixed(2));
  const invoiceTotal = parseFloat((invoiceSubtotal + invoiceGst).toFixed(2));

  // Render layouts: Verification Gate
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

  // Render layouts: Completed Session Block
  if (isCheckedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-900 text-white px-4">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-emerald-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none"></div>
          <div className="inline-flex p-4 bg-emerald-500/15 rounded-2xl text-emerald-400 mb-2">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">Session Concluded</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Your dining session has concluded and your bill has been settled successfully. Thank you for dining with Dynamic Dine!
          </p>
          <div className="bg-obsidian-800/60 p-4 rounded-xl border border-slate-700/50 space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Session Status</p>
            <p className="text-xs text-emerald-400 font-bold font-mono">Table {tableNumber} • Bill Paid & Closed</p>
          </div>
          <div className="bg-obsidian-800/30 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            This table session has ended. To seat new guests or start a new order, please speak with the restaurant staff.
          </div>
        </div>
      </div>
    );
  }

  // Render layouts: Table Cleaning in Progress
  if (tableStatus === 'cleaning') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-900 text-white px-4">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-amber-500/30 text-center space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none"></div>
          <div className="inline-flex p-4 bg-amber-500/15 rounded-2xl text-amber-400 mb-2">
            <Sparkles className="w-12 h-12 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white">Table Being Prepared</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Table {tableNumber} is currently being cleaned and sanitized for the next dining party.
            Please wait for our restaurant staff to seat you.
          </p>
          <div className="bg-obsidian-800/60 p-3 rounded-xl border border-slate-700/50 text-[11px] text-slate-400">
            Status: <span className="text-amber-400 font-bold uppercase">Cleaning in Progress</span>
          </div>
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
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number (10 Digits)</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full bg-obsidian-800 border border-slate-700/50 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-neoncyan text-sm"
                placeholder="Enter 10-digit mobile number"
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

      {/* Food Ready Ringing Bell Overlay */}
      {foodReadyAlert.show && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6">
          <div className="bg-obsidian-800 border-2 border-neoncyan/40 p-8 rounded-3xl text-center max-w-sm w-full space-y-6 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-neoncyan/5 to-transparent pointer-events-none"></div>
            <div className="inline-flex p-5 bg-neoncyan/15 rounded-full text-neoncyan mb-2 relative">
              <span className="absolute inset-0 rounded-full bg-neoncyan/10 animate-ping"></span>
              <Bell className="w-14 h-14 ringing-bell" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white uppercase tracking-wider">🛎️ Order is Ready!</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {foodReadyAlert.message}
            </p>
            <button
              onClick={() => setFoodReadyAlert({ show: false, message: '' })}
              className="w-full bg-neoncyan text-obsidian-900 font-extrabold py-3.5 rounded-xl hover:bg-neoncyan/95 transition-all text-xs cursor-pointer shadow-lg shadow-neoncyan/15 uppercase tracking-widest"
            >
              Great!
            </button>
          </div>
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
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
                            }}
                            className="w-14 h-14 object-cover rounded-xl border border-slate-700 mr-3 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
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
              placedOrders.filter(Boolean).map((order, oIdx) => (
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
                      {order.overallStatus || 'Pending'}
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs">
                    {(order.items || []).map((item, idx) => {
                      const price = Number(item?.priceAtOrder) || 0;
                      const qty = Number(item?.quantity) || 1;
                      return (
                        <li key={item?._id || idx} className="flex justify-between text-slate-300">
                          <span>{item?.name || 'Dish'} <span className="text-slate-500 font-bold">x{qty}</span></span>
                          <span className="font-semibold text-white">₹{(price * qty).toFixed(2)}</span>
                        </li>
                      );
                    })}
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
                activeInvoiceItems.map((item, idx) => {
                  const price = Number(item?.priceAtOrder) || 0;
                  const qty = Number(item?.quantity) || 1;
                  return (
                    <div key={idx} className="flex justify-between text-xs text-slate-300">
                      <span>{item?.name || 'Dish'} (x{qty})</span>
                      <span>₹{(price * qty).toFixed(2)}</span>
                    </div>
                  );
                })
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
                  disabled={isPlacingOrder}
                  className={`w-full bg-neoncyan text-obsidian-900 font-bold py-3 rounded-xl transition-all text-xs cursor-pointer shadow-lg shadow-neoncyan/15 flex items-center justify-center gap-2 ${
                    isPlacingOrder ? 'opacity-70 cursor-not-allowed' : 'hover:bg-neoncyan/95'
                  }`}
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-obsidian-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending Order to Kitchen...</span>
                    </>
                  ) : (
                    <span>Send Order to Chef</span>
                  )}
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
