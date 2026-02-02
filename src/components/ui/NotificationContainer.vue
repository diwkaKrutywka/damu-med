<script setup>
import { useNotification } from '@/composables/useNotification'

const { notifications, remove } = useNotification()

const getIcon = (type) => {
  switch (type) {
    case 'success':
      return '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
    case 'error':
      return '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
    case 'warning':
      return '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
    default:
      return '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
  }
}
</script>

<template>
  <div class="notification-container">
    <TransitionGroup name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification"
        :class="notification.type"
      >
        <svg
          class="notification-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          v-html="getIcon(notification.type)"
        />
        <span class="notification-message">{{ notification.message }}</span>
        <button class="notification-close" @click="remove(notification.id)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notification-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 300px;
  max-width: 400px;
}

.notification.success {
  border-color: var(--status-green);
  background: var(--status-green-dim);
}

.notification.error {
  border-color: var(--status-red);
  background: var(--status-red-dim);
}

.notification.warning {
  border-color: var(--status-yellow);
  background: var(--status-yellow-dim);
}

.notification.info {
  border-color: var(--accent-cyan);
  background: var(--accent-cyan-dim);
}

.notification-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.notification.success .notification-icon {
  color: var(--status-green);
}

.notification.error .notification-icon {
  color: var(--status-red);
}

.notification.warning .notification-icon {
  color: var(--status-yellow);
}

.notification.info .notification-icon {
  color: var(--accent-cyan);
}

.notification-message {
  flex: 1;
  font-size: 0.9rem;
}

.notification-close {
  width: 20px;
  height: 20px;
  padding: 0;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.notification-close:hover {
  color: var(--text-primary);
}

.notification-close svg {
  width: 16px;
  height: 16px;
}

/* Transitions */
.notification-enter-active {
  animation: slideInRight 0.3s ease forwards;
}

.notification-leave-active {
  animation: fadeIn 0.2s ease reverse forwards;
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
