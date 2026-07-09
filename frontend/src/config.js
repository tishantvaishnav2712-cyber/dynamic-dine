const hostname = window.location.hostname;

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
  hostname === 'localhost' || hostname.startsWith('192.168.') || hostname.startsWith('127.0.0.')
    ? `http://${hostname}:5000`
    : `https://dynamic-dine-backend.onrender.com` // Default Render backend fallback URL
);

export const API_URL = `${BACKEND_URL}/api`;
export const SOCKET_URL = BACKEND_URL;
