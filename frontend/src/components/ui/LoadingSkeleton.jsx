export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-slate-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-1/2" />
          <div className="h-6 bg-slate-200 rounded w-1/3" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array(5).fill(0).map((_, i) => (
        <td key={i} className="px-4 py-3"><div className="h-4 bg-slate-200 rounded" /></td>
      ))}
    </tr>
  )
}
