import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'
import { MOCK_ORDERS } from '../lib/mockData'

const LS_KEY = 'meeshohub_orders'

const getLocalOrders = () => {
  try {
    const data = localStorage.getItem(LS_KEY)
    return data ? JSON.parse(data) : MOCK_ORDERS
  } catch {
    return MOCK_ORDERS
  }
}

export function useOrders({ accountId = 'all', status, search = '' } = {}) {
  return useQuery({
    queryKey: ['orders', accountId, status, search],
    queryFn: async () => {
      try {
        const params = { limit: 100 }
        if (accountId && accountId !== 'all') params.accountId = accountId
        if (status && status !== 'All') params.status = status
        if (search) params.search = search
        const { data } = await api.get('/orders', { params })
        const orders = data.orders ?? data
        // Cache to localStorage so demo mode reflects synced data
        if (Array.isArray(orders) && orders.length > 0 && !search && !status) {
          try { localStorage.setItem(LS_KEY, JSON.stringify(orders)) } catch {}
        }
        return orders
      } catch {
        return getLocalOrders().filter(o => {
          const accId = o.accountId?._id || o.accountId
          if (accountId !== 'all' && accId !== accountId) return false
          if (status && status !== 'All' && o.status !== status) return false
          if (search && !o.orderId?.toLowerCase().includes(search.toLowerCase()) &&
              !o.productName?.toLowerCase().includes(search.toLowerCase())) return false
          return true
        })
      }
    },
    refetchInterval: 30000,
  })
}

export function useAcceptOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (orderId) => {
      try {
        return await api.post(`/orders/${orderId}/accept`)
      } catch {
        // Demo: optimistically update local
        const orders = getLocalOrders()
        const updated = orders.map(o => o._id === orderId ? { ...o, status: 'Ready to Ship' } : o)
        localStorage.setItem(LS_KEY, JSON.stringify(updated))
        return { data: {} }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, reason }) => {
      try {
        return await api.post(`/orders/${orderId}/cancel`, { reason })
      } catch {
        const orders = getLocalOrders()
        const updated = orders.map(o => o._id === orderId ? { ...o, status: 'Cancelled' } : o)
        localStorage.setItem(LS_KEY, JSON.stringify(updated))
        return { data: {} }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useDownloadOrderLabel() {
  return useMutation({
    mutationFn: async (orderId) => {
      try {
        const { data } = await api.post(`/orders/${orderId}/label`)
        return data.labelHtml
      } catch {
        const orders = getLocalOrders()
        const order = orders.find(o => o._id === orderId)
        // Generate a simple label HTML for demo mode
        return `<!DOCTYPE html><html><head><title>Shipping Label</title><style>
          body{font-family:Arial,sans-serif;margin:0;padding:20px}
          .label{border:2px solid #000;padding:20px;max-width:400px;margin:0 auto}
          h2{color:#6366F1;margin:0 0 12px} .row{margin:6px 0;font-size:14px}
          .badge{background:#D1FAE5;border:1px solid #6EE7B7;padding:4px 12px;font-weight:bold;display:inline-block;margin-top:8px}
        </style></head><body><div class="label">
          <h2>MeeshoHub — Shipping Label</h2>
          <div class="row"><strong>Order ID:</strong> ${order?.orderId || orderId}</div>
          <div class="row"><strong>Sub-Order:</strong> ${order?.subOrderId || '-'}</div>
          <div class="row"><strong>Ship To:</strong> ${order?.buyerName || 'Customer'}</div>
          <div class="row"><strong>Product:</strong> ${order?.productName || '-'}</div>
          <div class="row"><strong>Qty:</strong> ${order?.quantity || 1}</div>
          <div class="row"><strong>SKU:</strong> ${order?.sku || '-'}</div>
          <div class="badge">${order?.paymentMode === 'COD' ? 'COD: ₹' + (order?.price || 0) : 'PREPAID'}</div>
        </div></body></html>`
      }
    },
  })
}
