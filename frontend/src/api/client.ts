import axios from 'axios';
import type { AuthResponse, CartItem, DashboardSummary, Order, Product, UserProfile } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090';
const TOKEN_KEY = 'smart-commerceops-token';
const USER_KEY = 'smart-commerceops-user';

export const api = axios.create({
  baseURL: API_BASE_URL
});

export function apiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data.trim()) {
      return data;
    }
    if (data && typeof data === 'object') {
      const message = 'message' in data && typeof data.message === 'string' ? data.message : null;
      const errorLabel = 'error' in data && typeof data.error === 'string' ? data.error : null;
      if (message && message.trim()) {
        return message;
      }
      if (errorLabel && errorLabel.trim()) {
        return errorLabel;
      }
    }
    if (error.message) {
      return error.message;
    }
  }
  return fallback;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function saveSession(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function currentUser(): UserProfile | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export const authApi = {
  register: async (payload: { username: string; email: string; password: string; role: string }) => {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },
  login: async (payload: { username: string; password: string }) => {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  }
};

export const catalogApi = {
  products: async () => {
    const { data } = await api.get<Product[]>('/products');
    return data;
  },
  inventoryAlerts: async () => {
    const { data } = await api.get('/admin/inventory/alerts');
    return data;
  },
  createProduct: async (payload: Partial<Product>) => {
    const { data } = await api.post<Product>('/admin/products', payload);
    return data;
  }
};

export const orderApi = {
  cart: async (userId: number) => {
    const { data } = await api.get<CartItem[]>(`/cart/${userId}`);
    return data;
  },
  addToCart: async (payload: { userId: number; productId: number; quantity: number }) => {
    const { data } = await api.post<CartItem>('/cart/items', payload);
    return data;
  },
  checkout: async (payload: { userId: number; shippingAddress: string; phoneNumber: string }) => {
    const { data } = await api.post<Order>('/checkout', payload);
    return data;
  },
  orders: async (userId?: number) => {
    const { data } = await api.get<Order[]>('/orders', { params: userId ? { userId } : undefined });
    return data;
  },
  updateStatus: async (orderId: number, status: Order['status']) => {
    const { data } = await api.put<Order>(`/orders/${orderId}/status/${status}`);
    return data;
  }
};

export const analyticsApi = {
  dashboard: async () => {
    const { data } = await api.get<DashboardSummary>('/analytics/dashboard');
    return data;
  }
};
