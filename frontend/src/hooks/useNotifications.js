import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'
import { MOCK_NOTIFICATIONS } from '../lib/mockData'

export function useNotifications() {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/notifications')
        return data.notifications ?? data
      } catch {
        return MOCK_NOTIFICATIONS
      }
    },
  })

  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      try {
        await api.patch(`/notifications/${id}/read`)
      } catch {
        // Optimistic update already applied via onMutate
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const prev = queryClient.getQueryData(['notifications'])
      queryClient.setQueryData(['notifications'], old =>
        (old || []).map(n => n._id === id ? { ...n, isRead: true } : n)
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['notifications'], ctx.prev)
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.patch('/notifications/read-all')
      } catch {}
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const prev = queryClient.getQueryData(['notifications'])
      queryClient.setQueryData(['notifications'], old =>
        (old || []).map(n => ({ ...n, isRead: true }))
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['notifications'], ctx.prev)
    },
  })

  return {
    notifications,
    isLoading,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    unreadCount: notifications.filter(n => !n.isRead).length,
  }
}
