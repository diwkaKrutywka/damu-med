<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotification } from '@/composables/useNotification'

const { show } = useNotification()

// State
const screen = ref('setup') // setup, realtime
const sessionId = ref(null)
const phone = ref('')
const stage = ref('connecting') // connecting, active, doctors, calendar, faq, confirmation
const showWaitingModal = ref(false)
const isConnected = ref(false)
const callTime = ref(0)
const messages = ref([])
const logs = ref([])
const selectedDoctor = ref(null)
const selectedDate = ref(null)
const selectedTime = ref(null)
const currentMonth = ref(new Date())
const kbQuery = ref('')
const kbResult = ref(null)
const activeKbTopic = ref(null)
const currentIntent = ref('')

let timerInterval = null
let demoTimeouts = []

// Mock Data
const doctors = [
  { id: 1, name: 'Иванов А.П.', specialty: 'Терапевт', rating: 4.9, avatar: 'ИА' },
  { id: 2, name: 'Петрова М.С.', specialty: 'Кардиолог', rating: 4.8, avatar: 'ПМ' },
  { id: 3, name: 'Сидоров К.В.', specialty: 'Невролог', rating: 4.7, avatar: 'СК' },
  { id: 4, name: 'Козлова Е.И.', specialty: 'Эндокринолог', rating: 4.9, avatar: 'КЕ' }
]

const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00']

const knowledgeBase = {
  price: { title: 'Цены на услуги', full: 'Первичный приём терапевта — 5000₸. Повторный приём — 3500₸.', short: 'Первичный — 5000₸, повторный — 3500₸' },
  docs: { title: 'Необходимые документы', full: 'Удостоверение личности, полис страхования (при наличии).', short: 'Удостоверение личности и полис (если есть)' },
  parking: { title: 'Парковка', full: 'Бесплатная парковка во дворе клиники, въезд со стороны ул. Абая.', short: 'Да, бесплатная парковка во дворе' },
  schedule: { title: 'Расписание работы', full: 'Клиника работает ежедневно с 8:00 до 20:00.', short: 'Ежедневно с 8:00 до 20:00' },
  insurance: { title: 'Страховые компании', full: 'Принимаем полисы всех казахстанских страховых компаний.', short: 'Да, работаем со всеми страховыми' },
  children: { title: 'Детский приём', full: 'В клинике работают детские специалисты.', short: 'Да, есть детские специалисты' },
  cancel: { title: 'Отмена записи', full: 'Отменить можно по телефону или через SMS.', short: 'Позвоните нам или отмените через SMS' },
  prepare: { title: 'Подготовка к приёму', full: 'Приходите за 10-15 минут до назначенного времени.', short: 'Приходите за 10-15 минут' }
}

const kbTopics = Object.entries(knowledgeBase).map(([id, data]) => ({ id, title: data.title }))

// Demo Scenario
const demoScenario = [
  { delay: 0, type: 'log', logType: 'system', message: '📞 Звонок поступил' },
  { delay: 1200, type: 'log', logType: 'system', message: '🤖 Асель берёт трубку' },
  { delay: 3000, type: 'connected' },
  { delay: 4000, type: 'log', logType: 'tts', message: '🔊 Говорю приветствие' },
  { delay: 5500, type: 'robot', text: 'Здравствуйте! Вы позвонили в клинику MedContact. Меня зовут Асель. Чем могу помочь?', intent: 'приветствие' },
  { delay: 11000, type: 'log', logType: 'stt', message: '👂 Слушаю пациента...' },
  { delay: 13000, type: 'user', text: 'Здравствуйте! Хочу записаться к терапевту. А сколько стоит приём?' },
  { delay: 16000, type: 'log', logType: 'intent', message: '💡 Понял: запись + вопрос о цене' },
  { delay: 17000, type: 'stage', stage: 'faq' },
  { delay: 18000, type: 'kb_query', query: 'сколько стоит приём терапевта', kbId: 'price' },
  { delay: 19000, type: 'log', logType: 'mis', message: '🔍 Ищу в базе знаний...' },
  { delay: 21000, type: 'kb_result', kbId: 'price' },
  { delay: 22500, type: 'robot', text: 'Первичный приём терапевта — 5000 тенге, повторный — 3500. Записываю вас?', intent: 'цена' },
  { delay: 28000, type: 'user', text: 'Да, запишите. А какие документы взять с собой?' },
  { delay: 31000, type: 'log', logType: 'intent', message: '💡 Понял: подтверждение + вопрос о документах' },
  { delay: 32000, type: 'kb_query', query: 'какие документы нужны на приём', kbId: 'docs' },
  { delay: 33000, type: 'log', logType: 'mis', message: '🔍 Ищу в базе знаний...' },
  { delay: 35000, type: 'kb_result', kbId: 'docs' },
  { delay: 36500, type: 'robot', text: 'Возьмите удостоверение личности и полис, если есть. К какому времени вам удобно?', intent: 'документы' },
  { delay: 41000, type: 'stage', stage: 'doctors' },
  { delay: 42000, type: 'log', logType: 'mis', message: '📋 Загружаю список врачей' },
  { delay: 44000, type: 'selectDoctor', doctorId: 1 },
  { delay: 46000, type: 'stage', stage: 'calendar' },
  { delay: 47000, type: 'log', logType: 'mis', message: '📅 Смотрю расписание' },
  { delay: 50000, type: 'user', text: 'На завтра в 10 утра. А парковка есть?' },
  { delay: 53000, type: 'log', logType: 'intent', message: '💡 Понял: время + вопрос о парковке' },
  { delay: 54000, type: 'selectDate' },
  { delay: 55000, type: 'selectTime', time: '10:00' },
  { delay: 56500, type: 'stage', stage: 'faq' },
  { delay: 57500, type: 'kb_query', query: 'есть ли парковка у клиники', kbId: 'parking' },
  { delay: 58500, type: 'log', logType: 'mis', message: '🔍 Ищу в базе знаний...' },
  { delay: 60500, type: 'kb_result', kbId: 'parking' },
  { delay: 62000, type: 'robot', text: 'Да, бесплатная парковка во дворе. Записала вас на завтра, 10:00, терапевт Иванов А.П., каб. 305. Подтверждаете?', intent: 'парковка + подтверждение' },
  { delay: 68000, type: 'user', text: 'Да, всё верно. Спасибо!' },
  { delay: 70000, type: 'log', logType: 'intent', message: '✅ Пациент подтвердил' },
  { delay: 71500, type: 'log', logType: 'mis', message: '💾 Создаю запись...' },
  { delay: 74000, type: 'log', logType: 'mis', message: '✅ Запись создана!' },
  { delay: 76000, type: 'robot', text: 'Отлично! Вы записаны. SMS придёт за час до визита. Хорошего дня!', intent: 'записано' },
  { delay: 81000, type: 'stage', stage: 'confirmation' },
  { delay: 83000, type: 'log', logType: 'system', message: '📞 Звонок завершён' }
]

// Computed
const formattedTime = computed(() => {
  const mins = Math.floor(callTime.value / 60).toString().padStart(2, '0')
  const secs = (callTime.value % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
})

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const startDay = firstDay === 0 ? 6 : firstDay - 1

  const days = []
  for (let i = 0; i < startDay; i++) {
    days.push({ day: '', disabled: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const isToday = date.toDateString() === today.toDateString()
    const isSelected = selectedDate.value && date.toDateString() === selectedDate.value.toDateString()
    days.push({ day: d, disabled: isPast, today: isToday, selected: isSelected })
  }
  return days
})

const monthName = computed(() => {
  const names = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  return `${names[currentMonth.value.getMonth()]} ${currentMonth.value.getFullYear()}`
})

// Methods
const formatPhoneInput = (e) => {
  let digits = e.target.value.replace(/\D/g, '').substring(0, 10)
  let formatted = ''
  if (digits.length > 0) formatted = digits.substring(0, 3)
  if (digits.length > 3) formatted += ' ' + digits.substring(3, 6)
  if (digits.length > 6) formatted += ' ' + digits.substring(6, 8)
  if (digits.length > 8) formatted += ' ' + digits.substring(8, 10)
  phone.value = formatted
}

const generateSessionId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const openSession = () => {
  const phoneDigits = phone.value.replace(/\s/g, '')
  if (phoneDigits.length < 10) {
    show('Введите корректный номер телефона', 'error')
    return
  }

  sessionId.value = generateSessionId()
  showWaitingModal.value = true

  setTimeout(() => {
    showWaitingModal.value = false
    startRealtimeDemo()
  }, 3000)
}

const startRealtimeDemo = () => {
  screen.value = 'realtime'
  stage.value = 'connecting'

  timerInterval = setInterval(() => {
    callTime.value++
  }, 1000)

  runDemoScenario()
}

const runDemoScenario = () => {
  demoScenario.forEach(event => {
    const timeout = setTimeout(() => processEvent(event), event.delay)
    demoTimeouts.push(timeout)
  })
}

const processEvent = (event) => {
  switch (event.type) {
    case 'connected':
      isConnected.value = true
      stage.value = 'active'
      break
    case 'robot':
      addMessage('robot', event.text)
      currentIntent.value = event.intent
      break
    case 'user':
      addMessage('user', event.text)
      break
    case 'log':
      addLog(event.logType, event.message)
      break
    case 'stage':
      stage.value = event.stage
      if (event.stage === 'confirmation') stopTimer()
      break
    case 'selectDoctor':
      selectedDoctor.value = doctors.find(d => d.id === event.doctorId)
      addLog('mis', `Выбран врач: ${selectedDoctor.value.name}`)
      break
    case 'selectDate':
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      selectedDate.value = tomorrow
      addLog('calendar', `Выбрана дата: ${tomorrow.toLocaleDateString('ru-RU')}`)
      break
    case 'selectTime':
      selectedTime.value = event.time
      addLog('calendar', `Выбрано время: ${event.time}`)
      break
    case 'kb_query':
      kbQuery.value = event.query
      activeKbTopic.value = event.kbId
      kbResult.value = null
      break
    case 'kb_result':
      kbResult.value = knowledgeBase[event.kbId]
      break
  }
}

const addMessage = (sender, text) => {
  messages.value.push({ id: Date.now(), sender, text, time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) })
}

const addLog = (type, message) => {
  logs.value.push({ id: Date.now(), type, message, time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const resetDemo = () => {
  demoTimeouts.forEach(t => clearTimeout(t))
  demoTimeouts = []
  stopTimer()

  screen.value = 'setup'
  sessionId.value = null
  phone.value = ''
  stage.value = 'connecting'
  isConnected.value = false
  callTime.value = 0
  messages.value = []
  logs.value = []
  selectedDoctor.value = null
  selectedDate.value = null
  selectedTime.value = null
  kbQuery.value = ''
  kbResult.value = null
  activeKbTopic.value = null
  currentIntent.value = ''
  currentMonth.value = new Date()

  show('Демо сброшено', 'success')
}

const prevMonth = () => {
  const d = new Date(currentMonth.value)
  d.setMonth(d.getMonth() - 1)
  currentMonth.value = d
}

const nextMonth = () => {
  const d = new Date(currentMonth.value)
  d.setMonth(d.getMonth() + 1)
  currentMonth.value = d
}

const clearLogs = () => {
  logs.value = []
}

const stageName = computed(() => {
  const names = { connecting: 'Соединяем', active: 'Разговор', doctors: 'Выбираем врача', calendar: 'Выбираем время', faq: 'Отвечаю на вопрос', confirmation: 'Записано!' }
  return names[stage.value] || stage.value
})

onUnmounted(() => {
  demoTimeouts.forEach(t => clearTimeout(t))
  stopTimer()
})
</script>

<template>
  <div class="voice-robot-page">
    <!-- Setup Screen -->
    <div v-if="screen === 'setup'" class="setup-screen">
      <div class="setup-container">
        <div class="setup-card">
          <div class="setup-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <h1>Робот записывает пациентов за вас</h1>
          <p class="setup-description">
            Пациент звонит — робот отвечает как живой оператор.
            Записывает на приём, отвечает на вопросы. Работает круглосуточно.
          </p>

          <div class="setup-features">
            <div class="setup-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Понимает речь</span>
            </div>
            <div class="setup-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Работает 24/7</span>
            </div>
            <div class="setup-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Сразу в расписание</span>
            </div>
          </div>

          <div class="demo-flow">
            <p class="flow-label">Введите номер, с которого будете звонить:</p>
            <div class="phone-input-group">
              <div class="phone-input">
                <span class="phone-prefix">+7</span>
                <input type="tel" :value="phone" @input="formatPhoneInput" placeholder="XXX XXX XX XX" maxlength="13">
              </div>
            </div>
            <button class="btn btn-primary btn-lg btn-glow" @click="openSession">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
              Открыть сессию
            </button>
          </div>
        </div>

        <div class="setup-preview">
          <div class="preview-badge">
            <span class="badge badge-cyan">Интерактивное демо</span>
          </div>
          <p>Позвоните — и услышите робота вживую. На экране увидите, как он думает, ищет в базе знаний и записывает в МИС.</p>
        </div>
      </div>
    </div>

    <!-- Realtime Screen -->
    <div v-else class="realtime-screen">
      <div class="controls-bar">
        <div class="controls-left">
          <h2 class="session-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
            Сессия: <span class="text-gradient">{{ sessionId }}</span>
          </h2>
          <div class="connection-status">
            <span class="connection-dot" :class="{ connected: isConnected }"></span>
            <span>{{ isConnected ? 'Подключено' : 'Подключение...' }}</span>
          </div>
          <div class="call-timer">{{ formattedTime }}</div>
        </div>
        <div class="controls-right">
          <button class="btn btn-secondary btn-sm" @click="resetDemo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 4v6h6"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Сбросить
          </button>
        </div>
      </div>

      <div class="demo-container">
        <div class="split-view">
          <!-- Transcript Panel -->
          <div class="transcript-panel">
            <div class="panel-header">
              <div class="panel-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Транскрипция диалога
              </div>
              <div class="audio-visualizer" :class="{ active: isConnected && stage !== 'confirmation' }">
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
              </div>
            </div>

            <div class="transcript-content">
              <div v-if="messages.length === 0" class="transcript-placeholder">
                <div class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
                <p>Ожидание подключения к сессии...</p>
              </div>
              <div v-for="msg in messages" :key="msg.id" class="message" :class="msg.sender">
                <div class="message-avatar" :class="msg.sender">
                  <svg v-if="msg.sender === 'robot'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div class="message-content">
                  <div class="message-sender">{{ msg.sender === 'robot' ? 'Асель (AI)' : 'Пациент' }}</div>
                  <div class="message-text">{{ msg.text }}</div>
                  <div class="message-time">{{ msg.time }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Visual Panel -->
          <div class="visual-panel">
            <div class="panel-header">
              <div class="panel-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                Визуализация
              </div>
              <span class="badge badge-cyan">{{ stageName }}</span>
            </div>

            <div class="visual-content">
              <!-- Connecting -->
              <div v-if="stage === 'connecting'" class="visual-stage-content">
                <div class="connecting-animation">
                  <div class="pulse-ring"></div>
                  <div class="pulse-ring delay-1"></div>
                  <div class="pulse-ring delay-2"></div>
                  <div class="connecting-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                </div>
                <h3>Соединяем...</h3>
                <p class="text-secondary">Робот берёт трубку</p>
              </div>

              <!-- Active Call -->
              <div v-else-if="stage === 'active'" class="visual-stage-content">
                <div class="active-call-visual">
                  <div class="waveform-container">
                    <div class="waveform-label">AI Робот</div>
                    <div class="waveform active">
                      <div class="wave-bar" v-for="i in 8" :key="i"></div>
                    </div>
                  </div>
                  <div class="call-direction">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                  <div class="waveform-container">
                    <div class="waveform-label">Пациент</div>
                    <div class="waveform user-waveform">
                      <div class="wave-bar" v-for="i in 8" :key="i"></div>
                    </div>
                  </div>
                </div>
                <div v-if="currentIntent" class="current-intent">
                  <span class="intent-label">Робот понял:</span>
                  <span class="intent-value">{{ currentIntent }}</span>
                </div>
              </div>

              <!-- Doctors -->
              <div v-else-if="stage === 'doctors'" class="visual-stage-content">
                <h4 class="stage-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Доступные специалисты
                </h4>
                <div class="doctors-grid">
                  <div v-for="doc in doctors" :key="doc.id" class="doctor-card" :class="{ selected: selectedDoctor?.id === doc.id }">
                    <div class="doctor-avatar">{{ doc.avatar }}</div>
                    <div class="doctor-name">{{ doc.name }}</div>
                    <div class="doctor-specialty">{{ doc.specialty }}</div>
                    <div class="doctor-rating">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      {{ doc.rating }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Calendar -->
              <div v-else-if="stage === 'calendar'" class="visual-stage-content">
                <h4 class="stage-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Выбор даты и времени
                </h4>
                <div class="calendar-container">
                  <div class="calendar-section">
                    <div class="calendar-header">
                      <h5>{{ monthName }}</h5>
                      <div class="calendar-nav">
                        <button @click="prevMonth">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <button @click="nextMonth">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </div>
                    </div>
                    <div class="calendar-days">
                      <div class="calendar-day-name" v-for="d in ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']" :key="d">{{ d }}</div>
                      <div v-for="(day, i) in calendarDays" :key="i" class="calendar-day" :class="{ disabled: day.disabled, today: day.today, selected: day.selected }">
                        {{ day.day }}
                      </div>
                    </div>
                  </div>
                  <div class="time-slots">
                    <div class="time-slots-title">Свободные окна:</div>
                    <div class="time-slots-grid">
                      <button v-for="time in timeSlots" :key="time" class="time-slot" :class="{ selected: selectedTime === time }">
                        {{ time }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- FAQ / Knowledge Base -->
              <div v-else-if="stage === 'faq'" class="visual-stage-content">
                <h4 class="stage-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  База знаний робота
                </h4>

                <div class="kb-query">
                  <div class="kb-query-label">Вопрос пациента:</div>
                  <div class="kb-query-text">"{{ kbQuery || '—' }}"</div>
                </div>

                <div v-if="!kbResult" class="kb-search">
                  <div class="kb-search-indicator">
                    <div class="kb-search-dot"></div>
                    <span>Поиск в базе знаний...</span>
                  </div>
                </div>

                <div v-else class="kb-result">
                  <div class="kb-result-header">
                    <span class="kb-result-icon">📄</span>
                    <span class="kb-result-title">{{ kbResult.title }}</span>
                    <span class="kb-result-score">{{ (0.85 + Math.random() * 0.14).toFixed(2) }} релевантность</span>
                  </div>
                  <div class="kb-result-full">{{ kbResult.full }}</div>
                  <div class="kb-result-answer">
                    <div class="kb-answer-label">Ответ робота (кратко):</div>
                    <div class="kb-answer-text">{{ kbResult.short }}</div>
                  </div>
                </div>

                <div class="kb-bank">
                  <div class="kb-bank-title">Темы в базе:</div>
                  <div class="kb-bank-items">
                    <div v-for="topic in kbTopics" :key="topic.id" class="kb-bank-item" :class="{ active: activeKbTopic === topic.id }">
                      {{ topic.title }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Confirmation -->
              <div v-else-if="stage === 'confirmation'" class="visual-stage-content">
                <div class="confirmation-card">
                  <div class="confirmation-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h3>Запись подтверждена!</h3>
                  <p class="text-secondary">Данные отправлены в МИС</p>

                  <div v-if="selectedDoctor && selectedDate" class="confirmation-details">
                    <div class="confirmation-row">
                      <span class="confirmation-label">Врач</span>
                      <span class="confirmation-value">{{ selectedDoctor.name }}</span>
                    </div>
                    <div class="confirmation-row">
                      <span class="confirmation-label">Специальность</span>
                      <span class="confirmation-value">{{ selectedDoctor.specialty }}</span>
                    </div>
                    <div class="confirmation-row">
                      <span class="confirmation-label">Дата</span>
                      <span class="confirmation-value">{{ selectedDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }) }}</span>
                    </div>
                    <div class="confirmation-row">
                      <span class="confirmation-label">Время</span>
                      <span class="confirmation-value">{{ selectedTime }}</span>
                    </div>
                    <div class="confirmation-row">
                      <span class="confirmation-label">Адрес</span>
                      <span class="confirmation-value">ул. Абая 52, каб. 305</span>
                    </div>
                  </div>

                  <div class="confirmation-actions">
                    <router-link to="/" class="btn btn-secondary btn-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                      </svg>
                      К стендам
                    </router-link>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI Logs -->
            <div class="ai-logs">
              <div class="ai-logs-header">
                <span>Что происходит внутри</span>
                <button class="btn btn-ghost btn-sm" @click="clearLogs">Очистить</button>
              </div>
              <div class="ai-logs-content">
                <div v-for="log in logs" :key="log.id" class="ai-log-entry">
                  <span class="ai-log-time">{{ log.time }}</span>
                  <span class="ai-log-type" :class="log.type">[{{ log.type.toUpperCase() }}]</span>
                  <span class="ai-log-message">{{ log.message }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Waiting Modal -->
    <div class="modal-overlay" :class="{ active: showWaitingModal }">
      <div class="modal waiting-modal">
        <div class="waiting-content">
          <div class="waiting-animation">
            <div class="waiting-ring"></div>
            <div class="waiting-ring delay-1"></div>
            <div class="waiting-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
          </div>
          <h3>Ожидаем звонок</h3>
          <p class="waiting-phone">с номера <strong>+7 {{ phone }}</strong></p>
          <p class="waiting-hint">Позвоните на <strong>+7 727 200-12-34</strong></p>
          <div class="waiting-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/styles/voice-robot.css';
</style>
