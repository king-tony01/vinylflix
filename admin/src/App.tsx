import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext.js';
import { AdminLayout } from './components/AdminLayout.js';

import { AdminLoginPage } from './pages/AdminLoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { WithdrawalsQueuePage } from './pages/WithdrawalsQueuePage.js';
import { UserGovernancePage } from './pages/UserGovernancePage.js';
import { CampaignReviewsPage } from './pages/CampaignReviewsPage.js';
import { PlatformConfigPage } from './pages/PlatformConfigPage.js';
import { RiskSurveillancePage } from './pages/RiskSurveillancePage.js';
import { AuditLogsPage } from './pages/AuditLogsPage.js';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminUser, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-500 font-mono">
        Validating administrative session credentials...
      </div>
    );
  }

  if (!adminUser) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />

      <Route
        path="/"
        element={
          <AdminRoute>
            <DashboardPage />
          </AdminRoute>
        }
      />
      <Route
        path="/withdrawals"
        element={
          <AdminRoute>
            <WithdrawalsQueuePage />
          </AdminRoute>
        }
      />
      <Route
        path="/users"
        element={
          <AdminRoute>
            <UserGovernancePage />
          </AdminRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <AdminRoute>
            <CampaignReviewsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/configs"
        element={
          <AdminRoute>
            <PlatformConfigPage />
          </AdminRoute>
        }
      />
      <Route
        path="/risk"
        element={
          <AdminRoute>
            <RiskSurveillancePage />
          </AdminRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <AdminRoute>
            <AuditLogsPage />
          </AdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL || '/admin'}>
      <AdminAuthProvider>
        <AppContent />
      </AdminAuthProvider>
    </BrowserRouter>
  );
};

export default App;
