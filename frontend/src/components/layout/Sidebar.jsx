import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, ShoppingBag, RotateCcw, Key, Package, CreditCard, Megaphone, BarChart3, Bell, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts', icon: Users, label: 'Accounts' },
  { to: '/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/returns', icon: RotateCcw, label: 'Returns' },
  { to: '/otp', icon: Key, label: 'OTP Panel' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/ads', icon: Megaphone, label: 'Ads' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`h-screen sticky top-0 flex flex-col bg-white border-r border-slate-100 transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}>
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-100">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        {!collapsed && <span className="font-bold text-slate-900 text-base">MeeshoHub</span>}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-center py-3 border-t border-slate-100 text-slate-400 hover:text-slate-600"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}
