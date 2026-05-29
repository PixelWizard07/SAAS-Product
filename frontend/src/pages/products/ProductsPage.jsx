import { useState, useMemo } from 'react'
import { Search, LayoutGrid, List, Edit2, Check, X } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import { MOCK_PRODUCTS, MOCK_ACCOUNTS } from '../../lib/mockData'
import toast from 'react-hot-toast'

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [accountId, setAccountId] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [editing, setEditing] = useState({})

  const filtered = useMemo(() => products.filter(p => {
    if (accountId !== 'all' && p.accountId._id !== accountId) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [products, search, accountId])

  const startEdit = (id, field, value) => setEditing(e => ({ ...e, [`${id}-${field}`]: String(value) }))
  const cancelEdit = (id, field) => setEditing(e => { const n = { ...e }; delete n[`${id}-${field}`]; return n })

  const saveEdit = (id, field) => {
    const value = editing[`${id}-${field}`]
    setProducts(ps => ps.map(p => p._id === id ? { ...p, [field]: field === 'price' || field === 'stock' ? Number(value) : value } : p))
    cancelEdit(id, field)
    toast.success(`${field} updated`)
  }

  const toggleActive = (id) => {
    setProducts(ps => ps.map(p => p._id === id ? { ...p, isActive: !p.isActive } : p))
    toast.success('Status updated')
  }

  const EditableField = ({ id, field, value, prefix = '' }) => {
    const key = `${id}-${field}`
    if (editing[key] !== undefined) {
      return (
        <div className="flex items-center gap-1">
          <input value={editing[key]} onChange={e => setEditing(v => ({ ...v, [key]: e.target.value }))}
            className="w-20 px-2 py-1 border border-brand-500 rounded text-sm focus:outline-none"
            onKeyDown={e => { if (e.key === 'Enter') saveEdit(id, field); if (e.key === 'Escape') cancelEdit(id, field) }} autoFocus />
          <button onClick={() => saveEdit(id, field)} className="text-green-500 hover:text-green-600"><Check size={14} /></button>
          <button onClick={() => cancelEdit(id, field)} className="text-red-400 hover:text-red-500"><X size={14} /></button>
        </div>
      )
    }
    return (
      <button onClick={() => startEdit(id, field, value)} className="flex items-center gap-1 hover:text-brand-600 group">
        <span>{prefix}{value}</span>
        <Edit2 size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Products</h1>
          <p className="text-slate-500 text-sm">{filtered.length} products</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-100'}`}><LayoutGrid size={16} /></button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-100'}`}><List size={16} /></button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or SKU…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <select value={accountId} onChange={e => setAccountId(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="all">All Accounts</option>
          {MOCK_ACCOUNTS.map(a => <option key={a._id} value={a._id}>{a.nickname}</option>)}
        </select>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(p => (
            <div key={p._id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="relative">
                <img src={p.imageUrl} alt={p.name} className="w-full aspect-square object-cover bg-slate-100" />
                <button onClick={() => toggleActive(p._id)} className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-slate-900 line-clamp-2">{p.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{p.sku}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-slate-900"><EditableField id={p._id} field="price" value={p.price} prefix="₹" /></span>
                  <span className={`text-xs ${p.stock === 0 ? 'text-red-500' : 'text-slate-500'}`}>
                    Qty: <EditableField id={p._id} field="stock" value={p.stock} />
                  </span>
                </div>
                <p className="text-xs text-brand-600 mt-1">{p.accountId.nickname}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Product', 'SKU', 'Price', 'Stock', 'Status', 'Account'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <img src={p.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100" />
                    <span className="font-medium text-slate-900">{p.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900"><EditableField id={p._id} field="price" value={p.price} prefix="₹" /></td>
                  <td className="px-4 py-3"><EditableField id={p._id} field="stock" value={p.stock} /></td>
                  <td className="px-4 py-3"><button onClick={() => toggleActive(p._id)}><Badge label={p.isActive ? 'active' : 'inactive'} /></button></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.accountId.nickname}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
