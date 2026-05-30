import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import { MOCK_ORDERS } from '../lib/mockData'

export function useOrders({ accountId = 'all', status = 'All', search = '' } = {}) {
  return useQuery({
    queryKey: ['orders', accountId, status, search],
    queryFn: async () => {
      try {
        const params = {}
        if (accountId && accountId !== 'all') params.accountId = accountId
        if (status && status !== 'All') params.status = status
        if (search) params.search = search
        const { data } = await api.get('/orders', { params })
        return data.orders ?? data
      } catch {
        // Fallback to mock data
        return MOCK_ORDERS.filter(o => {
          const accId = o.accountId?._id || o.accountId
          if (accountId !== 'all' && accId !== accountId) return false
          if (status !== 'All' && o.status !== status) return false
          if (search && !o.orderId?.toLowerCase().includes(search.toLowerCase()) &&
              !o.productName?.toLowerCase().includes(search.toLowerCase())) return false
          return true
        })
      }
    },
  })
}
