import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from 'recharts';
import {
  TrendingUp, Settings, Plus, Trash2, QrCode, RefreshCw,
  FolderPlus, DollarSign, Package, Calendar, Users, Percent, X
} from 'lucide-react';

const AdminDashboard = () => {
  const socket = useSocket();
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);
  
  // Charting & Logs
  const [priceHistory, setPriceHistory] = useState([]);
  const [selectedHistoryProductId, setSelectedHistoryProductId] = useState('');
  
  // Selections & Modals
  const [qrModal, setQrModal] = useState({ show: false, tableNumber: null, qrUrl: '', qrImage: '' });
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'pricing' | 'menu' | 'tables'

  // Form states - Category
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Form states - Product
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdBase, setNewProdBase] = useState('');
  const [newProdMin, setNewProdMin] = useState('');
  const [newProdMax, setNewProdMax] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdImage, setNewProdImage] = useState('');

  // Form states - Editing Product (modal)
  const [editProductModal, setEditProductModal] = useState({ show: false, product: null });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProdImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Running alerts
  const [tickerItems, setTickerItems] = useState([]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    fetchAnalytics();
    fetchCategories();
    fetchProducts();
    fetchPricingConfig();

    if (!socket) return;

    // Real-time price logs for scrolling header ticker
    socket.on('price_updated', ({ productId, currentPrice, previousPrice, percentageChanged }) => {
      fetchAnalytics();
      fetchProducts();
      if (productId === selectedHistoryProductId) {
        fetchPriceHistory(productId);
      }

      // Add to ticker alerts
      setProducts((prev) => {
        const prod = prev.find((p) => p._id === productId);
        if (prod) {
          const tickText = `${prod.name}: ₹${currentPrice.toFixed(2)} (${percentageChanged >= 0 ? '+' : ''}${percentageChanged.toFixed(2)}%)`;
          setTickerItems((ticks) => [tickText, ...ticks.slice(0, 4)]);
        }
        return prev;
      });
    });

    socket.on('table_status_updated', () => fetchAnalytics());
    socket.on('payment_completed', () => fetchAnalytics());
    socket.on('order_placed', () => fetchAnalytics());

    return () => {
      socket.off('price_updated');
      socket.off('table_status_updated');
      socket.off('payment_completed');
      socket.off('order_placed');
    };
  }, [socket, selectedHistoryProductId, token]);

  const fetchAnalytics = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/analytics/dashboard`);
      if (data.success) {
        setStats(data.summary);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/categories`);
      if (data.success) setCategories(data.categories);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/products`);
      if (data.success) {
        setProducts(data.products);
        if (data.products.length > 0 && !selectedHistoryProductId) {
          setSelectedHistoryProductId(data.products[0]._id);
          fetchPriceHistory(data.products[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPricingConfig = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/pricing/config`);
      if (data.success) setPricingConfig(data.config);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPriceHistory = async (prodId) => {
    try {
      const { data } = await axios.get(`${API_URL}/pricing/history?productId=${prodId}`);
      if (data.success) {
        // Format for Recharts
        const formatted = data.history.map((h) => ({
          time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: h.newPrice,
        })).reverse(); // Oldest first
        setPriceHistory(formatted);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfigChange = (field, val) => {
    setPricingConfig((prev) => ({ ...prev, [field]: val }));
  };

  const savePricingConfig = async () => {
    try {
      const { data } = await axios.put(`${API_URL}/pricing/config`, pricingConfig);
      if (data.success) {
        alert('Pricing engine configurations saved!');
        fetchPricingConfig();
      }
    } catch (err) {
      alert('Failed to update config settings');
    }
  };

  const resetAllProductPrices = async () => {
    if (!window.confirm('Reset all prices back to base prices?')) return;
    try {
      const { data } = await axios.post(`${API_URL}/pricing/reset`);
      if (data.success) {
        alert(data.message);
        fetchProducts();
        fetchAnalytics();
        if (selectedHistoryProductId) fetchPriceHistory(selectedHistoryProductId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateQRCodeCard = async (tNum) => {
    try {
      const { data } = await axios.post(`${API_URL}/tables/${tNum}/qr`);
      if (data.success) {
        setQrModal({
          show: true,
          tableNumber: tNum,
          qrUrl: data.qrUrl,
          qrImage: data.qrImage,
        });
      }
    } catch (err) {
      alert('Failed to generate secure table QR code');
    }
  };

  const submitCategory = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_URL}/categories`, { name: newCatName, description: newCatDesc });
      if (data.success) {
        setNewCatName('');
        setNewCatDesc('');
        fetchCategories();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create category');
    }
  };

  const deleteCategory = async (catId) => {
    if (!window.confirm('Delete category?')) return;
    try {
      const { data } = await axios.delete(`${API_URL}/categories/${catId}`);
      if (data.success) {
        fetchCategories();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove category');
    }
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_URL}/products`, {
        name: newProdName,
        category: newProdCat,
        description: newProdDesc,
        basePrice: parseFloat(newProdBase),
        minPrice: newProdMin ? parseFloat(newProdMin) : parseFloat(newProdBase) * 0.8,
        maxPrice: newProdMax ? parseFloat(newProdMax) : parseFloat(newProdBase) * 2.5,
        stock: parseInt(newProdStock, 10),
        image: newProdImage,
      });

      if (data.success) {
        setNewProdName('');
        setNewProdDesc('');
        setNewProdBase('');
        setNewProdMin('');
        setNewProdMax('');
        setNewProdStock('');
        setNewProdImage('');
        const fileInput = document.getElementById('new-product-image');
        if (fileInput) fileInput.value = '';
        fetchProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create product');
    }
  };

  const resetSingleProduct = async (prodId) => {
    try {
      const { data } = await axios.post(`${API_URL}/products/${prodId}/reset`);
      if (data.success) {
        fetchProducts();
      }
    } catch (err) {
      alert('Failed to reset product price');
    }
  };

  const deleteProduct = async (prodId) => {
    if (!window.confirm('Remove product from menu?')) return;
    try {
      await axios.delete(`${API_URL}/products/${prodId}`);
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const updateProductStock = async (prod, inc) => {
    try {
      await axios.put(`${API_URL}/products/${prod._id}`, {
        stock: prod.stock + inc >= 0 ? prod.stock + inc : 0,
      });
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Live Market Ticker */}
      <div className="bg-obsidian-800 border border-slate-800 p-2.5 rounded-xl flex items-center overflow-hidden h-10 select-none">
        <span className="bg-neoncyan/10 border border-neoncyan/30 text-neoncyan text-[10px] uppercase font-black px-2 py-0.5 rounded shrink-0 mr-3 animate-pulse">
          Market Ticker
        </span>
        <div className="flex gap-8 text-[11px] font-bold text-slate-300 animate-marquee whitespace-nowrap">
          {tickerItems.length === 0 ? (
            <span className="text-slate-500">Pricing feeds quiet. Awaiting item transactions...</span>
          ) : (
            tickerItems.map((item, idx) => (
              <span key={idx} className="inline-flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-neongreen" /> {item}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-px text-sm font-bold uppercase tracking-wider text-slate-400">
        {['analytics', 'pricing', 'menu', 'tables'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-6 border-b-2 transition-all cursor-pointer ${
              activeTab === tab ? 'border-neoncyan text-neoncyan font-black' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Analytics Portal */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Revenue (Today)</span>
                <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">₹{stats.todayRevenue.toFixed(2)}</div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-neoncyan/10 rounded-xl text-neoncyan">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Customer Count</span>
                <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats.customerCountToday}</div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Occupancy Rate</span>
                <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats.tableOccupancyRate}%</div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Pricing Yield</span>
                <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">₹{stats.dynamicPricingImpact.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Pricing Chart Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Product Price Trajectory</h3>
                <select
                  value={selectedHistoryProductId}
                  onChange={(e) => {
                    setSelectedHistoryProductId(e.target.value);
                    fetchPriceHistory(e.target.value);
                  }}
                  className="bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-lg py-1 px-3 text-xs focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id} className="text-slate-800 dark:text-white">{p.name}</option>
                  ))}
                </select>
              </div>

              {priceHistory.length === 0 ? (
                <div className="text-center py-20 text-xs text-slate-500">
                  No pricing records for this product yet.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                      <Line type="monotone" dataKey="price" stroke="#00E5FF" strokeWidth={3} dot={{ fill: '#00E5FF', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Warnings and inventory */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1">
                <Package className="w-5 h-5 text-neoncyan" /> Inventory Alerts
              </h3>
              {stats.lowStockCount === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">All stocks healthy.</div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {stats.lowStockItems?.map((item) => (
                    <div key={item._id} className="flex justify-between items-center bg-obsidian-800/20 border border-slate-800/80 p-2.5 rounded-xl text-xs">
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        {item.stock} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Pricing config settings */}
      {activeTab === 'pricing' && pricingConfig && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700/50 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Pricing Engine Parameters</h3>
              <p className="text-xs text-slate-500">Tune the stock market pricing sensitivity</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetAllProductPrices}
                className="bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/30 text-rose-400 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Reset All Prices
              </button>
              <button
                onClick={savePricingConfig}
                className="bg-neoncyan text-obsidian-900 font-bold px-4 py-2 rounded-xl text-xs hover:bg-neoncyan/95 transition-all cursor-pointer"
              >
                Save Parameter Config
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Dynamic Pricing State</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfigChange('globalEnabled', true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    pricingConfig.globalEnabled ? 'bg-neoncyan text-obsidian-900 border-neoncyan' : 'bg-obsidian-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Enabled
                </button>
                <button
                  onClick={() => handleConfigChange('globalEnabled', false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    !pricingConfig.globalEnabled ? 'bg-rose-500 text-white border-rose-500' : 'bg-obsidian-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Disabled
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Demand Window (Minutes)</label>
              <input
                type="number"
                value={pricingConfig.demandWindowMinutes}
                onChange={(e) => handleConfigChange('demandWindowMinutes', e.target.value)}
                className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 px-3 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cron Run Interval (Minutes)</label>
              <input
                type="number"
                value={pricingConfig.cronIntervalMinutes}
                onChange={(e) => handleConfigChange('cronIntervalMinutes', e.target.value)}
                className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 px-3 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Increase Threshold (Orders)</label>
              <input
                type="number"
                value={pricingConfig.demandThresholdIncrease}
                onChange={(e) => handleConfigChange('demandThresholdIncrease', e.target.value)}
                className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 px-3 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Decay Threshold (Orders)</label>
              <input
                type="number"
                value={pricingConfig.demandThresholdDecrease}
                onChange={(e) => handleConfigChange('demandThresholdDecrease', e.target.value)}
                className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 px-3 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Price Increase rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={pricingConfig.priceIncreasePercent}
                onChange={(e) => handleConfigChange('priceIncreasePercent', e.target.value)}
                className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 px-3 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Price Decay rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={pricingConfig.priceDecreasePercent}
                onChange={(e) => handleConfigChange('priceDecreasePercent', e.target.value)}
                className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 px-3 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Max Price update cap (%)</label>
              <input
                type="number"
                value={pricingConfig.maxPriceChangePerUpdatePercent}
                onChange={(e) => handleConfigChange('maxPriceChangePerUpdatePercent', e.target.value)}
                className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 px-3 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Menu Manager (Zero Products Seed Start) */}
      {activeTab === 'menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category CRUD */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-fit space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <FolderPlus className="w-5 h-5 text-neoncyan" /> Categories Manager
            </h3>

            <form onSubmit={submitCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 px-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-neoncyan"
                  placeholder="E.g., Starters"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-neoncyan text-obsidian-900 font-bold py-2 rounded-xl text-xs hover:bg-neoncyan/95 transition-all cursor-pointer"
              >
                Create Category
              </button>
            </form>

            <div className="space-y-2 max-h-56 overflow-y-auto pt-3 border-t border-slate-700/50">
              {categories.map((cat) => (
                <div key={cat._id} className="flex justify-between items-center bg-obsidian-800/20 border border-slate-800 p-2.5 rounded-xl text-xs">
                  <span className="font-semibold">{cat.name}</span>
                  <button onClick={() => deleteCategory(cat._id)} className="text-slate-500 hover:text-rose-500 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Product CRUD */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-neoncyan" /> Add New Menu Item
            </h3>

            <form onSubmit={submitProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-white focus:outline-none"
                  placeholder="E.g., Signature Burger"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                <select
                  required
                  value={newProdCat}
                  onChange={(e) => setNewProdCat(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2.5 px-3 text-xs text-slate-400 focus:outline-none"
                >
                  <option value="">Select Category...</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Base Price (Starting Price)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newProdBase}
                  onChange={(e) => setNewProdBase(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-white focus:outline-none"
                  placeholder="E.g., 199.99"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Starting Stock</label>
                <input
                  type="number"
                  required
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-white focus:outline-none"
                  placeholder="E.g., 50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Min Price (Stop Dropping Limit)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newProdMin}
                  onChange={(e) => setNewProdMin(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-white focus:outline-none"
                  placeholder="E.g., 150.00"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Max Price (Stop Rising Limit)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newProdMax}
                  onChange={(e) => setNewProdMax(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-white focus:outline-none"
                  placeholder="E.g., 350.00"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <textarea
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  rows="2"
                  className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none resize-none"
                  placeholder="Describe the dish details..."
                ></textarea>
              </div>
              <div className="md:col-span-2 flex flex-col md:flex-row gap-4 items-center bg-obsidian-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Dish Dish Picture</label>
                  <input
                    id="new-product-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neoncyan/10 file:text-neoncyan hover:file:bg-neoncyan/20 file:cursor-pointer cursor-pointer"
                  />
                </div>
                {newProdImage && (
                  <div className="shrink-0">
                    <img src={newProdImage} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-slate-700" />
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-neoncyan text-obsidian-900 font-bold py-3 rounded-xl text-xs hover:bg-neoncyan/95 transition-all cursor-pointer shadow-lg shadow-neoncyan/10"
                >
                  Create Product
                </button>
              </div>
            </form>

            {/* Product Table */}
            <div className="overflow-x-auto border-t border-slate-700/50 pt-6">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-300 dark:border-slate-700 text-slate-400 uppercase font-black">
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Base Price</th>
                    <th className="py-2.5">Live Price</th>
                    <th className="py-2.5">Stock</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-500">
                        No products added yet. Add your first dish above!
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-500/5">
                        <td className="py-3 font-semibold flex items-center gap-2.5">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-8 h-8 object-cover rounded-lg border border-slate-800" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-obsidian-800 border border-slate-800 flex items-center justify-center text-[10px] text-slate-600">No Image</div>
                          )}
                          <span>{p.name}</span>
                        </td>
                        <td className="py-3">₹{p.basePrice.toFixed(2)}</td>
                        <td className="py-3 font-black text-neoncyan">₹{p.currentPrice.toFixed(2)}</td>
                        <td className="py-3 flex items-center gap-1">
                          <button onClick={() => updateProductStock(p, -5)} className="px-1 text-slate-400 hover:text-white">-</button>
                          <span>{p.stock}</span>
                          <button onClick={() => updateProductStock(p, 5)} className="px-1 text-slate-400 hover:text-white">+</button>
                        </td>
                        <td className="py-3 text-right space-x-2">
                          <button
                            onClick={() => resetSingleProduct(p._id)}
                            className="bg-obsidian-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded hover:text-neoncyan transition-all cursor-pointer"
                          >
                            Reset
                          </button>
                          <button onClick={() => deleteProduct(p._id)} className="text-slate-500 hover:text-rose-500 cursor-pointer">
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Table QRs Manager */}
      {activeTab === 'tables' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-1">
              <QrCode className="w-5 h-5 text-neoncyan" /> QR Seating Registry
            </h3>
            <p className="text-xs text-slate-500 mt-1">Generate secure printable QR access codes for Tables 1 to 10</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((tNum) => (
              <div
                key={tNum}
                className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-center bg-obsidian-800/10 flex flex-col justify-between h-36 hover-grow cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Table {tNum}</div>
                <div className="flex justify-center my-2 text-neoncyan">
                  <QrCode 
                    className="w-10 h-10 animate-pulse" 
                    style={{ animationDelay: `${(tNum - 1) * 0.2}s` }}
                  />
                </div>
                <button
                  onClick={() => generateQRCodeCard(tNum)}
                  className="bg-neoncyan/10 hover:bg-neoncyan hover:text-obsidian-900 border border-neoncyan/30 text-neoncyan py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Generate QR
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Display Modal */}
      {qrModal.show && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-slate-800 text-center relative">
            <button
              onClick={() => setQrModal({ show: false, tableNumber: null, qrUrl: '', qrImage: '' })}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-black mb-1">Table {qrModal.tableNumber} QR Card</h3>
            <p className="text-[10px] text-slate-400 mb-6 uppercase tracking-wider">Verification target scanned redirection</p>
            <div className="bg-obsidian-900 p-4 rounded-2xl inline-block border border-slate-800 mb-6">
              <img src={qrModal.qrImage} alt="Table QR Code" className="w-48 h-48 mx-auto" />
            </div>
            <div className="text-[10px] text-slate-500 bg-obsidian-800/50 p-2.5 rounded-lg break-all select-all font-mono">
              {qrModal.qrUrl}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
