import { useMemo } from 'react'
import { ShoppingBag, RotateCcw, TrendingUp, Key, Package } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import { MOCK_CHART_DATA } from '../../lib/mockData'
import { formatDistanceToNow } from 'date-fns'
import { useOrders } from '../../hooks/useOrders'
import { useReturns } from '../../hooks/useReturns'
import { useProducts } from '../../hooks/useProducts'
import { useAccounts } from '../../hooks/useAccounts'

export default function DashboardPage() {
  const { accounts } = useAccounts()
  const { data: orders = [] } = useOrders({ accountId: 'all' })
  const { data: returns = [] } = useReturns({ accountId: 'all' })
  const { data: products = [] } = useProducts({ accountId: 'all' })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const stats = useMemo(() => ({
    todayOrders: orders.filter(o => o.orderDate && new Date(o.orderDate) >= today).length,
    totalRevenue: orders.reduce((s, o) => s + (o.price || 0) * (o.quantity || 1), 0),
    pendingOrders: orders.filter(o => o.status === 'Pending').length,
    pendingReturns: returns.filter(r => r.status === 'Initiated' || r.status === 'Pickup Scheduled').length,
    activeOtps: returns.filter(r => r.otp && !r.otpUsed).length,
    totalProducts: products.length,
  }), [orders, returns, products])

  const recentOrders = orders.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Overview across all your Meesho seller accounts</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Today's Orders" value={stats.todayOrders} icon={ShoppingBag} color="indigo" delta={12} />
        <StatCard title="Total Revenue" value={`₹${(stats.totalRevenue / 1000).toFixed(1)}K`} icon={TrendingUp} color="green" delta={8} />
        <StatCard title="Pending Orders" value={stats.pendingOrders} icon={ShoppingBag} color="yellow" />
        <StatCard title="Pending Returns" value={stats.pendingReturns} icon={RotateCcw} color="red" />
        <StatCard title="Active OTPs" value={stats.activeOtps} icon={Key} color="blue" />
        <StatCard title="Total Products" value={stats.totalProducts} icon={Package} color="indigo" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Orders chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Orders & Revenue — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MOCK_CHART_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
              <Line type="monotone" dataKey="orders" stroke="#6366F1" strokeWidth={2} dot={false} name="Orders" />
              <Line type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={2} dot={false} name="Revenue (₹)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Account status */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Account Status</h2>
          {accounts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No accounts added yet</p>
          ) : (
            <div className="space-y-3">
              {accounts.map(acc => (
                <div key={acc._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <img
                    src={acc.profilePicture || `https://api.dicebear.com/7.x/shapes/svg?seed=${acc._id}`}
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover bg-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{acc.nickname}</p>
                    <p className="text-xs text-slate-500 truncate">{acc.shopName || 'Not synced'}</p>
                  </div>
                  <Badge label={acc.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Recent Orders</h2>
          <a href="/orders" className="text-xs text-brand-600 hover:underline">View all</a>
        </div>
        <div className="divide-y divide-slate-50">
          {recentOrders.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              {accounts.some(a => a.lastSyncAt) ? 'No orders yet' : 'Sync an account to see recent orders'}
            </div>
          ) : (
            recentOrders.map(order => (
              <div key={order._id} className="flex items-center gap-4 px-5 py-3">
                <img src={order.productImage} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{order.productName}</p>
                  <p className="text-xs text-slate-500">{order.orderId} · {order.accountId?.nickname || '—'}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900">₹{order.price}</p>
                  <p className="text-xs text-slate-400">{order.orderDate ? `${formatDistanceToNow(new Date(order.orderDate))} ago` : ''}</p>
                </div>
                <Badge label={order.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
