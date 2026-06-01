import { useState } from 'react';
import toast from 'react-hot-toast';

const mockClaims = [
  { id: 'CLM-001', orderId: 'MH-2024-003', product: 'Decorative Lamp', type: 'Wrong Product', amount: 899, status: 'Pending', raisedOn: '28 May 2026' },
  { id: 'CLM-002', orderId: 'MH-2024-005', product: 'Smart Watch', type: 'Damaged', amount: 2499, status: 'Approved', raisedOn: '25 May 2026' },
  { id: 'CLM-003', orderId: 'MH-2024-001', product: 'Floral Kurti', type: 'Not Delivered', amount: 549, status: 'Pending', raisedOn: '22 May 2026' },
  { id: 'CLM-004', orderId: 'MH-2024-002', product: 'Earbuds Pro', type: 'Quality Issue', amount: 1299, status: 'Rejected', raisedOn: '20 May 2026' },
  { id: 'CLM-005', orderId: 'MH-2024-006', product: 'Bedsheet', type: 'Missing Item', amount: 1199, status: 'Pending', raisedOn: '18 May 2026' },
];

const statusStyles = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

const claimTypes = ['Wrong Product', 'Damaged', 'Not Delivered', 'Quality Issue', 'Missing Item', 'Other'];

export default function ClaimsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ orderId: '', type: '', description: '', amount: '', evidence: null });

  const tabs = [
    { label: 'All', count: mockClaims.length },
    { label: 'Pending', count: mockClaims.filter(c => c.status === 'Pending').length },
    { label: 'Approved', count: mockClaims.filter(c => c.status === 'Approved').length },
    { label: 'Rejected', count: mockClaims.filter(c => c.status === 'Rejected').length },
  ];

  const filtered = activeTab === 'All' ? mockClaims : mockClaims.filter(c => c.status === activeTab);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.orderId || !form.type) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Claim raised successfully!');
    setShowModal(false);
    setForm({ orderId: '', type: '', description: '', amount: '', evidence: null });
  };

  const stats = [
    { label: 'Total Claims', value: 8, color: 'text-gray-800' },
    { label: 'Approved', value: 3, color: 'text-green-600' },
    { label: 'Pending', value: 4, color: 'text-amber-600' },
    { label: 'Rejected', value: 1, color: 'text-red-600' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Claims</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition"
        >
          + Raise New Claim
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map(tab => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`px-5 py-3 text-sm font-medium transition ${
                activeTab === tab.label
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Claim ID', 'Order ID', 'Product', 'Claim Type', 'Amount', 'Status', 'Raised On', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(claim => (
                <tr key={claim.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-indigo-600 font-medium">{claim.id}</td>
                  <td className="px-4 py-3 text-gray-600">{claim.orderId}</td>
                  <td className="px-4 py-3 text-gray-800">{claim.product}</td>
                  <td className="px-4 py-3 text-gray-600">{claim.type}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">₹{claim.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[claim.status]}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{claim.raisedOn}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toast.success(`Viewing ${claim.id}`)}
                      className="text-indigo-600 hover:underline text-xs font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Raise New Claim</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order ID *</label>
                <input
                  type="text"
                  placeholder="e.g. MH-2024-007"
                  value={form.orderId}
                  onChange={e => setForm(p => ({ ...p, orderId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Claim Type *</label>
                <select
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">Select claim type</option>
                  {claimTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the issue..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Claim Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Evidence</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => setForm(p => ({ ...p, evidence: e.target.files[0] }))}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition">
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
