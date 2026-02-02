import { ref, readonly } from 'vue'

const notifications = ref([])

export function useNotification() {
  const show = (message, type = 'info') => {
    const id = Date.now()
    notifications.value.push({ id, message, type })

    setTimeout(() => {
      remove(id)
    }, 4000)
  }

  const remove = (id) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return {
    notifications: readonly(notifications),
    show,
    remove
  }
}
