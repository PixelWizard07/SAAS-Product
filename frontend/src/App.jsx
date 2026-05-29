import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AccountProvider } from './contexts/AccountContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import AccountsPage from './pages/accounts/AccountsPage'
import OrdersPage from './pages/orders/OrdersPage'
import ReturnsPage from './pages/returns/ReturnsPage'
import OtpPanelPage from './pages/otp/OtpPanelPage'
import ProductsPage from './pages/products/ProductsPage'
import PaymentsPage from './pages/payments/PaymentsPage'
import AdsPage from './pages/ads/AdsPage'
import ReportsPage from './pages/reports/ReportsPage'
import NotificationsPage from './pages/notifications/NotificationsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccountProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="returns" element={<ReturnsPage />} />
              <Route path="otp" element={<OtpPanelPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="ads" element={<AdsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AccountProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
