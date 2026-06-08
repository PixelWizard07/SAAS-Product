import { useState } from 'react'
import { Plus, RefreshCw, Trash2, ShoppingBag, Database, Wifi, WifiOff } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { formatDistanceToNow } from 'date-fns'
import { useAccounts } from '../../hooks/useAccounts'

export default function AccountsPage() {
  const {
    accounts, isLoading,
    addAccount, isAdding,
    deleteAccount,
    syncAccount, isSyncing, syncingId,
    seedAccount, isSeeding, seedingId,
  } = useAccounts()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ nickname: '', phone: '', password: '' })

  const handleAdd = (e) => {
    e.preventDefault()
    addAccount(form, {
      onSuccess: () => {
        setShowAdd(false)
        setForm({ nickname: '', phone: '', password: '' })
      },
    })
  }

  const statusColor = {
    active: 'text-green-600 bg-green-50',
    syncing: 'text-blue-600 bg-blue-50',
    error: 'text-red-600 bg-red-50',
    inactive: 'text-slate-500 bg-slate-100',
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

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex gap-3">
        <Wifi size={18} className="shrink-0 mt-0.5 text-blue-500" />
        <div>
          <span className="font-semibold">How it works: </span>
          Add your Meesho seller account (phone + password), then click
          <span className="font-semibold"> Sync from Meesho</span> to scrape live data from supplier.meesho.com.
          Or click <span className="font-semibold">Load Demo Data</span> to instantly populate with sample orders, returns, products, and payments.
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-slate-600">No accounts yet</p>
          <p className="text-sm mt-1 mb-6">Add your first Meesho seller account to get started</p>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <Plus size={16} /> Add First Account
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map(acc => {
            const syncing = isSyncing && syncingId === acc._id
            const seeding = isSeeding && seedingId === acc._id
            return (
              <div key={acc._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <img
                    src={acc.profilePicture || `https://api.dicebear.com/7.x/shapes/svg?seed=${acc._id}`}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 truncate">{acc.nickname}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[acc.status] || statusColor.inactive}`}>
                        {acc.status === 'syncing' ? '⟳ Syncing…' : acc.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{acc.shopName || 'Sync to fetch shop details'}</p>
                    <p className="text-xs text-slate-400 mt-1">📱 {acc.phone}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50">
                  <p className="text-xs text-slate-400 mb-3">
                    {acc.lastSyncAt
                      ? `Last synced ${formatDistanceToNow(new Date(acc.lastSyncAt))} ago`
                      : 'Never synced'}
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {/* Sync from Meesho (real scraping) */}
                    <button
                      onClick={() => syncAccount(acc._id)}
                      disabled={syncing || seeding}
                      title="Scrape live data from supplier.meesho.com"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                      {syncing ? 'Syncing…' : 'Sync from Meesho'}
                    </button>

                    {/* Load Demo Data (seed) */}
                    <button
                      onClick={() => seedAccount(acc._id)}
                      disabled={syncing || seeding}
                      title="Load sample orders, returns, products & payments into database"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <Database size={13} className={seeding ? 'animate-pulse' : ''} />
                      {seeding ? 'Loading…' : 'Load Demo Data'}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => window.confirm('Remove this account and all its data?') && deleteAccount(acc._id)}
                      disabled={syncing || seeding}
                      title="Remove account"
                      className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {acc.status === 'error' && (
                    <p className="mt-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-1.5">
                      ⚠ Last sync failed — check your Meesho credentials and try again
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Meesho Account">
        <form onSubmit={handleAdd} className="space-y-4">
          {[
            { key: 'nickname', label: 'Account Nickname', type: 'text', placeholder: 'e.g. Fashion Store' },
            { key: 'phone', label: 'Meesho Mobile Number / Email', type: 'text', placeholder: '9876543210 or email@example.com' },
            { key: 'password', label: 'Meesho Password', type: 'password', placeholder: '••••••••' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                type={type} required value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder={placeholder}
              />
            </div>
          ))}
          <div className="p-3 bg-yellow-50 rounded-xl text-xs text-yellow-800 space-y-1">
            <p>🔒 Your password is encrypted with AES-256 before storage. We never share or log your Meesho password.</p>
            <p>📡 After adding, use <strong>Sync from Meesho</strong> to scrape live data, or <strong>Load Demo Data</strong> to populate with sample data.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isAdding} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
              {isAdding ? 'Adding…' : 'Add Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
