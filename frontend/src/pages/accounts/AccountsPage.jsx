import { useState } from 'react'
import { Plus, RefreshCw, Trash2, Edit2, Wifi, WifiOff } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { MOCK_ACCOUNTS } from '../../lib/mockData'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState(MOCK_ACCOUNTS)
  const [showAdd, setShowAdd] = useState(false)
  const [syncing, setSyncing] = useState({})
  const [form, setForm] = useState({ nickname: '', phone: '', password: '' })

  const handleSync = async (id) => {
    setSyncing(s => ({ ...s, [id]: true }))
    toast.promise(new Promise(r => setTimeout(r, 2000)), {
      loading: 'Syncing account…',
      success: 'Sync started in background',
      error: 'Sync failed',
    })
    setTimeout(() => setSyncing(s => ({ ...s, [id]: false })), 2000)
  }

  const handleAdd = (e) => {
    e.preventDefault()
    const newAcc = {
      _id: `acc${Date.now()}`,
      nickname: form.nickname,
      phone: form.phone,
      shopName: 'Fetching…',
      profilePicture: `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}`,
      status: 'inactive',
      lastSyncAt: null,
    }
    setAccounts(a => [...a, newAcc])
    setShowAdd(false)
    setForm({ nickname: '', phone: '', password: '' })
    toast.success('Account added! Sync to fetch data.')
  }

  const handleDelete = (id) => {
    setAccounts(a => a.filter(acc => acc._id !== id))
    toast.success('Account removed')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Meesho Accounts</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your connected Meesho seller accounts</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> Add Account
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map(acc => (
          <div key={acc._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <img src={acc.profilePicture} alt="" className="w-14 h-14 rounded-xl object-cover bg-slate-100" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 truncate">{acc.nickname}</h3>
                  <Badge label={acc.status} />
                </div>
                <p className="text-sm text-slate-500 truncate">{acc.shopName}</p>
                <p className="text-xs text-slate-400 mt-1">{acc.phone}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {acc.lastSyncAt ? `Synced ${formatDistanceToNow(new Date(acc.lastSyncAt))} ago` : 'Never synced'}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => handleSync(acc._id)} disabled={syncing[acc._id]}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 disabled:opacity-50">
                  <RefreshCw size={15} className={syncing[acc._id] ? 'animate-spin' : ''} />
                </button>
                <button onClick={() => handleDelete(acc._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Meesho Account">
        <form onSubmit={handleAdd} className="space-y-4">
          {[
            { key: 'nickname', label: 'Account Nickname', type: 'text', placeholder: 'e.g. Fashion Store' },
            { key: 'phone', label: 'Meesho Mobile / Email', type: 'text', placeholder: '9876543210 or email@example.com' },
            { key: 'password', label: 'Meesho Password', type: 'password', placeholder: '••••••••' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input type={type} required value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder={placeholder} />
            </div>
          ))}
          <div className="p-3 bg-yellow-50 rounded-xl text-xs text-yellow-700">
            Your credentials are encrypted with AES-256 before storage. We never share or log your Meesho password.
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium">Add Account</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
