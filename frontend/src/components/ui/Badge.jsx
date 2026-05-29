const variants = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Shipped: 'bg-indigo-100 text-indigo-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
  Initiated: 'bg-yellow-100 text-yellow-700',
  'Pickup Scheduled': 'bg-blue-100 text-blue-700',
  'Picked Up': 'bg-indigo-100 text-indigo-700',
  Refunded: 'bg-green-100 text-green-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  syncing: 'bg-blue-100 text-blue-700',
  error: 'bg-red-100 text-red-700',
  credit: 'bg-green-100 text-green-700',
  debit: 'bg-red-100 text-red-700',
}

export default function Badge({ label, className = '' }) {
  const cls = variants[label] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}>
      {label}
    </span>
  )
}
