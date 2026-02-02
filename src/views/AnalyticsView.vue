<script setup>
import { ref, computed, onMounted } from 'vue'
import { Doughnut, Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'
import { useNotification } from '@/composables/useNotification'

// Register Chart.js components
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
)

// Chart.js defaults for dark theme
ChartJS.defaults.color = '#94a3b8'
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.08)'

const { show: showNotification } = useNotification()

// Filters
const periodFilter = ref('week')
const typeFilter = ref('all')
const robotFilter = ref('all')

// Data
const callsData = ref([])

// Stats computed from data
const stats = computed(() => {
  const data = callsData.value
  const totalCalls = data.length
  const reached = data.filter(d => d.result !== 'no_answer' && d.result !== 'busy').length
  const booked = data.filter(d => d.result === 'booked').length
  const reachRate = totalCalls > 0 ? Math.round(reached / totalCalls * 100) : 0
  const conversion = reached > 0 ? Math.round(booked / reached * 100) : 0

  const bookedWithStatus = data.filter(d => d.result === 'booked' && d.misStatus)
  const arrived = bookedWithStatus.filter(d => d.misStatus === 'arrived').length || Math.round(booked * 0.85)
  const noShow = bookedWithStatus.filter(d => d.misStatus === 'no_show').length || Math.round(booked * 0.10)
  const cancelled = bookedWithStatus.filter(d => d.misStatus === 'cancelled').length || Math.round(booked * 0.05)

  return {
    totalCalls,
    reachRate,
    booked,
    conversion,
    arrived,
    noShow,
    cancelled
  }
})

// Chart data
const reachChartData = computed(() => {
  const data = callsData.value
  const totalCalls = data.length
  const reached = data.filter(d => d.result !== 'no_answer' && d.result !== 'busy').length
  const notReached = totalCalls - reached

  return {
    labels: ['Дозвонились', 'Не дозвонились'],
    datasets: [{
      data: [reached || 78, notReached || 22],
      backgroundColor: ['#00d4ff', '#374151'],
      borderWidth: 0,
      hoverOffset: 10
    }]
  }
})

const reachChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    }
  }
}

const resultsChartData = computed(() => {
  const data = callsData.value
  const booked = data.filter(d => d.result === 'booked').length || 312
  const callback = data.filter(d => d.result === 'callback').length || 156
  const refused = data.filter(d => d.result === 'refused').length || 203
  const noAnswer = data.filter(d => d.result === 'no_answer').length || 412
  const busy = data.filter(d => d.result === 'busy').length || 164

  return {
    labels: ['Записались', 'Перезвон', 'Отказ', 'Нет ответа', 'Занято'],
    datasets: [{
      label: 'Количество',
      data: [booked, callback, refused, noAnswer, busy],
      backgroundColor: ['#22c55e', '#00d4ff', '#ef4444', '#64748b', '#eab308'],
      borderRadius: 8,
      borderSkipped: false
    }]
  }
})

const resultsChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { display: true, color: 'rgba(255, 255, 255, 0.05)' }
    },
    x: {
      grid: { display: false }
    }
  }
}

const conversionChartData = ref({
  labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  datasets: [{
    label: 'Конверсия %',
    data: [28, 32, 35, 29, 38, 25, 31],
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    fill: true,
    tension: 0.4,
    pointBackgroundColor: '#a855f7',
    pointBorderColor: '#0a0a0f',
    pointBorderWidth: 2,
    pointRadius: 5
  }]
})

const conversionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 50,
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      ticks: {
        callback: value => value + '%'
      }
    },
    x: {
      grid: { display: false }
    }
  }
}

// Funnel data
const funnelData = computed(() => {
  const total = stats.value.totalCalls || 1247
  const reached = Math.round(total * (stats.value.reachRate / 100)) || 973
  const dialog = Math.round(reached * 0.83) || 811
  const interest = Math.round(dialog * 0.69) || 561
  const booked = stats.value.booked || 312

  return [
    { label: 'Звонки', value: total, percent: 100 },
    { label: 'Дозвон', value: reached, percent: Math.round(reached / total * 100) },
    { label: 'Диалог', value: dialog, percent: Math.round(dialog / total * 100) },
    { label: 'Интерес', value: interest, percent: Math.round(interest / total * 100) },
    { label: 'Запись', value: booked, percent: Math.round(booked / total * 100) }
  ]
})

// Mock data generator
function generateMockData(count = 50) {
  const names = ['Иванов И.И.', 'Петрова А.С.', 'Сидоров К.М.', 'Козлова Е.В.', 'Морозов Д.А.', 'Новикова О.Л.', 'Волков П.Р.', 'Соколова М.Н.']
  const results = ['booked', 'callback', 'refused', 'no_answer', 'busy']
  const types = ['incoming', 'outgoing']
  const misStatuses = ['arrived', 'no_show', 'cancelled', 'pending']

  const data = []

  for (let i = 0; i < count; i++) {
    const date = new Date()
    date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 10000))

    const result = results[Math.floor(Math.random() * results.length)]
    const hasBooking = result === 'booked'

    data.push({
      id: i + 1,
      time: date,
      patient: names[Math.floor(Math.random() * names.length)],
      phone: `+7 7${Math.floor(Math.random() * 100).toString().padStart(2, '0')} ${Math.floor(Math.random() * 1000).toString().padStart(3, '0')} ${Math.floor(Math.random() * 100).toString().padStart(2, '0')} ${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
      type: types[Math.floor(Math.random() * types.length)],
      result: result,
      duration: Math.floor(Math.random() * 180) + 30,
      misStatus: hasBooking ? misStatuses[Math.floor(Math.random() * misStatuses.length)] : null
    })
  }

  return data.sort((a, b) => b.time - a.time)
}

function generateData(count) {
  callsData.value = generateMockData(count)

  // Update conversion chart with random data
  conversionChartData.value = {
    ...conversionChartData.value,
    datasets: [{
      ...conversionChartData.value.datasets[0],
      data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 15) + 25)
    }]
  }

  showNotification(`Сгенерировано ${count} записей`, 'success')
}

function exportData() {
  showNotification('Экспорт данных в CSV...', 'info')
  setTimeout(() => {
    showNotification('Данные экспортированы', 'success')
  }, 1500)
}

function updateCharts() {
  console.log('Filters updated:', {
    period: periodFilter.value,
    type: typeFilter.value,
    robot: robotFilter.value
  })
}

// Utilities
function formatDateTime(date) {
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  if (isToday) {
    return `Сегодня, ${time}`
  }
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + `, ${time}`
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('')
}

const resultLabels = {
  booked: { text: 'Записан', class: 'success' },
  callback: { text: 'Перезвон', class: 'pending' },
  refused: { text: 'Отказ', class: 'failed' },
  no_answer: { text: 'Нет ответа', class: 'pending' },
  busy: { text: 'Занято', class: 'pending' }
}

const misLabels = {
  arrived: { text: 'Пришёл', class: 'success' },
  no_show: { text: 'Не пришёл', class: 'failed' },
  cancelled: { text: 'Отменён', class: 'pending' },
  pending: { text: 'Ожидание', class: 'pending' }
}

onMounted(() => {
  generateData(50)
})
</script>

<template>
  <div class="analytics-page">
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-title">
          <div class="page-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div>
            <h1>Аналитика</h1>
            <p class="text-secondary">Статистика звонков и записей</p>
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" @click="exportData">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Экспорт
          </button>
          <button class="btn btn-primary" @click="generateData(200)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 4v6h6"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Сгенерировать данные
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-group">
          <span class="filter-label">Период:</span>
          <select v-model="periodFilter" class="filter-select" @change="updateCharts">
            <option value="today">Сегодня</option>
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="quarter">Квартал</option>
          </select>
        </div>
        <div class="filter-group">
          <span class="filter-label">Тип:</span>
          <select v-model="typeFilter" class="filter-select" @change="updateCharts">
            <option value="all">Все звонки</option>
            <option value="incoming">Входящие</option>
            <option value="outgoing">Исходящие</option>
          </select>
        </div>
        <div class="filter-group">
          <span class="filter-label">Робот:</span>
          <select v-model="robotFilter" class="filter-select" @change="updateCharts">
            <option value="all">Все роботы</option>
            <option value="generative">Генеративный</option>
            <option value="scripted">Сценарный</option>
          </select>
        </div>
        <button class="btn btn-secondary btn-sm generate-btn" @click="generateData(50)">
          +50 записей
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card animate-fadeInUp stagger-1">
          <div class="stat-header">
            <span class="stat-label">Всего звонков</span>
            <div class="stat-icon cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3"/>
              </svg>
            </div>
          </div>
          <div class="stat-value">{{ stats.totalCalls.toLocaleString() }}</div>
          <div class="stat-change positive">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            </svg>
            +12% к прошлой неделе
          </div>
        </div>

        <div class="stat-card animate-fadeInUp stagger-2">
          <div class="stat-header">
            <span class="stat-label">Дозвон</span>
            <div class="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          </div>
          <div class="stat-value">{{ stats.reachRate }}%</div>
          <div class="stat-change positive">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            </svg>
            +3% к прошлой неделе
          </div>
        </div>

        <div class="stat-card animate-fadeInUp stagger-3">
          <div class="stat-header">
            <span class="stat-label">Записались</span>
            <div class="stat-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
          </div>
          <div class="stat-value">{{ stats.booked.toLocaleString() }}</div>
          <div class="stat-change positive">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            </svg>
            +8% к прошлой неделе
          </div>
        </div>

        <div class="stat-card animate-fadeInUp stagger-4">
          <div class="stat-header">
            <span class="stat-label">Конверсия</span>
            <div class="stat-icon yellow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
          </div>
          <div class="stat-value">{{ stats.conversion }}%</div>
          <div class="stat-change negative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
            </svg>
            -2% к прошлой неделе
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-grid">
        <!-- Reach Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">Дозвон / Недозвон</span>
            <span class="badge">Pie</span>
          </div>
          <div class="chart-container">
            <Doughnut :data="reachChartData" :options="reachChartOptions" />
          </div>
        </div>

        <!-- Results Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">Результаты звонков</span>
            <span class="badge">Bar</span>
          </div>
          <div class="chart-container">
            <Bar :data="resultsChartData" :options="resultsChartOptions" />
          </div>
        </div>

        <!-- Conversion Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">Конверсия по дням</span>
            <span class="badge">Line</span>
          </div>
          <div class="chart-container">
            <Line :data="conversionChartData" :options="conversionChartOptions" />
          </div>
        </div>

        <!-- Funnel Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">Воронка записи</span>
            <span class="badge">Funnel</span>
          </div>
          <div class="funnel-chart">
            <div v-for="step in funnelData" :key="step.label" class="funnel-step">
              <span class="funnel-label">{{ step.label }}</span>
              <div class="funnel-bar" :style="{ width: step.percent + '%' }">
                {{ step.value.toLocaleString() }}
              </div>
              <span class="funnel-value">{{ step.percent }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Attendance Stats -->
      <div class="chart-card mb-xl">
        <div class="chart-header">
          <span class="chart-title">Статистика посещений (из МИС)</span>
          <span class="badge badge-purple">МИС</span>
        </div>
        <div class="attendance-grid">
          <div class="attendance-item arrived">
            <div class="attendance-value">{{ stats.arrived }}</div>
            <div class="attendance-label">Пришли на приём</div>
          </div>
          <div class="attendance-item no-show">
            <div class="attendance-value">{{ stats.noShow }}</div>
            <div class="attendance-label">Не пришли</div>
          </div>
          <div class="attendance-item cancelled">
            <div class="attendance-value">{{ stats.cancelled }}</div>
            <div class="attendance-label">Отменили</div>
          </div>
        </div>
      </div>

      <!-- Calls Table -->
      <div class="table-container">
        <div class="table-header">
          <span class="table-title">Последние звонки</span>
          <span class="badge">{{ callsData.length }} записей</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Время</th>
                <th>Пациент</th>
                <th>Телефон</th>
                <th>Тип</th>
                <th>Результат</th>
                <th>Длительность</th>
                <th>Статус МИС</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in callsData.slice(0, 50)" :key="row.id">
                <td>{{ formatDateTime(row.time) }}</td>
                <td>
                  <div class="patient-cell">
                    <div class="patient-avatar">{{ getInitials(row.patient) }}</div>
                    {{ row.patient }}
                  </div>
                </td>
                <td style="font-family: var(--font-mono); font-size: 0.85rem;">{{ row.phone }}</td>
                <td>{{ row.type === 'incoming' ? 'Входящий' : 'Исходящий' }}</td>
                <td>
                  <span class="status-badge" :class="resultLabels[row.result].class">
                    {{ resultLabels[row.result].text }}
                  </span>
                </td>
                <td>{{ formatDuration(row.duration) }}</td>
                <td>
                  <span v-if="row.misStatus" class="status-badge" :class="misLabels[row.misStatus].class">
                    {{ misLabels[row.misStatus].text }}
                  </span>
                  <template v-else>—</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.analytics-page {
  min-height: calc(100vh - 140px);
  padding-bottom: var(--spacing-3xl);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xl) 0;
  border-bottom: 1px solid var(--border-default);
  margin-bottom: var(--spacing-xl);
}

.page-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #10b981, #14b8a6);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-icon svg {
  width: 24px;
  height: 24px;
  stroke: var(--bg-primary);
}

.page-actions {
  display: flex;
  gap: var(--spacing-md);
}

/* Stats Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.stat-icon {
  width: 40px;
  height: 40px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 20px;
  height: 20px;
}

.stat-icon.green { background: var(--status-green-dim); }
.stat-icon.green svg { stroke: var(--status-green); }

.stat-icon.cyan { background: var(--accent-cyan-dim); }
.stat-icon.cyan svg { stroke: var(--accent-cyan); }

.stat-icon.purple { background: var(--accent-purple-dim); }
.stat-icon.purple svg { stroke: var(--accent-purple); }

.stat-icon.yellow { background: var(--status-yellow-dim); }
.stat-icon.yellow svg { stroke: var(--status-yellow); }

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
}

.stat-change.positive { color: var(--status-green); }
.stat-change.negative { color: var(--status-red); }

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.chart-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.chart-container {
  position: relative;
  height: 250px;
}

/* Funnel Chart */
.funnel-chart {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) 0;
}

.funnel-step {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.funnel-bar {
  height: 40px;
  background: var(--accent-gradient);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-md);
  color: var(--bg-primary);
  font-weight: 500;
  font-size: 0.9rem;
  transition: width 0.5s ease;
}

.funnel-label {
  width: 80px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.funnel-value {
  width: 60px;
  text-align: right;
  font-weight: 600;
}

/* Table */
.table-container {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-default);
}

.table-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: left;
  border-bottom: 1px solid var(--border-default);
}

.data-table th {
  background: var(--bg-secondary);
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table tr:hover {
  background: var(--bg-card-hover);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.success {
  background: var(--status-green-dim);
  color: var(--status-green);
}

.status-badge.pending {
  background: var(--status-yellow-dim);
  color: var(--status-yellow);
}

.status-badge.failed {
  background: var(--status-red-dim);
  color: var(--status-red);
}

.patient-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.patient-avatar {
  width: 32px;
  height: 32px;
  background: var(--accent-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Filters */
.filters-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.filter-select {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-cyan);
}

.generate-btn {
  margin-left: auto;
}

/* Attendance Stats */
.attendance-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.attendance-item {
  text-align: center;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.attendance-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.attendance-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.attendance-item.arrived .attendance-value { color: var(--status-green); }
.attendance-item.no-show .attendance-value { color: var(--status-red); }
.attendance-item.cancelled .attendance-value { color: var(--status-yellow); }

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .page-actions {
    width: 100%;
  }

  .page-actions .btn {
    flex: 1;
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .generate-btn {
    margin-left: 0;
    width: 100%;
  }
}
</style>
