import { Bell, ChevronDown, Sun, Moon, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useAccount } from '../../contexts/AccountContext'
import { MOCK_ACCOUNTS, MOCK_NOTIFICATIONS, MOCK_STATS } from '../../lib/mockData'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function TopBar({ darkMode, toggleDark }) {
  const { user, logout } = useAuth()
  const { selectedAccountId, setSelectedAccountId } = useAccount()
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()
  const unread = MOCK_NOTIFICATIONS.filter(n => !n.isRead).length
  const selectedAccount = MOCK_ACCOUNTS.find(a => a._id === selectedAccountId)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    toast.success('Logged out')
  }

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 gap-4 sticky top-0 z-30">
      {/* Quick Stats */}
      <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="font-semibold text-slate-900">{MOCK_STATS.todayOrders}</span> orders today</span>
        <span className="w-px h-4 bg-slate-200" />
        <span className="flex items-center gap-1"><span className="font-semibold text-slate-900">{MOCK_STATS.pendingReturns}</span> pending returns</span>
        <span className="w-px h-4 bg-slate-200" />
        <span className="flex items-center gap-1"><span className="font-semibold text-green-600">{MOCK_STATS.activeOtps}</span> active OTPs</span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Account Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowAccountMenu(s => !s)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm"
          >
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-slate-700 font-medium">{selectedAccount?.nickname || 'All Accounts'}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {showAccountMenu && (
            <div className="absolute right-0 top-10 bg-white rounded-xl border border-slate-100 shadow-lg z-50 min-w-48 py-1">
              <button onClick={() => { setSelectedAccountId('all'); setShowAccountMenu(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 font-medium text-slate-900">All Accounts</button>
              {MOCK_ACCOUNTS.map(a => (
                <button key={a._id} onClick={() => { setSelectedAccountId(a._id); setShowAccountMenu(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${a.status === 'active' ? 'bg-green-400' : 'bg-slate-300'}`} />
                  <span>{a.nickname}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark mode */}
        <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button onClick={() => navigate('/notifications')} className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <Bell size={18} />
          {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">{unread}</span>}
        </button>

        {/* User menu */}
        <div className="relative">
          <button onClick={() => setShowUserMenu(s => !s)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100">
            <div className="w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-10 bg-white rounded-xl border border-slate-100 shadow-lg z-50 min-w-40 py-1">
              <p className="px-4 py-2 text-xs text-slate-500">{user?.email}</p>
              <hr className="border-slate-100" />
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-red-600 flex items-center gap-2"><LogOut size={14} /> Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
