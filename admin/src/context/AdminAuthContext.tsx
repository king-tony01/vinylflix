import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/api.js';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  wallet?: {
    availableBalance: number;
    lockedBalance: number;
    pendingBalance: number;
  };
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
  refreshAdminUser: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentAdmin = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setAdminUser(null);
      setLoading(false);
      return;
    }

    const res = await apiRequest('/users/me');
    if (res.success && res.data && res.data.user) {
      const u = res.data.user;
      if (u.role === 'ADMIN' || u.role === 'FINANCE_RISK_ADMIN') {
        setAdminUser(u);
      } else {
        // Not authorized for admin portal
        logout();
      }
    } else {
      logout();
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentAdmin();
  }, []);

  const login = (token: string, user: AdminUser) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    setAdminUser(user);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdminUser(null);
  };

  const refreshAdminUser = async () => {
    await fetchCurrentAdmin();
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        loading,
        login,
        logout,
        refreshAdminUser,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
