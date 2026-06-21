/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { DepartmentManagement } from './pages/DepartmentManagement';
import { MetricTypeManagement } from './pages/MetricTypeManagement';
import { MetricTypeCategoryManagement } from './pages/MetricTypeCategoryManagement';
import { ImportMunicipalityData } from './pages/ImportMunicipalityData';
import { GeographicMap } from './pages/GeographicMap';
import { UserManagement } from './pages/UserManagement';
import { AuditLogs } from './pages/AuditLogs';
import { SetPassword } from './pages/SetPassword';
import { ResetPassword } from './pages/ResetPassword';
import { useAuth } from './lib/AuthContext';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role.name !== 'admin') {
    return <Navigate to="/map" replace />;
  }
  return children;
}

function ImportRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role.name !== 'admin' && user?.role.name !== 'editor') {
    return <Navigate to="/map" replace />;
  }
  return children;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, element: <Navigate to="/map" replace /> },
      { path: 'map', Component: GeographicMap },
      { path: 'departments', Component: DepartmentManagement },
      { path: 'metric-types', Component: MetricTypeManagement },
      { path: 'metric-type-categories', Component: MetricTypeCategoryManagement },
      {
        path: 'import-data',
        element: (
          <ImportRoute>
            <ImportMunicipalityData />
          </ImportRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <AdminRoute>
            <AuditLogs />
          </AdminRoute>
        ),
      },
    ],
  },
  {
    path: 'auth/set-password',
    Component: SetPassword,
  },
  {
    path: 'auth/reset-password',
    Component: ResetPassword,
  },
]);
