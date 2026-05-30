import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'
import { MOCK_LABELS } from '../lib/mockData'

export const useLabels = (status) => {
  return useQuery({
    queryKey: ['labels', status],
    queryFn: async () => {
      try {
        const params = status ? { status } : {}
        const { data } = await api.get('/labels', { params })
        return data
      } catch {
        return MOCK_LABELS?.filter(l => !status || l.status === status) || []
      }
    }
  })
}

export const useGenerateLabel = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderId) => api.post(`/labels/generate/${orderId}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labels'] }),
  })
}

export const useGenerateBulk = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderIds) => api.post('/labels/generate-bulk', { orderIds }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labels'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useRetryLabel = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.put(`/labels/${id}/retry`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labels'] }),
  })
}
