import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { TableProperties, Bell, DollarSign, RefreshCw, AlertCircle, ShoppingCart } from 'lucide-react';
import { API_URL } from '../config';

const WaiterDashboard = () => {
  const socket = useSocket();
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [calls, setCalls] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Checkout billing inputs
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [serviceCharge, setServiceCharge] = useState(0.00); // e.g. 0.10 for 10%
  const [billingError, setBillingError] = useState('');
  const [billingSuccess, setBillingSuccess] = useState('');

  useEffect(() => {
    fetchTables();
    fetchActiveOrders();

    if (!socket) return;

    // Real-time table updates
    socket.on('table_status_updated', () => {
      fetchTables();
    });

    // Real-time waiter calls
    socket.on('waiter_called', (callData) => {
      setCalls((prev) => [callData, ...prev]);
      triggerCallAlert();
    });

    // Real-time bill requested alerts
    socket.on('bill_requested', ({ tableNumber, sessionId }) => {
      setCalls((prev) => [
        { message: `Requested Bill Settlement`, tableNumber, timestamp: new Date() },
        ...prev,
      ]);
      triggerCallAlert();
      fetchTables();
      setSelectedSession((prev) => {
        if (prev && prev._id === sessionId) {
          return { ...prev, billRequested: true };
        }
        return prev;
      });
    });

    // Food ready alert
    socket.on('notification', ({ type, message }) => {
      if (type === 'order_ready') {
        setCalls((prev) => [
          { message, tableNumber: 'KITCHEN', timestamp: new Date() },
          ...prev,
        ]);
        triggerCallAlert();
      }
    });

    socket.on('payment_completed', () => {
      fetchTables();
      fetchActiveOrders();
    });

    return () => {
      socket.off('table_status_updated');
      socket.off('waiter_called');
      socket.off('bill_requested');
      socket.off('notification');
      socket.off('payment_completed');
    };
  }, [socket]);

  const triggerCallAlert = () => {
    // Basic chime warning simulation
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = 600;
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    }
  };

  const fetchTables = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/tables`);
      if (data.success) {
        setTables(data.tables);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActiveOrders = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/orders/active`);
      if (data.success) {
        setActiveOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectTableCell = async (table) => {
    setSelectedTable(table);
    setBillingError('');
    setBillingSuccess('');
    
    if (table.currentSessionId) {
      try {
        const { data } = await axios.get(
          `${API_URL}/sessions/active/${table.tableNumber}?token=${table.currentSessionId.sessionToken}`
        );
        if (data.success && data.active) {
          setSelectedSession(data.session);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setSelectedSession(null);
    }
  };

  const updateTableStateManually = async (tNumber, newStatus) => {
    try {
      const { data } = await axios.put(`${API_URL}/tables/${tNumber}/status`, {
        status: newStatus,
      });
      if (data.success) {
        fetchTables();
        setSelectedTable(null);
        setSelectedSession(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const checkoutSubmit = async (e) => {
    e.preventDefault();
    setBillingError('');
    setBillingSuccess('');

    if (!selectedSession) return;

    try {
      const { data } = await axios.post(`${API_URL}/billing/settle`, {
        sessionId: selectedSession._id,
        paymentMethod,
        serviceChargeRate: parseFloat(serviceCharge),
      });

      if (data.success) {
        setBillingSuccess(`Bill settled for Table ${selectedTable.tableNumber}!`);
        setSelectedSession(null);
        setSelectedTable(null);
        fetchTables();
      }
    } catch (err) {
      setBillingError(err.response?.data?.message || 'Billing checkout failed');
    }
  };

  const markOrderServed = async (orderId) => {
    try {
      const { data } = await axios.put(`${API_URL}/orders/${orderId}/status`, {
        status: 'served',
      });
      if (data.success) {
        fetchActiveOrders();
        fetchTables();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const dismissCall = (idx) => {
    setCalls((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neoncyan/10 rounded-xl text-neoncyan">
            <TableProperties className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Waiter Terminal</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage table seating, requests, and bills</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Table Map (10 tables grid) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Restaurant Layout Floor
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {tables.map((table) => {
              const isActive = selectedTable?.tableNumber === table.tableNumber;
              let statusBorder = 'border-slate-200 dark:border-slate-800 bg-obsidian-800/10';
              let textStatus = 'text-slate-400';
              if (table.status === 'available') {
                statusBorder = 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5';
                textStatus = 'text-emerald-400';
              } else if (table.status === 'reserved') {
                statusBorder = 'border-amber-500/30 text-amber-400 bg-amber-500/5';
                textStatus = 'text-amber-400';
              } else if (table.status === 'occupied') {
                statusBorder = 'border-rose-500/30 text-rose-400 bg-rose-500/5';
                textStatus = 'text-rose-400';
              } else if (table.status === 'cleaning') {
                statusBorder = 'border-neoncyan/30 text-neoncyan bg-neoncyan/5';
                textStatus = 'text-neoncyan';
              }

              const selectedRing = isActive ? 'ring-2 ring-neoncyan scale-98 shadow-lg' : '';

              return (
                <div
                  key={table._id}
                  onClick={() => selectTableCell(table)}
                  className={`border p-5 rounded-2xl cursor-pointer text-center flex flex-col justify-between h-36 transition-all ${statusBorder} ${selectedRing}`}
                >
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Table {table.tableNumber}</div>
                  <div className="text-3xl font-black text-slate-800 dark:text-white my-1">{table.capacity} Pax</div>
                  <div className={`text-xs font-semibold py-0.5 rounded-full capitalize ${textStatus}`}>
                    {table.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar details Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notification Center */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-h-72 overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-neoncyan" /> Alerts Panel
            </h2>

            {calls.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No active notifications or guest calls.
              </div>
            ) : (
              <div className="space-y-2">
                {calls.map((call, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-obsidian-800/80 p-3 rounded-xl border border-slate-800 text-xs text-white"
                  >
                    <div>
                      <span className="font-bold text-neoncyan mr-1.5">[T-{call.tableNumber}]</span>
                      <span>{call.message}</span>
                    </div>
                    <button
                      onClick={() => dismissCall(idx)}
                      className="text-slate-400 hover:text-white text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded border border-slate-700 bg-obsidian-900 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table Interaction Card */}
          {selectedTable ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700/50 pb-3">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  Table {selectedTable.tableNumber} Portal
                </h2>
                <span className="text-xs uppercase font-bold text-neoncyan">State: {selectedTable.status}</span>
              </div>

              {selectedTable.status === 'cleaning' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Table is currently marked as **Cleaning**. Release this table to make it available for new walk-ins and bookings.
                  </div>
                  <button
                    onClick={() => updateTableStateManually(selectedTable.tableNumber, 'available')}
                    className="w-full bg-emerald-500 text-slate-900 font-bold py-3 rounded-xl hover:bg-emerald-400 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Release Table (Set Available)
                  </button>
                </div>
              )}

              {selectedTable.status === 'available' && (
                <div className="space-y-4 text-center py-4">
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Table is ready. A session starts automatically when booking seated.
                  </div>
                </div>
              )}

              {selectedTable.status === 'occupied' && selectedSession && (
                <div className="space-y-6">
                  {/* Active Orders List */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4 text-neoncyan" /> Orders List
                    </h3>
                    
                    {selectedSession.orders?.length === 0 ? (
                      <div className="text-xs text-slate-500">No items ordered yet.</div>
                    ) : (
                      selectedSession.orders?.map((ord, oIdx) => (
                        <div key={ord._id || oIdx} className="bg-obsidian-800/40 p-3 rounded-xl border border-slate-800 text-xs">
                          <div className="flex justify-between font-bold text-slate-300 border-b border-slate-700/50 pb-1 mb-2">
                            <span>Order #{oIdx + 1}</span>
                            <span>Status: {ord.overallStatus.toUpperCase()}</span>
                          </div>
                          <ul className="space-y-1.5">
                            {ord.items.map((it, idx) => (
                              <li key={idx} className="flex justify-between text-slate-300">
                                <span>{it.name} (x{it.quantity})</span>
                                <span>₹{(it.priceAtOrder * it.quantity).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                          {ord.overallStatus === 'ready' && (
                            <button
                              onClick={() => markOrderServed(ord._id)}
                              className="w-full bg-neoncyan text-obsidian-900 font-bold py-1 rounded-lg text-[10px] uppercase mt-2.5 hover:bg-neoncyan/95 cursor-pointer"
                            >
                              Deliver to Table (Served)
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Settle Bill Form */}
                  <div className="border-t border-slate-300 dark:border-slate-700/50 pt-4 space-y-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <DollarSign className="w-4.5 h-4.5 text-neoncyan" /> POS Billing Settlement
                    </h3>

                    {billingSuccess && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs text-center font-bold">
                        {billingSuccess}
                      </div>
                    )}

                    {billingError && (
                      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs">
                        {billingError}
                      </div>
                    )}

                    <form onSubmit={checkoutSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block text-slate-500 mb-1">Service Charge</label>
                          <select
                            value={serviceCharge}
                            onChange={(e) => setServiceCharge(parseFloat(e.target.value))}
                            className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-lg p-2 text-slate-800 dark:text-white focus:outline-none"
                          >
                            <option value="0.00">0% Service</option>
                            <option value="0.05">5% Service</option>
                            <option value="0.10">10% Service</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Payment Method</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-obsidian-800 border border-slate-300 dark:border-slate-700/50 rounded-lg p-2 text-slate-800 dark:text-white focus:outline-none capitalize"
                          >
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="card">Card</option>
                            <option value="online">Online</option>
                          </select>
                        </div>
                      </div>

                      {/* Display running total */}
                      <div className="flex justify-between items-center text-xs text-slate-400 bg-obsidian-800/20 p-3 rounded-xl">
                        <span>Running Food Subtotal:</span>
                        <span className="font-bold text-white text-sm">₹{selectedSession.runningTotal.toFixed(2)}</span>
                      </div>

                      {selectedSession.billRequested ? (
                        <div className="bg-neoncyan/10 border border-neoncyan/30 text-neoncyan p-2.5 rounded-xl text-xs text-center font-black animate-pulse uppercase tracking-wider">
                          🛎️ Guest Requested Bill Settlement
                        </div>
                      ) : (
                        <div className="bg-obsidian-800/50 border border-slate-700/50 text-slate-500 p-2.5 rounded-xl text-xs text-center font-bold">
                          ⏳ Awaiting Customer Bill Request
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={!selectedSession.billRequested}
                        className={`w-full font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-1 ${
                          selectedSession.billRequested
                            ? 'bg-neoncyan text-obsidian-900 hover:bg-neoncyan/95 cursor-pointer shadow-lg shadow-neoncyan/15'
                            : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                        }`}
                      >
                        {selectedSession.billRequested ? 'Settle & Check Out' : 'Checkout Disabled'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
              <TableProperties className="w-12 h-12 text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Table Selected</h3>
              <p className="text-[10px] text-slate-500 mt-1">Tap a table card on the layout floor map to explore</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaiterDashboard;
