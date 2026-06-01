import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, RotateCcw, Tag, Package, CreditCard, Megaphone,
  BarChart3, Bell, Settings, ChevronLeft, ChevronRight, Key, Grid, Users,
  DollarSign, ShieldCheck, Warehouse, Star, Gift, Banknote, Globe, FileText
} from 'lucide-react'
import { useState } from 'react'

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    ]
  },
  {
    label: 'Manage Business',
    items: [
      { to: '/accounts', icon: Users, label: 'Accounts' },
      { to: '/orders', icon: ShoppingBag, label: 'Orders' },
      { to: '/returns', icon: RotateCcw, label: 'Returns' },
      { to: '/pricing', icon: DollarSign, label: 'Pricing' },
      { to: '/claims', icon: ShieldCheck, label: 'Claims' },
      { to: '/products', icon: Package, label: 'Inventory' },
      { to: '/catalogue', icon: Grid, label: 'Catalog Uploads' },
      { to: '/quality', icon: Star, label: 'Quality' },
      { to: '/payments', icon: CreditCard, label: 'Payments' },
      { to: '/warehouse', icon: Warehouse, label: 'Warehouse' },
    ]
  },
  {
    label: 'Boost Sales',
    items: [
      { to: '/ads', icon: Megaphone, label: 'Advertisement' },
      { to: '/promotions', icon: Gift, label: 'Promotions' },
      { to: '/otp', icon: Key, label: 'OTP Panel' },
    ]
  },
  {
    label: 'Performance',
    items: [
      { to: '/insights', icon: BarChart3, label: 'Seller Insights' },
    ]
  },
  {
    label: null,
    items: [
      { to: '/notifications', icon: Bell, label: 'Notifications' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ]
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`h-screen sticky top-0 flex flex-col bg-white border-r border-slate-100 transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-100">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-slate-900 text-base">MeeshoHub</span>
            <p className="text-[10px] text-slate-400 leading-none">Supplier Panel</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2 space-y-0">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-1' : ''}>
            {group.label && !collapsed && (
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-3 pb-1">
                {group.label}
              </p>
            )}
            {group.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
                title={collapsed ? label : undefined}
              >
                <Icon size={16} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </div>
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
