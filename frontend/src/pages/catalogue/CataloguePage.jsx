import { useState } from 'react'
import { Search, Grid, RefreshCw } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import { useProducts } from '../../hooks/useProducts'
import { useAccounts } from '../../hooks/useAccounts'

const TABS = [
  { key: 'all', label: 'All Products' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'pending', label: 'Pending Review' },
  { key: 'rejected', label: 'Rejected' },
]

export default function CataloguePage() {
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [accountId, setAccountId] = useState('all')

  const { accounts } = useAccounts()
  const { data: products = [], isLoading } = useProducts({ accountId, search })

  const filtered = products.filter(p => {
    if (tab === 'active') return p.isActive && p.stock > 0
    if (tab === 'inactive') return !p.isActive || p.stock === 0
    if (tab === 'pending') return false // placeholder
    if (tab === 'rejected') return false // placeholder
    return true
  })

  const tabCount = (key) => {
    if (key === 'active') return products.filter(p => p.isActive && p.stock > 0).length
    if (key === 'inactive') return products.filter(p => !p.isActive || p.stock === 0).length
    if (key === 'all') return products.length
    return 0
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Grid size={20} /> Catalogue
        </h1>
        <p className="text-slate-500 text-sm">Manage your product listings across all accounts</p>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-slate-200">
        <div className="flex gap-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              {tabCount(t.key) > 0 && (
                <span className="ml-2 bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                  {tabCount(t.key)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">All Accounts</option>
          {accounts.map(a => <option key={a._id} value={a._id}>{a.nickname}</option>)}
        </select>
      </div>

      {/* Products Grid */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading catalogue…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Grid size={32} className="mx-auto mb-3 opacity-40" />
            <p>No products in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
            {filtered.map(product => (
              <div key={product._id} className="border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full aspect-square object-cover bg-slate-50"
                />
                <div className="p-3">
                  <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-tight">{product.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{product.sku}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold text-slate-900 text-sm">₹{product.price}</span>
                    <Badge label={product.isActive && product.stock > 0 ? 'Active' : 'Inactive'} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Stock: {product.stock}</p>
                  <p className="text-xs text-slate-400">{product.accountId?.nickname}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
