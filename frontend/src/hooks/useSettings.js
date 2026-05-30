import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/settings')
        return data
      } catch {
        return { syncIntervalMinutes: 15, labelGenerationTime: '09:00', autoLabelEnabled: false, autoSyncEnabled: true, timezone: 'Asia/Kolkata' }
      }
    }
  })
}

export const useUpdateSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.put('/settings', data).then(r => r.data),
    onSuccess: (data) => qc.setQueryData(['settings'], data),
  })
}
