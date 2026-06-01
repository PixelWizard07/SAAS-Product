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
import NotificationsPage from './pages/notifications/NotificationsPage'
import LabelsPage from './pages/labels/LabelsPage'
import SettingsPage from './pages/settings/SettingsPage'
import CataloguePage from './pages/catalogue/CataloguePage'
import CatalogueUploadsPage from './pages/catalogueuploads/CatalogueUploadsPage'
import PricingPage from './pages/pricing/PricingPage'
import ClaimsPage from './pages/claims/ClaimsPage'
import QualityPage from './pages/quality/QualityPage'
import WarehousePage from './pages/warehouse/WarehousePage'
import SellerInsightsPage from './pages/insights/SellerInsightsPage'
import PromotionsPage from './pages/promotions/PromotionsPage'

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
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="labels" element={<LabelsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="catalogue" element={<CatalogueUploadsPage />} />
              <Route path="pricing" element={<PricingPage />} />
              <Route path="claims" element={<ClaimsPage />} />
              <Route path="quality" element={<QualityPage />} />
              <Route path="warehouse" element={<WarehousePage />} />
              <Route path="insights" element={<SellerInsightsPage />} />
              <Route path="promotions" element={<PromotionsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AccountProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
