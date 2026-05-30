import { useState } from 'react'
import { Search, Upload, Youtube, ChevronDown, Info, Pencil, MoreVertical, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAccounts } from '../../hooks/useAccounts'

const MOCK_CATALOGS = [
  {
    id: 'cat1', catalogId: '83482742', name: 'Trimmers', category: 'Trimmers', orders30d: 1, rating: 4.1,
    skus: [{ id: 'sku1', styleId: 'BABY NAIL TRIMM...', sku: 'BABY NAIL TRIMMER-2', name: 'KRUPASADHYA Baby Electric Nail Trimmer for Baby Nail Cutter for New Born Baby with 6 Grinding Heads', variation: 'Free Size', estOrderPerDay: 1, daysToStockout: 275, stock: 275, price: 309 }]
  },
  {
    id: 'cat2', catalogId: '82084232', name: 'Wonderful Feather Dusters', category: 'Brushes', orders30d: 5, rating: 3.8,
    skus: [{ id: 'sku2', styleId: 'FEATHER-DUSTER-1', sku: 'FEATHER-DUSTER-001', name: 'Wonderful Feather Duster Cleaning Brush', variation: 'Standard', estOrderPerDay: 2, daysToStockout: 45, stock: 90, price: 149 }]
  },
  {
    id: 'cat3', catalogId: '81924319', name: 'New Washing Maching Cover', category: 'Washing Maching Cover', orders30d: 3, rating: 4.2,
    skus: [{ id: 'sku3', styleId: 'WMCOVER-NEW-1', sku: 'WM-COVER-NEW-001', name: 'New Universal Washing Machine Cover Dust Proof', variation: 'Free Size', estOrderPerDay: 1, daysToStockout: 120, stock: 120, price: 199 }]
  },
  {
    id: 'cat4', catalogId: '81924059', name: 'Wonderful Washing Maching Cover', category: 'Washing Maching Cover', orders30d: 7, rating: 4.0,
    skus: [{ id: 'sku4', styleId: 'WMCOVER-WON-1', sku: 'WM-COVER-WON-001', name: 'Wonderful Washing Machine Cover Premium Quality', variation: 'Free Size', estOrderPerDay: 3, daysToStockout: 60, stock: 180, price: 249 }]
  },
  {
    id: 'cat5', catalogId: '80935740', name: 'Classy Tile Stickers', category: 'Tile Stickers', orders30d: 12, rating: 4.5,
    skus: [{ id: 'sku5', styleId: 'TILE-STICKER-1', sku: 'TILE-STICK-001', name: 'Classy Decorative Tile Stickers Waterproof Kitchen Bathroom', variation: 'Multicolor', estOrderPerDay: 5, daysToStockout: 30, stock: 150, price: 299 }]
  },
]

const MAIN_TABS = [
  { key: 'active', label: 'Active', count: 908 },
  { key: 'activation_pending', label: 'Activation Pending', count: 8 },
  { key: 'blocked', label: 'Blocked', count: 247 },
  { key: 'paused', label: 'Paused', count: 963 },
]

const SUB_TABS = [
  { key: 'all', label: 'All Stock', count: 908 },
  { key: 'out_of_stock', label: 'Out of Stock', count: 0 },
  { key: 'low_stock', label: 'Low Stock', count: 0 },
]

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('active')
  const [subTab, setSubTab] = useState('all')
  const [selectedCatalog, setSelectedCatalog] = useState(MOCK_CATALOGS[0])
  const [editingStock, setEditingStock] = useState({})
  const [stockValues, setStockValues] = useState(
    Object.fromEntries(MOCK_CATALOGS.flatMap(c => c.skus.map(s => [s.id, s.stock])))
  )
  const [search, setSearch] = useState('')

  const { accounts } = useAccounts()

  const startEditStock = (skuId) => {
    setEditingStock(e => ({ ...e, [skuId]: true }))
  }

  const saveStock = (skuId) => {
    setEditingStock(e => { const n = { ...e }; delete n[skuId]; return n })
    toast.success('Stock updated successfully')
  }

  const cancelEditStock = (skuId, originalStock) => {
    setStockValues(v => ({ ...v, [skuId]: originalStock }))
    setEditingStock(e => { const n = { ...e }; delete n[skuId]; return n })
  }

  return (
    <div className="flex flex-col min-h-0 -m-6">
      {/* Instant Cash Promo Banner */}
      <div className="bg-green-50 border-b border-green-100 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-green-800">Meesho Instant Cash</span>
          </div>
          <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded-full">Limited time offer</span>
          <span className="text-sm text-slate-700">
            Apply today, get loan tomorrow! Interest rates starting from just{' '}
            <span className="line-through text-slate-400">16%</span>{' '}
            <span className="text-green-700 font-bold">10%</span>!
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">Get cash and unlock special benefits</span>
          <button className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap">
            Check Offer Now →
          </button>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4 flex-1 overflow-auto">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-xl font-semibold text-slate-900">Inventory</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-red-600 cursor-pointer hover:text-red-700">
              <Youtube size={16} className="text-red-600" />
              <span>How it Works?</span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by Catalog ID/Style ID/SKU ID"
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {/* Account selector */}
            <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="all">All Accounts</option>
              {accounts.map(a => <option key={a._id} value={a._id}>{a.nickname}</option>)}
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              <Upload size={14} />
              + Catalog Upload
            </button>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex gap-0">
            {MAIN_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  activeTab === tab.key
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex gap-4 border-b border-slate-100 pb-0">
          {SUB_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={`flex items-center gap-1.5 pb-2 text-sm font-medium border-b-2 transition-colors ${
                subTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                subTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 font-medium">Filter by:</span>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Select Category
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Sort catalogs by:</span>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Highest Estimated Orders
              <ChevronDown size={14} />
            </button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Bulk Stock Update
            </button>
          </div>
        </div>

        {/* Two-Panel Layout */}
        <div className="flex gap-0 border border-slate-200 rounded-xl overflow-hidden bg-white" style={{ minHeight: '500px' }}>
          {/* Left Panel — Catalog List */}
          <div className="w-[35%] border-r border-slate-200 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <span className="text-sm font-semibold text-slate-700">
                Catalog: {SUB_TABS.find(t => t.key === subTab)?.label}
              </span>
            </div>
            <div className="overflow-y-auto flex-1">
              {MOCK_CATALOGS.map(catalog => (
                <button
                  key={catalog.id}
                  onClick={() => setSelectedCatalog(catalog)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    selectedCatalog.id === catalog.id
                      ? 'border-l-4 border-l-indigo-500 bg-indigo-50/30'
                      : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnails */}
                    <div className="flex gap-1 shrink-0">
                      <div className="w-10 h-10 bg-slate-200 rounded-md overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400" />
                      </div>
                      <div className="w-10 h-10 bg-slate-200 rounded-md overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{catalog.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Catalog ID: {catalog.catalogId}</p>
                      <p className="text-xs text-slate-500">Category: {catalog.category}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel — SKU Detail */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Right Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <span className="text-sm font-bold text-slate-900">{selectedCatalog.name}</span>
                  <span className="ml-3 text-xs text-slate-500">
                    Catalog ID: {selectedCatalog.catalogId} &nbsp; Category: {selectedCatalog.category}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-500">{selectedCatalog.orders30d} Orders in last 30 days</span>
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-500 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-50 transition-colors">
                  <Zap size={12} />
                  Boost Orders
                </button>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {selectedCatalog.rating} ★
                </span>
              </div>
            </div>

            {/* SKU Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 w-8">
                      <input type="checkbox" className="rounded border-slate-300" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Variation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Est. Order Per Day
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        Days to Stockout
                        <Info size={12} className="text-slate-400" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {selectedCatalog.skus.map(sku => {
                    const isEditing = editingStock[sku.id]
                    const currentStock = stockValues[sku.id] ?? sku.stock
                    return (
                      <tr key={sku.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4">
                          <input type="checkbox" className="rounded border-slate-300" />
                        </td>
                        <td className="px-4 py-4 max-w-xs">
                          <p className="text-sm font-medium text-slate-800 line-clamp-2">{sku.name}</p>
                          <p className="text-xs text-slate-500 mt-1">Style ID: {sku.styleId}</p>
                          <p className="text-xs text-slate-500">SKU: {sku.sku}</p>
                          <p className="text-xs text-slate-600 mt-1">Meesho Price: ₹{sku.price}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">{sku.variation}</td>
                        <td className="px-4 py-4 text-sm text-slate-700 text-center">{sku.estOrderPerDay}</td>
                        <td className="px-4 py-4 text-sm text-slate-700 text-center">{sku.daysToStockout}</td>
                        <td className="px-4 py-4">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={currentStock}
                                onChange={e => setStockValues(v => ({ ...v, [sku.id]: Number(e.target.value) }))}
                                className="w-20 px-2 py-1 border border-indigo-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveStock(sku.id)
                                  if (e.key === 'Escape') cancelEditStock(sku.id, sku.stock)
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => saveStock(sku.id)}
                                className="text-xs text-white bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-700"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-800">{currentStock}</span>
                              <button
                                onClick={() => startEditStock(sku.id)}
                                className="text-slate-400 hover:text-indigo-600 transition-colors"
                              >
                                <Pencil size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditStock(sku.id)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button className="text-slate-400 hover:text-slate-600 transition-colors" title="More">
                              <MoreVertical size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
