import { useState } from 'react';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';

const initialProducts = [
  { id: 1, name: 'Floral Kurti Set', sku: 'SKU-001', currentPrice: 549 },
  { id: 2, name: 'Wireless Earbuds Pro', sku: 'SKU-002', currentPrice: 1299 },
  { id: 3, name: 'Decorative Lamp', sku: 'SKU-003', currentPrice: 899 },
  { id: 4, name: 'Smart Watch', sku: 'SKU-004', currentPrice: 2499 },
];

const priceHistory = [
  { product: 'Floral Kurti Set', oldPrice: 499, newPrice: 549, changedBy: 'You', date: '28 May 2026' },
  { product: 'Wireless Earbuds Pro', oldPrice: 1199, newPrice: 1299, changedBy: 'You', date: '25 May 2026' },
  { product: 'Smart Watch', oldPrice: 2299, newPrice: 2499, changedBy: 'You', date: '20 May 2026' },
];

export default function PricingPage() {
  const [search, setSearch] = useState('');
  const [prices, setPrices] = useState(
    Object.fromEntries(initialProducts.map(p => [p.id, p.currentPrice]))
  );

  const filtered = initialProducts.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdate = (product) => {
    toast.success(`Price updated for ${product.name} to ₹${prices[product.id]}`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Pricing</h1>
        <a
          href="https://youtube.com"
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-red-600 hover:underline flex items-center gap-1"
        >
          ▶ How it works?
        </a>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 text-sm text-blue-800">
        Meesho sets the selling price for all products. You just need to set your price (cost price) and Meesho will handle the rest.
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left: Set Your Price */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-700">Set Your Price</h2>
          </div>
          <div className="p-5">
            {/* Search */}
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by SKU ID or Product Name"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Product</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Current Price</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Your Price</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(product => (
                    <tr key={product.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-800">{product.name}</div>
                        <div className="text-xs text-gray-400">{product.sku}</div>
                      </td>
                      <td className="px-3 py-3 text-gray-700">₹{product.currentPrice}</td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={prices[product.id]}
                          onChange={e =>
                            setPrices(prev => ({ ...prev, [product.id]: Number(e.target.value) }))
                          }
                          className="w-24 px-2 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => handleUpdate(product)}
                          className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs rounded-md transition"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Price Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-700">Price Health</h2>
          </div>
          <div className="p-5">
            {/* Competitive Score */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Competitive Score</span>
                <span className="text-sm font-semibold text-green-600">87/100</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full" style={{ width: '87%' }} />
              </div>
            </div>

            {/* Metrics */}
            {[
              { label: 'Products at Market Price', value: 65, color: 'bg-green-400' },
              { label: 'Products Overpriced', value: 20, color: 'bg-amber-400' },
              { label: 'Products Underpriced', value: 15, color: 'bg-blue-400' },
            ].map(metric => (
              <div key={metric.label} className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">{metric.label}</span>
                  <span className="text-xs font-semibold text-gray-700">{metric.value}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${metric.color} rounded-full`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Price History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">Price History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Product', 'Old Price', 'New Price', 'Changed By', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-2.5 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {priceHistory.map((row, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-800">{row.product}</td>
                  <td className="px-5 py-3 text-gray-500 line-through">₹{row.oldPrice}</td>
                  <td className="px-5 py-3 text-gray-800 font-medium">₹{row.newPrice}</td>
                  <td className="px-5 py-3 text-gray-600">{row.changedBy}</td>
                  <td className="px-5 py-3 text-gray-500">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
