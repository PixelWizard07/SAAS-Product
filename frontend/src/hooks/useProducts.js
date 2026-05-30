import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import { MOCK_PRODUCTS } from '../lib/mockData'

export function useProducts({ accountId = 'all', search = '' } = {}) {
  return useQuery({
    queryKey: ['products', accountId, search],
    queryFn: async () => {
      try {
        const params = {}
        if (accountId && accountId !== 'all') params.accountId = accountId
        if (search) params.search = search
        const { data } = await api.get('/products', { params })
        return data.products ?? data
      } catch {
        return MOCK_PRODUCTS.filter(p => {
          const accId = p.accountId?._id || p.accountId
          if (accountId !== 'all' && accId !== accountId) return false
          if (search && !p.name?.toLowerCase().includes(search.toLowerCase()) &&
              !p.sku?.toLowerCase().includes(search.toLowerCase())) return false
          return true
        })
      }
    },
  })
}
