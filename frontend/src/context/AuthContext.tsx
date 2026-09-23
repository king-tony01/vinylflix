import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/api.js';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'GUEST' | 'FREE_USER' | 'PAID_MEMBER' | 'CREATOR' | 'ADVERTISER' | 'ADMIN' | 'FINANCE_RISK_ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED';
  isEmailVerified?: boolean;
  emailVerifiedAt?: string;
  referralCode: string;
  profile?: {
    fullName?: string;
    avatarUrl?: string;
  };
  wallet?: {
    availableBalance: number;
    pendingBalance: number;
    lockedBalance: number;
    currency: string;
  };
  activeMembership?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const res = await apiRequest('/auth/me');
    if (res.success && res.data) {
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
