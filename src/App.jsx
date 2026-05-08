import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';

// Layout
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));

// Pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AllEventsPage = lazy(() => import('./pages/AllEventsPage'));
const ScannerPage = lazy(() => import('./pages/ScannerPage'));

// Admin
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminEventsPage = lazy(() => import('./pages/admin/AdminEventsPage'));
const AdminPostsPage = lazy(() => import('./pages/admin/AdminPostsPage'));

// Dean
const DeanEventsPage = lazy(() => import('./pages/dean/DeanEventsPage'));

// Registrar
const RegistrarEventsPage = lazy(() => import('./pages/registrar/RegistrarEventsPage'));

// Faculty
const CreateEventPage = lazy(() => import('./pages/faculty/CreateEventPage'));
const FacultyEventsPage = lazy(() => import('./pages/faculty/FacultyEventsPage'));

// Student
const StudentEventsPage = lazy(() => import('./pages/student/StudentEventsPage'));
const StudentRegistrationsPage = lazy(() => import('./pages/student/StudentRegistrationsPage'));

// Loading component
const PageLoader = () => (
  <div className="loading-page">
    <div className="loading-spinner" />
  </div>
);

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="loading-page"><div className="loading-spinner" /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-page"><div className="loading-spinner" /></div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

      {/* Protected Routes with Dashboard Layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="dashboard" element={
          <ProtectedRoute roles={['admin', 'registrar']}><DashboardPage /></ProtectedRoute>
        } />
        <Route path="home" element={<FeedPage />} />
        <Route path="all-events" element={<AllEventsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="scanner" element={
          <ProtectedRoute roles={['admin', 'registrar', 'faculty']}><ScannerPage /></ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="admin/users" element={
          <ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>
        } />
        <Route path="admin/events" element={
          <ProtectedRoute roles={['admin']}><AdminEventsPage /></ProtectedRoute>
        } />
        <Route path="admin/posts" element={
          <ProtectedRoute roles={['admin']}><AdminPostsPage /></ProtectedRoute>
        } />

        {/* Dean Routes */}
        <Route path="dean/events" element={
          <ProtectedRoute roles={['dean']}><DeanEventsPage /></ProtectedRoute>
        } />

        {/* Registrar Routes */}
        <Route path="registrar/events" element={
          <ProtectedRoute roles={['registrar']}><RegistrarEventsPage /></ProtectedRoute>
        } />

        {/* Faculty Routes */}
        <Route path="faculty/create-event" element={
          <ProtectedRoute roles={['faculty', 'admin']}><CreateEventPage /></ProtectedRoute>
        } />
        <Route path="faculty/my-events" element={
          <ProtectedRoute roles={['faculty', 'admin']}><FacultyEventsPage /></ProtectedRoute>
        } />

        {/* Student Routes */}
        <Route path="student/events" element={
          <ProtectedRoute roles={['student']}><StudentEventsPage /></ProtectedRoute>
        } />
        <Route path="student/registrations" element={
          <ProtectedRoute roles={['student']}><StudentRegistrationsPage /></ProtectedRoute>
        } />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
        <Toaster position="top-center" toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
          },
        }} />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
