import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { ChefHat, Clock, AlertTriangle, Check, Flame, Bell } from 'lucide-react';
import { API_URL } from '../config';

const KitchenDashboard = () => {
  const socket = useSocket();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [playAlert, setPlayAlert] = useState(false);

  useEffect(() => {
    fetchActiveOrders();

    if (!socket) return;

    // Real-time listener for incoming orders placed by customers
    socket.on('order_placed', ({ order }) => {
      setOrders((prev) => [...prev, order]);
      triggerAudioAlert();
    });

    socket.on('order_status_updated', () => {
      fetchActiveOrders();
    });

    return () => {
      socket.off('order_placed');
      socket.off('order_status_updated');
    };
  }, [socket]);

  const fetchActiveOrders = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/orders/active`);
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      setError('Failed to fetch active kitchen queue');
    }
  };

  const triggerAudioAlert = () => {
    setPlayAlert(true);
    setTimeout(() => setPlayAlert(false), 3000);
  };

  const updateItemStatus = async (orderId, itemId, newStatus) => {
    try {
      const { data } = await axios.put(`${API_URL}/orders/${orderId}/status`, {
        status: newStatus,
        itemId,
      });
      if (data.success) {
        fetchActiveOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateOrderOverallStatus = async (orderId, newStatus) => {
    try {
      const { data } = await axios.put(`${API_URL}/orders/${orderId}/status`, {
        status: newStatus,
      });
      if (data.success) {
        fetchActiveOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to calculate minutes elapsed since order was created
  const getMinutesElapsed = (createdAt) => {
    const elapsedMs = Date.now() - new Date(createdAt).getTime();
    return Math.floor(elapsedMs / (1000 * 60));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Sound notification simulator */}
      {playAlert && (
        <div className="bg-neonred border border-neonred/30 text-white font-bold p-4 rounded-xl text-center shadow-xl animate-bounce mb-6 text-sm flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5 text-white" /> NEW ORDER PLACED! KITCHEN QUEUE UPDATED.
        </div>
      )}

      <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neoncyan/10 rounded-xl text-neoncyan">
            <ChefHat className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Kitchen Display System</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Live culinary production pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative p-2 bg-obsidian-800/40 rounded-xl border border-slate-700/50 flex items-center justify-center">
            <Bell className={`w-5 h-5 text-neoncyan ${orders.some(o => o.overallStatus === 'pending') ? 'ringing-bell text-amber-500' : ''}`} />
            {orders.filter(o => o.overallStatus === 'pending').length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full w-5.5 h-5.5 text-[10px] flex items-center justify-center font-black border border-obsidian-900">
                {orders.filter(o => o.overallStatus === 'pending').length}
              </span>
            )}
          </div>
          <div className="glass-panel py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400">
            Queue Size: {orders.length}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm mb-6">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20 text-slate-400 glass-panel rounded-2xl border border-slate-200 dark:border-slate-800">
          <ChefHat className="w-16 h-16 text-slate-600 mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-bold">Kitchen Queue is Empty</h3>
          <p className="text-xs text-slate-500 mt-1">Waiting for incoming table orders...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => {
            const minutesElapsed = getMinutesElapsed(order.createdAt);
            
            // Age styling card borders
            let ageBorderClass = 'border-slate-200 dark:border-slate-800';
            let ageBgClass = 'bg-slate-100/50 dark:bg-obsidian-800/80';
            if (minutesElapsed >= 20) {
              ageBorderClass = 'border-neonred shadow-lg shadow-neonred/5 animate-pulse';
              ageBgClass = 'bg-neonred/5';
            } else if (minutesElapsed >= 10) {
              ageBorderClass = 'border-amber-500';
              ageBgClass = 'bg-amber-500/5';
            }

            return (
              <div
                key={order._id}
                className={`border p-5 rounded-2xl flex flex-col justify-between shadow-md transition-all ${ageBgClass} ${ageBorderClass}`}
              >
                <div>
                  <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700/50 pb-3 mb-3">
                    <div>
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Table</span>
                      <div className="text-2xl font-black text-slate-800 dark:text-white">Table {order.tableNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{minutesElapsed} min ago</span>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        order.overallStatus === 'ready' ? 'bg-neoncyan/10 text-neoncyan' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {order.overallStatus}
                      </span>
                    </div>
                  </div>

                  {order.specialInstructions && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-xl text-xs mb-4 font-bold flex items-start gap-1">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>Note: {order.specialInstructions}</span>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-3 mb-6">
                    {order.items.map((item) => (
                      <div key={item._id} className="flex justify-between items-center text-sm">
                        <div className="flex-1 pr-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                          <span className="text-slate-400 dark:text-slate-500 font-black ml-2">x{item.quantity}</span>
                        </div>

                        {/* Status Checkboxes */}
                        <div className="flex items-center gap-2">
                          {item.status === 'pending' && (
                            <button
                              onClick={() => updateItemStatus(order._id, item._id, 'preparing')}
                              className="bg-amber-500/10 hover:bg-amber-500 hover:text-slate-900 border border-amber-500/30 text-amber-400 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Cook
                            </button>
                          )}
                          {item.status === 'preparing' && (
                            <button
                              onClick={() => updateItemStatus(order._id, item._id, 'ready')}
                              className="bg-neoncyan/10 hover:bg-neoncyan hover:text-obsidian-900 border border-neoncyan/30 text-neoncyan px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Flame className="w-3.5 h-3.5 animate-bounce" /> Ready
                            </button>
                          )}
                          {item.status === 'ready' && (
                            <span className="text-[10px] text-neoncyan font-bold uppercase bg-neoncyan/5 px-2 py-0.5 rounded-full">
                              Serving
                            </span>
                          )}
                          {item.status === 'served' && (
                            <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-500/5 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Served
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overall status action buttons */}
                <div className="border-t border-slate-300 dark:border-slate-700/50 pt-4 flex gap-2">
                  {order.overallStatus === 'pending' && (
                    <button
                      onClick={() => updateOrderOverallStatus(order._id, 'accepted')}
                      className="flex-1 bg-amber-500 text-slate-900 font-black py-2 rounded-xl text-xs hover:bg-amber-400 transition-all cursor-pointer"
                    >
                      Accept Order
                    </button>
                  )}
                  {order.overallStatus === 'accepted' && (
                    <button
                      onClick={() => updateOrderOverallStatus(order._id, 'preparing')}
                      className="flex-1 bg-amber-500 text-slate-900 font-black py-2 rounded-xl text-xs hover:bg-amber-400 transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Flame className="w-4 h-4" /> Start Cooking
                    </button>
                  )}
                  {order.overallStatus === 'preparing' && (
                    <button
                      onClick={() => updateOrderOverallStatus(order._id, 'ready')}
                      className="flex-1 bg-neoncyan text-obsidian-900 font-black py-2 rounded-xl text-xs hover:bg-neoncyan/90 transition-all cursor-pointer"
                    >
                      Mark All Ready
                    </button>
                  )}
                  {order.overallStatus === 'ready' && (
                    <span className="flex-1 text-center py-2 text-xs font-semibold bg-neoncyan/10 border border-neoncyan/20 text-neoncyan rounded-xl">
                      Waiting for server pick-up
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;
