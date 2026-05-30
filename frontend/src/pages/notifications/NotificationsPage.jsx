import { ShoppingBag, RotateCcw, CreditCard, RefreshCw, Key, Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { useNotifications } from '../../hooks/useNotifications'

const TYPE_ICONS = {
  order: ShoppingBag, return: RotateCcw, payment: CreditCard,
  sync: RefreshCw, otp: Key, system: Bell,
}
const TYPE_COLORS = {
  order: 'bg-brand-50 text-brand-600', return: 'bg-orange-50 text-orange-500',
  payment: 'bg-green-50 text-green-600', sync: 'bg-blue-50 text-blue-600',
  otp: 'bg-yellow-50 text-yellow-600', system: 'bg-slate-100 text-slate-500',
}

export default function NotificationsPage() {
  const { notifications, isLoading, markRead, markAllRead, unreadCount } = useNotifications()

  const handleMarkAllRead = () => {
    markAllRead()
    toast.success('All marked as read')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm">{unreadCount} unread notifications</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium text-slate-700">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <RefreshCw size={18} className="animate-spin mr-2" /> Loading notifications…
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Bell size={32} className="mx-auto mb-2 opacity-30" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map(n => {
            const Icon = TYPE_ICONS[n.type] || Bell
            return (
              <div key={n._id} onClick={() => markRead(n._id)}
                className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[n.type] || TYPE_COLORS.system}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? 'font-medium text-slate-900' : 'text-slate-700'}`}>{n.message}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span>{n.createdAt ? `${formatDistanceToNow(new Date(n.createdAt))} ago` : 'Just now'}</span>
                    {n.accountId && <><span>·</span><span className="text-brand-600">{n.accountId?.nickname || n.accountId}</span></>}
                  </div>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-brand-500 rounded-full mt-2 flex-shrink-0" />}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
