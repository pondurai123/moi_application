import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import { LanguageProvider } from './i18n/LanguageContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import GiftCollectionPage from './pages/GiftCollectionPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminWeddingDetailPage from './pages/AdminWeddingDetailPage';
import AdminFunctionsPage from './pages/AdminFunctionsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminEventCreatePage from './pages/AdminEventCreatePage';
import AdminManagementPage from './pages/AdminManagementPage';
import PublicContentPage from './pages/PublicContentPage';

function ProtectedRoute({ 
  children, 
  requiredRole,
  adminOnly
}: { 
  children: React.ReactNode; 
  requiredRole?: 'SUPER_ADMIN' | 'ADMIN';
  adminOnly?: boolean;
}) {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/admin/login" replace />;
  
  const adminUserStr = localStorage.getItem('adminUser');
  const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
  
  // Redirect non-admin users trying to access admin pages
  if (!adminUser && adminOnly) {
    return <Navigate to="/admin/login" replace />;
  }
  
  // Restrict ADMIN role from accessing SUPER_ADMIN only pages
  if (requiredRole === 'SUPER_ADMIN' && adminUser?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<PublicContentPage pageType="about" titleKey="marketing.aboutTitle" subtitleKey="marketing.aboutSubtitle" fallbackKey="marketing.aboutFallback" />} />
          <Route path="/terms" element={<PublicContentPage pageKey="termsContent" titleKey="marketing.termsTitle" subtitleKey="marketing.termsSubtitle" fallbackKey="marketing.termsFallback" />} />
          <Route path="/privacy" element={<PublicContentPage pageKey="privacyContent" titleKey="marketing.privacyTitle" subtitleKey="marketing.privacySubtitle" fallbackKey="marketing.privacyFallback" />} />
          <Route path="/contact" element={<PublicContentPage pageType="contact" titleKey="marketing.contactTitle" subtitleKey="marketing.contactSubtitle" fallbackKey="marketing.contactFallback" />} />
          <Route path="/collect/:weddingId" element={<ProtectedRoute adminOnly><GiftCollectionPage /></ProtectedRoute>} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/events/new" element={<ProtectedRoute adminOnly><AdminEventCreatePage /></ProtectedRoute>} />
          <Route path="/admin/weddings/:id" element={<ProtectedRoute adminOnly><AdminWeddingDetailPage /></ProtectedRoute>} />
          <Route path="/admin/functions" element={<ProtectedRoute requiredRole="SUPER_ADMIN" adminOnly><AdminFunctionsPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requiredRole="SUPER_ADMIN" adminOnly><AdminSettingsPage /></ProtectedRoute>} />
          <Route path="/admin/management" element={<ProtectedRoute requiredRole="SUPER_ADMIN" adminOnly><AdminManagementPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer position="top-right" theme="dark" autoClose={3000} />
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
