import { useQuasar } from 'quasar'

/**
 * Centralized toast notifications.
 * Mirrors the LoginPage design language: dark pill (grey-9), white text,
 * status-colored icon, rounded via the global `.custom-notify` class.
 * Use this everywhere instead of raw $q.notify so the look stays consistent.
 */
export function useNotify() {
  const $q = useQuasar()

  const base = {
    color: 'grey-9',
    textColor: 'white',
    position: 'top' as const,
    classes: 'custom-notify',
    timeout: 3500,
  }

  return {
    success: (message: string, caption?: string) =>
      $q.notify({
        ...base,
        message,
        caption,
        icon: 'mdi-check-circle',
        iconColor: 'teal-4',
        timeout: 3500,
      }),
    error: (message: string, caption?: string) =>
      $q.notify({
        ...base,
        message,
        caption,
        icon: 'mdi-close-circle',
        iconColor: 'red-4',
        timeout: 4500,
      }),
    warning: (message: string, caption?: string) =>
      $q.notify({
        ...base,
        message,
        caption,
        icon: 'mdi-alert-circle',
        iconColor: 'amber-4',
        timeout: 4500,
      }),
    info: (message: string, caption?: string) =>
      $q.notify({
        ...base,
        message,
        caption,
        icon: 'mdi-information',
        iconColor: 'blue-4',
        timeout: 3500,
      }),
  }
}
