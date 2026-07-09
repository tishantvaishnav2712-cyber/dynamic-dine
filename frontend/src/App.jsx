import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerPortal from './pages/CustomerPortal';
import ReservationPage from './pages/ReservationPage';
import KitchenDashboard from './pages/KitchenDashboard';
import WaiterDashboard from './pages/WaiterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { LogOut, Sun, Moon, ChefHat, Activity, TableProperties, Calendar } from 'lucide-react';

// Wrapper to protect routes by roles
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-900 text-white">
        <div className="w-10 h-10 border-4 border-neoncyan border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Navbar Layout for staff dashboards
const StaffLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-obsidian-900 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-300">
      {/* Navigation Header */}
      <header className="bg-white dark:bg-obsidian-800 border-b border-slate-200 dark:border-slate-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-neoncyan" />
            <span className="font-black tracking-tight text-slate-800 dark:text-white text-lg">Dynamic Dine</span>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin" className="hover:text-neoncyan transition-all">Admin Terminal</Link>
                  <Link to="/waiter" className="hover:text-neoncyan transition-all">Waiter POS</Link>
                  <Link to="/kitchen" className="hover:text-neoncyan transition-all">Kitchen display</Link>
                  <Link to="/reservations" className="hover:text-neoncyan transition-all">Bookings</Link>
                </>
              )}
              {user?.role === 'waiter' && (
                <>
                  <Link to="/waiter" className="hover:text-neoncyan transition-all">Waiter Dashboard</Link>
                  <Link to="/reservations" className="hover:text-neoncyan transition-all">Bookings</Link>
                </>
              )}
              {user?.role === 'kitchen' && (
                <Link to="/kitchen" className="hover:text-neoncyan transition-all">Kitchen Queue</Link>
              )}
            </nav>

            <div className="flex items-center gap-3 border-l border-slate-300 dark:border-slate-800 pl-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-obsidian-700 text-slate-600 dark:text-slate-300 hover:text-neoncyan transition-all cursor-pointer"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-800 dark:text-white">{user?.name}</div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400">{user?.role}</div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-all cursor-pointer"
                title="Disconnect Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page Body */}
      <main className="flex-1 bg-slate-50 dark:bg-obsidian-900">{children}</main>
    </div>
  );
};

// Home component to route to correct dashboard on root visit
const HomeRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'waiter':
      return <Navigate to="/waiter" replace />;
    case 'kitchen':
      return <Navigate to="/kitchen" replace />;
    default:
      return <Navigate to="/reservations" replace />;
  }
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer Table Ordering Router (QR code locked) */}
            <Route path="/table/:tableNumber" element={<CustomerPortal />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomeRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations"
              element={
                <ProtectedRoute allowedRoles={['admin', 'waiter', 'customer']}>
                  <StaffLayout>
                    <ReservationPage />
                  </StaffLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <StaffLayout>
                    <AdminDashboard />
                  </StaffLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/waiter"
              element={
                <ProtectedRoute allowedRoles={['admin', 'waiter']}>
                  <StaffLayout>
                    <WaiterDashboard />
                  </StaffLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute allowedRoles={['admin', 'kitchen']}>
                  <StaffLayout>
                    <KitchenDashboard />
                  </StaffLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
