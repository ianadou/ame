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
  desktop?: boolean
}

/**
 * Notification système (bureau). Utilise l'API Web Notification, supportée
 * par le navigateur ET le webview Tauri (plugin notification v2). Silencieux
 * si non supporté ou permission refusée.
 */
function notifBureau(title: string, body?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/icon-256.png' })
    } catch {
      /* certains environnements exigent le service worker — ignoré */
    }
  } else if (Notification.permission === 'default') {
    Notification.requestPermission().then((p) => {
      if (p === 'granted') {
        try {
          new Notification(title, { body, icon: '/icon-256.png' })
        } catch {
          /* ignoré */
        }
      }
    })
  }
}

export function demanderPermissionBureau() {
  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'default'
  ) {
    Notification.requestPermission()
  }
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
    options: { toast?: boolean; duration?: number; desktop?: boolean } = {},
  ): number {
    const { toast = true, duration = 0, desktop = variant !== 'info' } = options
    const id = ++seq + Date.now()
    // Évite les doublons exacts non traités (ex. re-render de page)
    const dup = items.value.find((n) => !n.handled && n.title === title && n.message === message)
    if (dup) return dup.id
    if (desktop) notifBureau(title, message)
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
