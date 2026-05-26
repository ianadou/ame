export type NotifVariant = 'info' | 'success' | 'warning' | 'danger'

export interface NotifItem {
  id: number
  variant: NotifVariant
  title: string
  message?: string
  createdAt: number
  toastVisible: boolean // affiché en toast
  handled: boolean // pris en charge depuis la cloche
}

let seq = 0

export interface NotifOpts {
  toast?: boolean
  duration?: number
}

export function useNotifications() {
  const items = useState<NotifItem[]>('notifications', () => [])

  const pending = computed(() => items.value.filter((n) => !n.handled))
  const toasts = computed(() => items.value.filter((n) => n.toastVisible && !n.handled))
  const pendingCount = computed(() => pending.value.length)

  function notify(
    variant: NotifVariant,
    title: string,
    message?: string,
    options: NotifOpts = {},
  ): number {
    const { toast = true, duration = 0 } = options
    const id = ++seq + Date.now()
    // Évite les doublons exacts non traités (ex. re-render de page)
    const dup = items.value.find((n) => !n.handled && n.title === title && n.message === message)
    if (dup) return dup.id
    items.value.push({
      id,
      variant,
      title,
      message,
      createdAt: Date.now(),
      toastVisible: toast,
      handled: false,
    })
    if (toast && duration > 0) setTimeout(() => hideToast(id), duration)
    return id
  }

  function hideToast(id: number) {
    const n = items.value.find((i) => i.id === id)
    if (n) n.toastVisible = false
  }

  function markHandled(id: number) {
    const n = items.value.find((i) => i.id === id)
    if (n) {
      n.handled = true
      n.toastVisible = false
    }
  }

  function markAllHandled() {
    items.value.forEach((n) => {
      n.handled = true
      n.toastVisible = false
    })
  }

  return {
    items,
    toasts,
    pending,
    pendingCount,
    notify,
    hideToast,
    markHandled,
    markAllHandled,
    info: (t: string, m?: string, o?: NotifOpts) => notify('info', t, m, o),
    success: (t: string, m?: string, o?: NotifOpts) => notify('success', t, m, o),
    warning: (t: string, m?: string, o?: NotifOpts) => notify('warning', t, m, o),
    danger: (t: string, m?: string, o?: NotifOpts) => notify('danger', t, m, o),
  }
}
