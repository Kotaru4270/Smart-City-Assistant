import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CityProvider } from './contexts/CityContext';
import Layout from './components/Layout';

const Login        = lazy(() => import('./pages/Login'));
const Register     = lazy(() => import('./pages/Register'));
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Weather      = lazy(() => import('./pages/Weather'));
const Hospitals    = lazy(() => import('./pages/Hospitals'));
const Tourism      = lazy(() => import('./pages/Tourism'));
const Issues       = lazy(() => import('./pages/Issues'));
const Analytics    = lazy(() => import('./pages/Analytics'));
const Admin        = lazy(() => import('./pages/Admin'));
const Profile      = lazy(() => import('./pages/Profile'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-loader"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-loader"><div className="spinner" /></div>;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-loader"><div className="spinner" /></div>;
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <CityProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(99,102,241,0.3)' },
              duration: 4000,
            }}
          />
          <Suspense fallback={<div className="full-loader"><div className="spinner" /></div>}>
            <Routes>
              <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard"  element={<Dashboard />} />
                <Route path="weather"    element={<Weather />} />
                <Route path="hospitals"  element={<Hospitals />} />
                <Route path="tourism"    element={<Tourism />} />
                <Route path="issues"     element={<Issues />} />
                <Route path="analytics"  element={<Analytics />} />
                <Route path="admin"      element={<AdminRoute><Admin /></AdminRoute>} />
                <Route path="profile"    element={<Profile />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CityProvider>
    </AuthProvider>
  );
}
