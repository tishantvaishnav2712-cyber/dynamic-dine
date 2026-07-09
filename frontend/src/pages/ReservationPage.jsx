import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, Users, Clock, CheckCircle, ArrowRight, User } from 'lucide-react';
import { API_URL } from '../config';

const ReservationPage = () => {
  const { user } = useAuth();
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [guestCount, setGuestCount] = useState(2);
  const [dateTime, setDateTime] = useState('');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [reservations, setReservations] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Fetch Tables and Reservation History
  useEffect(() => {
    fetchTables();
    if (user?.role === 'admin' || user?.role === 'waiter') {
      fetchReservations();
    }
  }, [user]);

  const fetchTables = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/tables`);
      if (data.success) {
        setTables(data.tables);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  const fetchReservations = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/reservations`);
      if (data.success) {
        setReservations(data.reservations);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedTable) {
      setError('Please select a table to reserve');
      return;
    }

    try {
      const { data } = await axios.post(`${API_URL}/reservations`, {
        customerName,
        customerPhone,
        tableId: selectedTable,
        dateTime,
        guestCount,
      });

      if (data.success) {
        setSuccess('Reservation booked successfully!');
        setSelectedTable('');
        setDateTime('');
        fetchTables();
        if (user?.role === 'admin' || user?.role === 'waiter') {
          fetchReservations();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book reservation');
    }
  };

  const seatReservation = async (resId) => {
    try {
      const { data } = await axios.put(`${API_URL}/reservations/${resId}/status`, {
        status: 'seated',
      });
      if (data.success) {
        fetchReservations();
        fetchTables();
      }
    } catch (err) {
      setError('Failed to seat guest');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
          Table Reservations
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Book your secure dining experience in real time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-neoncyan" /> Book a Table
          </h2>

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-sm mb-5 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {success}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleBooking} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Diner Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-obsidian-800/80 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 pl-9 text-slate-800 dark:text-white focus:outline-none focus:border-neoncyan text-sm"
                  placeholder="Enter name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-100 dark:bg-obsidian-800/80 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:border-neoncyan text-sm"
                placeholder="Enter phone"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Guests Count
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Users className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-100 dark:bg-obsidian-800/80 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 pl-9 text-slate-800 dark:text-white focus:outline-none focus:border-neoncyan text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-obsidian-800/80 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 px-2 text-slate-800 dark:text-white focus:outline-none focus:border-neoncyan text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Select Table
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full bg-slate-100 dark:bg-obsidian-800/80 border border-slate-300 dark:border-slate-700/50 rounded-xl py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:border-neoncyan text-sm cursor-pointer"
              >
                <option value="">Choose a table...</option>
                {tables.map((t) => (
                  <option
                    key={t._id}
                    value={t._id}
                    disabled={t.status !== 'available'}
                    className="bg-slate-100 dark:bg-obsidian-800 text-slate-800 dark:text-white"
                  >
                    Table {t.tableNumber} (Capacity: {t.capacity}) - {t.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-neoncyan text-obsidian-900 font-bold py-3 rounded-xl hover:bg-neoncyan/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-neoncyan/15 text-sm"
            >
              Confirm Reservation <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Table layout visualization / Reservation list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-neoncyan" /> Table Map Status
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {tables.map((table) => {
                const getStatusColor = (status) => {
                  switch (status) {
                    case 'available': return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5';
                    case 'reserved': return 'border-amber-500/30 text-amber-400 bg-amber-500/5';
                    case 'occupied': return 'border-rose-500/30 text-rose-400 bg-rose-500/5';
                    case 'cleaning': return 'border-neoncyan/30 text-neoncyan bg-neoncyan/5';
                    default: return 'border-slate-500/30 text-slate-400 bg-slate-500/5';
                  }
                };
                return (
                  <div
                    key={table._id}
                    className={`border p-4 rounded-xl text-center shadow-md flex flex-col justify-between transition-all ${getStatusColor(
                      table.status
                    )}`}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">T - {table.tableNumber}</div>
                    <div className="text-xl font-black my-2">{table.capacity} Pax</div>
                    <div className="text-[10px] font-semibold py-0.5 rounded-full capitalize">{table.status}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {(user?.role === 'admin' || user?.role === 'waiter') && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-x-auto">
              <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-neoncyan" /> Reservation Registry
              </h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Diner</th>
                    <th className="py-3 px-4">Table</th>
                    <th className="py-3 px-4">Guests</th>
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No reservations recorded today.
                      </td>
                    </tr>
                  ) : (
                    reservations.map((res) => (
                      <tr key={res._id} className="hover:bg-slate-500/5 transition-all text-slate-700 dark:text-slate-300">
                        <td className="py-3 px-4 font-semibold">{res.customerName}</td>
                        <td className="py-3 px-4">Table {res.table?.tableNumber}</td>
                        <td className="py-3 px-4">{res.guestCount} Guests</td>
                        <td className="py-3 px-4">{new Date(res.dateTime).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            res.status === 'seated'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : res.status === 'confirmed'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {res.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {res.status === 'confirmed' && (
                            <button
                              onClick={() => seatReservation(res._id)}
                              className="bg-emerald-500 text-slate-900 font-bold px-3 py-1 rounded-lg hover:bg-emerald-400 transition-all text-xs cursor-pointer"
                            >
                              Seat Guest
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
