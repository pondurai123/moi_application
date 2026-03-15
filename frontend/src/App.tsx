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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/collect/:weddingId" element={<GiftCollectionPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/weddings/:id" element={<ProtectedRoute><AdminWeddingDetailPage /></ProtectedRoute>} />
          <Route path="/admin/functions" element={<ProtectedRoute><AdminFunctionsPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><AdminSettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer position="top-right" theme="dark" autoClose={3000} />
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
