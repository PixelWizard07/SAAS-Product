import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'
import { MOCK_ORDERS } from '../lib/mockData'

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
        return data.orders ?? data
      } catch {
        return MOCK_ORDERS.filter(o => {
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
    mutationFn: (orderId) => api.post(`/orders/${orderId}/accept`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, reason }) => api.post(`/orders/${orderId}/cancel`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useDownloadOrderLabel() {
  return useMutation({
    mutationFn: async (orderId) => {
      const { data } = await api.post(`/orders/${orderId}/label`)
      return data.labelHtml
    },
  })
}
