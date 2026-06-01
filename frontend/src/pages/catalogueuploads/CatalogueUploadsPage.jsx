import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const mockUploads = [
  { id: 'UPL-001', fileName: 'catalog_fashion_may.xlsx', products: 45, status: 'Completed', uploadedAt: '30 May 2026' },
  { id: 'UPL-002', fileName: 'electronics_batch2.xlsx', products: 12, status: 'Completed', uploadedAt: '28 May 2026' },
  { id: 'UPL-003', fileName: 'home_decor_jun.xlsx', products: 8, status: 'Processing', uploadedAt: '01 Jun 2026' },
  { id: 'UPL-004', fileName: 'accessories_apr.xlsx', products: 3, status: 'Failed', uploadedAt: '15 Apr 2026' },
];

const statusConfig = {
  Completed: { cls: 'bg-green-100 text-green-700', label: 'Completed' },
  Processing: { cls: 'bg-blue-100 text-blue-700', label: 'Processing' },
  Failed: { cls: 'bg-red-100 text-red-700', label: 'Failed' },
};

export default function CatalogueUploadsPage() {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }
      toast.success(`File "${file.name}" uploaded! Processing in 2-4 hours.`);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) toast.success(`File "${file.name}" uploaded! Processing in 2-4 hours.`);
  };

  const stats = [
    { label: 'Total Uploads', value: 12, color: 'text-gray-800' },
    { label: 'Processing', value: 1, color: 'text-blue-600' },
    { label: 'Completed', value: 10, color: 'text-green-600' },
    { label: 'Failed', value: 1, color: 'text-red-600' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Catalog Uploads</h1>
        <div className="flex gap-2">
          <button
            onClick={() => toast.success('Template downloaded!')}
            className="px-4 py-2 border border-gray-200 bg-white text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Download Template
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition"
          >
            + New Upload
          </button>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 text-sm text-blue-800">
        Upload your catalog in bulk using our Excel template. Processing takes 2-4 hours.
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

      {/* Drop Zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 mb-6 text-center cursor-pointer transition ${
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'
        }`}
      >
        <div className="text-4xl mb-3">📁</div>
        <p className="text-gray-700 font-medium text-sm mb-1">Drag & drop Excel file here or click to browse</p>
        <p className="text-xs text-gray-400">Supports .xlsx and .xls files up to 10MB</p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
      </div>

      {/* Uploads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">Upload History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Upload ID', 'File Name', 'Products', 'Status', 'Uploaded At', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-2.5 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockUploads.map(row => (
                <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 text-indigo-600 font-medium">{row.id}</td>
                  <td className="px-5 py-3 text-gray-800">{row.fileName}</td>
                  <td className="px-5 py-3 text-gray-600">{row.products} products</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[row.status].cls}`}>
                      {row.status === 'Processing' && (
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      )}
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{row.uploadedAt}</td>
                  <td className="px-5 py-3">
                    {row.status === 'Completed' && (
                      <button
                        onClick={() => toast.success(`Downloading report for ${row.id}`)}
                        className="text-indigo-600 hover:underline text-xs font-medium"
                      >
                        Download Report
                      </button>
                    )}
                    {row.status === 'Processing' && (
                      <button
                        onClick={() => toast('Processing in progress...', { icon: '⏳' })}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        View Progress
                      </button>
                    )}
                    {row.status === 'Failed' && (
                      <button
                        onClick={() => toast.error(`Errors in ${row.id}: 2 rows failed validation`)}
                        className="text-red-600 hover:underline text-xs font-medium"
                      >
                        View Errors
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
