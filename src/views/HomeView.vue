<script setup>
import { ref } from 'vue'
import { useNotification } from '@/composables/useNotification'

const { show } = useNotification()

const showKpModal = ref(false)
const showFallbackModal = ref(false)

const stands = [
  {
    id: 'voice-robot',
    title: 'Круглосуточная запись без очередей',
    description: 'Робот берёт звонки 24/7. Пациенты записываются в любое время — очередь в регистратуре исчезает. Интегрирован с МИС.',
    icon: 'microphone',
    gradient: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
    tags: [
      { text: '24/7', type: 'cyan' },
      { text: 'DamuMed', type: 'purple' },
      { text: 'KZ/RU', type: 'default' }
    ],
    status: 'online',
    lastCheck: '5 мин назад',
    route: '/voice-robot',
    buttonText: 'Попробовать запись',
    priority: true
  },
  {
    id: 'whatsapp',
    title: 'Напоминания — явка до 85%',
    description: 'Автоматические напоминания в WhatsApp снижают неявки на 30-40%. Отвечает на вопросы по базе знаний клиники.',
    icon: 'whatsapp',
    gradient: 'linear-gradient(135deg, #25D366, #128C7E)',
    tags: [
      { text: '−30% неявок', type: 'cyan' },
      { text: 'DamuMed', type: 'purple' },
      { text: 'WhatsApp', type: 'default' }
    ],
    status: 'online',
    lastCheck: '12 мин назад',
    route: '/whatsapp',
    buttonText: 'Включить напоминания'
  },
  {
    id: 'terminal',
    title: 'Пациент записывается сам',
    description: 'Разгружает регистратуру: пациенты записываются за 3 клика. Выбор врача, оплата Kaspi, талон — без очереди.',
    icon: 'terminal',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    tags: [
      { text: '3 клика', type: 'purple' },
      { text: 'Kaspi', type: 'default' },
      { text: 'Голос', type: 'default' }
    ],
    status: 'online',
    lastCheck: '8 мин назад',
    route: '/terminal',
    buttonText: 'Записать пациента'
  },
  {
    id: 'script-robot',
    title: 'Охват населения за часы, не недели',
    description: 'Массово приглашайте на скрининги и напоминайте о приёмах. Охватите в 10 раз больше пациентов, чем вручную.',
    icon: 'phone',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    tags: [
      { text: '×10 охват', type: 'default' },
      { text: 'KZ/RU', type: 'default' },
      { text: '7 сценариев', type: 'cyan' }
    ],
    status: 'online',
    lastCheck: '7 сценариев',
    route: '/script-robot',
    buttonText: 'Выбрать сценарий'
  },
  {
    id: 'analytics',
    title: 'Контроль результата в реальном времени',
    description: 'Видите сколько звонков, записей и явок. Контролируете конверсию на каждом этапе воронки.',
    icon: 'chart',
    gradient: 'linear-gradient(135deg, #10b981, #14b8a6)',
    tags: [
      { text: 'Дозвоны', type: 'cyan' },
      { text: 'Конверсия', type: 'purple' },
      { text: 'Явка', type: 'default' }
    ],
    status: 'online',
    lastCheck: 'Данные: сегодня',
    route: '/analytics',
    buttonText: 'Посмотреть результаты'
  }
]

const roiMetrics = [
  { value: '−40%', label: 'Снижение неявок' },
  { value: '24/7', label: 'Запись работает' },
  { value: '×10', label: 'Охват населения' },
  { value: '−60%', label: 'Нагрузка на регистратуру' }
]

const kpModules = ref([
  { id: 'voice', name: 'Голосовой робот', checked: true },
  { id: 'whatsapp', name: 'WhatsApp бот', checked: true },
  { id: 'terminal', name: 'Терминал', checked: false },
  { id: 'script', name: 'Сценарный робот', checked: false },
  { id: 'analytics', name: 'Аналитика', checked: true },
  { id: 'mis', name: 'Интеграция МИС', checked: false }
])

const kpForm = ref({
  clinicName: '',
  contactPerson: '',
  email: ''
})

const resetDemoData = () => {
  localStorage.removeItem('demoAnalyticsData')
  localStorage.removeItem('demoCallHistory')
  localStorage.removeItem('demoPatients')
  show('Данные демо сброшены', 'success')
}

const runHealthcheck = () => {
  show('Проверка статусов...', 'info')
  setTimeout(() => {
    show('Все системы работают нормально', 'success')
  }, 1500)
}

const generateKP = () => {
  show('КП сформировано! (В реальной версии здесь будет генерация PDF)', 'success')
  showKpModal.value = false
}

const showROICalculator = () => {
  show('ROI-калькулятор откроется в отдельном окне (в разработке)', 'info')
}

const getIconPath = (icon) => {
  switch (icon) {
    case 'microphone':
      return '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>'
    case 'whatsapp':
      return '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'
    case 'terminal':
      return '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>'
    case 'phone':
      return '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'
    case 'chart':
      return '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'
    default:
      return ''
  }
}
</script>

<template>
  <div class="container">
    <!-- Hero -->
    <section class="hero">
      <h1 class="hero-title">
        <span class="text-gradient">MedContact</span> Demo Hub
      </h1>
      <p class="hero-subtitle">
        Единая точка входа для демонстрации продуктов. Выберите стенд и начните показ.
      </p>
    </section>

    <!-- Stands Grid -->
    <section class="stands-section">
      <div class="flex justify-between items-center">
        <h2>Демо-стенды</h2>
        <div class="flex gap-sm">
          <span class="status status-online">
            <span class="status-dot"></span>
            4 активны
          </span>
          <span class="status status-warning">
            <span class="status-dot"></span>
            1 проблема
          </span>
        </div>
      </div>

      <div class="stands-grid">
        <div
          v-for="(stand, index) in stands"
          :key="stand.id"
          class="card stand-card card-glow hover-lift animate-fadeInUp"
          :class="`stagger-${index + 1}`"
        >
        <div style="min-height: 220px;">
          <span v-if="stand.priority" class="priority-badge">ХИТ</span>

          <div class="stand-icon" :style="{ background: stand.gradient }">
            <svg viewBox="0 0 24 24" v-html="getIconPath(stand.icon)" />
          </div>

          <h3 class="card-title">{{ stand.title }}</h3>
          <p class="card-description">{{ stand.description }}</p>

          <div class="stand-tags">
            <span
              v-for="tag in stand.tags"
              :key="tag.text"
              class="badge"
              :class="`badge-${tag.type}`"
            >
              {{ tag.text }}
            </span>
          </div>
</div>
          <div class="stand-meta">
            <span class="status" :class="`status-${stand.status}`">
              <span class="status-dot"></span>
              {{ stand.status === 'online' ? 'Работает' : 'Проблема' }}
            </span>
            <span class="last-check">{{ stand.lastCheck }}</span>
          </div>

          <router-link :to="stand.route" class="btn btn-primary btn-lg mt-lg full-width">
            {{ stand.buttonText }}
          </router-link>
        </div>
      </div>
    </section>

    

    <!-- ROI Section -->
    <section class="roi-section">
      <div class="flex justify-between items-center">
        <div>
          <h2>Результаты внедрения</h2>
          <p class="text-secondary mt-sm">Что получает клиника с нашими решениями</p>
        </div>
        <span class="badge badge-cyan">ROI-калькулятор</span>
      </div>

      <div class="roi-grid">
        <div v-for="metric in roiMetrics" :key="metric.label" class="roi-card hover-lift">
          <div class="roi-value">{{ metric.value }}</div>
          <div class="roi-label">{{ metric.label }}</div>
        </div>
      </div>

      <div class="roi-actions">
        <button class="btn btn-secondary" @click="showROICalculator">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="2" width="16" height="20" rx="2"/>
            <line x1="8" y1="6" x2="16" y2="6"/>
            <line x1="8" y1="10" x2="16" y2="10"/>
            <line x1="8" y1="14" x2="12" y2="14"/>
          </svg>
          Рассчитать экономию
        </button>
        <button class="btn btn-primary" @click="showKpModal = true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Сформировать КП
        </button>
      </div>
    </section>

    <!-- KP Modal -->
    <div class="modal-overlay" :class="{ active: showKpModal }" @click.self="showKpModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Сформировать КП</h3>
          <button class="modal-close" @click="showKpModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form class="kp-form" @submit.prevent="generateKP">
          <input
            v-model="kpForm.clinicName"
            type="text"
            placeholder="Название клиники"
            required
          >
          <input
            v-model="kpForm.contactPerson"
            type="text"
            placeholder="Контактное лицо"
          >
          <input
            v-model="kpForm.email"
            type="email"
            placeholder="Email для отправки КП"
          >

          <p class="text-secondary mt-md">Выберите модули:</p>
          <div class="kp-modules">
            <label v-for="mod in kpModules" :key="mod.id" class="kp-module">
              <input v-model="mod.checked" type="checkbox">
              {{ mod.name }}
            </label>
          </div>

          <div class="flex gap-md mt-lg">
            <button type="button" class="btn btn-secondary flex-1" @click="showKpModal = false">
              Отмена
            </button>
            <button type="submit" class="btn btn-primary flex-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Скачать PDF
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.full-width {
  width: 100%;
}

.flex-1 {
  flex: 1;
}

.badge-default {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}
</style>
