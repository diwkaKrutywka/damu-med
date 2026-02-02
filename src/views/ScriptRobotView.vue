<script setup>
import { ref } from 'vue'
import { useNotification } from '@/composables/useNotification'

const { show: showNotification } = useNotification()

// Scenario data
const scenarioData = {
  'adult-screening': {
    title: 'Взрослый скрининг',
    recordings: [
      { id: 1, lang: 'RU', desc: 'Приглашение на диспансеризацию', duration: '1:23' },
      { id: 2, lang: 'KZ', desc: 'Скринингке шақыру', duration: '1:45' },
      { id: 3, lang: 'RU', desc: 'Ответ на вопросы пациента', duration: '2:10' },
      { id: 4, lang: 'KZ/RU', desc: 'Двуязычный диалог', duration: '1:58' },
      { id: 5, lang: 'RU', desc: 'Перенос даты скрининга', duration: '1:32' }
    ]
  },
  'child-screening': {
    title: 'Детский скрининг',
    recordings: [
      { id: 1, lang: 'RU', desc: 'Приглашение на осмотр ребёнка', duration: '1:18' },
      { id: 2, lang: 'KZ', desc: 'Балаларды тексеруге шақыру', duration: '1:35' },
      { id: 3, lang: 'RU', desc: 'Список специалистов', duration: '1:52' },
      { id: 4, lang: 'KZ/RU', desc: 'Смешанный диалог', duration: '2:05' },
      { id: 5, lang: 'RU', desc: 'Ответы на вопросы родителя', duration: '1:40' }
    ]
  },
  'vaccination': {
    title: 'Вакцинация',
    recordings: [
      { id: 1, lang: 'RU', desc: 'Приглашение на вакцинацию', duration: '1:15' },
      { id: 2, lang: 'KZ', desc: 'Вакцинацияға шақыру', duration: '1:28' },
      { id: 3, lang: 'RU', desc: 'Напоминание о второй дозе', duration: '1:05' },
      { id: 4, lang: 'KZ/RU', desc: 'Двуязычный диалог', duration: '1:48' },
      { id: 5, lang: 'RU', desc: 'Ответы о противопоказаниях', duration: '2:12' }
    ]
  },
  'fluorography': {
    title: 'Флюорография',
    recordings: [
      { id: 1, lang: 'RU', desc: 'Напоминание о флюорографии', duration: '1:10' },
      { id: 2, lang: 'KZ', desc: 'Флюорография туралы еске салу', duration: '1:22' },
      { id: 3, lang: 'RU', desc: 'Информация о кабинете', duration: '0:58' },
      { id: 4, lang: 'KZ/RU', desc: 'Смешанный диалог', duration: '1:35' },
      { id: 5, lang: 'RU', desc: 'Перезапись на другой день', duration: '1:28' }
    ]
  },
  'osms': {
    title: 'ОСМС',
    recordings: [
      { id: 1, lang: 'RU', desc: 'Информирование о страховании', duration: '1:45' },
      { id: 2, lang: 'KZ', desc: 'МӘМС туралы ақпарат', duration: '1:58' },
      { id: 3, lang: 'RU', desc: 'Преимущества ОСМС', duration: '2:05' },
      { id: 4, lang: 'KZ/RU', desc: 'Двуязычный диалог', duration: '2:18' },
      { id: 5, lang: 'RU', desc: 'Ответы на вопросы', duration: '1:52' }
    ]
  },
  'reminder': {
    title: 'Напоминание о приёме',
    recordings: [
      { id: 1, lang: 'RU', desc: 'Напоминание за 2 часа', duration: '1:08' },
      { id: 2, lang: 'KZ', desc: 'Қабылдау туралы еске салу', duration: '1:15' },
      { id: 3, lang: 'RU', desc: 'Перенос записи', duration: '1:42' },
      { id: 4, lang: 'KZ/RU', desc: 'Отмена записи', duration: '1:28' },
      { id: 5, lang: 'RU', desc: 'Подтверждение визита', duration: '0:55' }
    ]
  },
  'feedback': {
    title: 'Оценка качества',
    recordings: [
      { id: 1, lang: 'RU', desc: 'Опрос после приёма', duration: '2:15' },
      { id: 2, lang: 'KZ', desc: 'Қабылдаудан кейінгі сауалнама', duration: '2:28' },
      { id: 3, lang: 'RU', desc: 'Оценка врача', duration: '1:45' },
      { id: 4, lang: 'KZ/RU', desc: 'Смешанный опрос', duration: '2:05' },
      { id: 5, lang: 'RU', desc: 'Развёрнутый отзыв', duration: '2:38' }
    ]
  }
}

const scenarios = [
  {
    id: 'adult-screening',
    icon: '🩺',
    iconBg: 'linear-gradient(135deg, #10b981, #059669)',
    title: 'Взрослый скрининг',
    desc: 'Приглашает население на запланированное скрининговое назначение. Робот отвечает на вопросы: куда подойти, когда, зачем, цена (бесплатно), откуда звоним.',
    tags: [{ text: '18+ лет' }, { text: 'Бесплатно', variant: 'cyan' }]
  },
  {
    id: 'child-screening',
    icon: '👶',
    iconBg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    title: 'Детский скрининг',
    desc: 'Приглашение родителей на профилактические осмотры детей. Робот информирует о дате, месте и списке специалистов.',
    tags: [{ text: '0-18 лет' }, { text: 'Педиатрия', variant: 'purple' }]
  },
  {
    id: 'vaccination',
    icon: '💉',
    iconBg: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    title: 'Вакцинация',
    desc: 'Приглашение на плановую и сезонную вакцинацию. Напоминание о второй дозе, ревакцинации и прививках по календарю.',
    tags: [{ text: 'Все возрасты' }, { text: 'Прививки', variant: 'cyan' }]
  },
  {
    id: 'fluorography',
    icon: '🫁',
    iconBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
    title: 'Флюорография',
    desc: 'Напоминание о ежегодном прохождении флюорографии. Информирование о месте и времени работы кабинета.',
    tags: [{ text: 'Ежегодно' }, { text: 'Туберкулёз' }]
  },
  {
    id: 'osms',
    icon: '🏥',
    iconBg: 'linear-gradient(135deg, #ef4444, #dc2626)',
    title: 'ОСМС',
    desc: 'Обзвон незастрахованных граждан. Информирование о необходимости оформления обязательного медицинского страхования и его преимуществах.',
    tags: [{ text: 'Страхование', variant: 'purple' }, { text: 'Обязательно' }]
  },
  {
    id: 'reminder',
    icon: '📅',
    iconBg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    title: 'Напоминание о приёме',
    desc: 'Робот звонит за 2 часа до приёма и напоминает о записи. Может перенести или отменить запись. Интеграция с DamuMed.',
    tags: [{ text: 'DamuMed', variant: 'purple' }, { text: 'Напоминание', variant: 'cyan' }]
  },
  {
    id: 'feedback',
    icon: '⭐',
    iconBg: 'linear-gradient(135deg, #ec4899, #db2777)',
    title: 'Оценка качества',
    desc: 'Робот звонит после приёма и собирает обратную связь: о враче, клинике, как прошёл приём. Формируется подробный дашборд с аналитикой.',
    tags: [{ text: 'NPS', variant: 'purple' }, { text: 'Дашборд' }]
  }
]

// Modal state
const isModalOpen = ref(false)
const currentScenario = ref(null)
const testPhone = ref('')

function openScenarioModal(scenarioId) {
  currentScenario.value = scenarioId
  isModalOpen.value = true
}

function closeScenarioModal() {
  isModalOpen.value = false
  testPhone.value = ''
}

function formatTestPhone(event) {
  let value = event.target.value.replace(/\D/g, '')
  if (value.length > 10) value = value.slice(0, 10)

  let formatted = ''
  if (value.length > 0) formatted = value.slice(0, 3)
  if (value.length > 3) formatted += ' ' + value.slice(3, 6)
  if (value.length > 6) formatted += ' ' + value.slice(6, 8)
  if (value.length > 8) formatted += ' ' + value.slice(8, 10)

  testPhone.value = formatted
}

function playRecording(scenarioId, recordingId) {
  showNotification('Воспроизведение записи...', 'info')
}

function requestTestCall() {
  const phone = testPhone.value.replace(/\s/g, '')

  if (phone.length < 10) {
    showNotification('Введите корректный номер телефона', 'error')
    return
  }

  showNotification('Робот позвонит вам в течение 30 секунд', 'success')
  closeScenarioModal()
}

function getLangClass(lang) {
  return 'lang-' + lang.toLowerCase().replace('/', '-')
}
</script>

<template>
  <div class="script-robot-page">
    <!-- Main Content -->
    <main class="script-demo">
      <!-- Hero Section -->
      <div class="script-hero animate-fadeInUp">
        <div class="hero-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </div>
        <h1><span class="text-gradient">Охват населения</span> за часы, не недели</h1>
        <p class="hero-desc">
          Массовые обзвоны по сценарию. Робот приглашает на скрининги, напоминает о вакцинации,
          собирает обратную связь. Охватите в 10 раз больше пациентов, чем вручную.
        </p>
        <div class="hero-stats">
          <div class="stat">
            <span class="stat-value">×10</span>
            <span class="stat-label">Охват населения</span>
          </div>
          <div class="stat">
            <span class="stat-value">5000+</span>
            <span class="stat-label">Звонков в час</span>
          </div>
          <div class="stat">
            <span class="stat-value">KZ/RU</span>
            <span class="stat-label">Два языка</span>
          </div>
        </div>
      </div>

      <!-- Scenarios Grid -->
      <div class="scenarios-section animate-fadeInUp stagger-2">
        <h2>Выберите сценарий</h2>
        <p class="section-desc">Каждый сценарий настроен под конкретную задачу</p>

        <div class="scenarios-grid">
          <div
            v-for="scenario in scenarios"
            :key="scenario.id"
            class="scenario-card"
          >
            <div class="scenario-icon" :style="{ background: scenario.iconBg }">
              <span>{{ scenario.icon }}</span>
            </div>
            <div class="scenario-content">
              <h3 class="scenario-title">{{ scenario.title }}</h3>
              <p class="scenario-desc">{{ scenario.desc }}</p>
              <div class="scenario-footer">
                <div class="scenario-tags">
                  <span
                    v-for="tag in scenario.tags"
                    :key="tag.text"
                    class="badge"
                    :class="tag.variant ? `badge-${tag.variant}` : ''"
                  >
                    {{ tag.text }}
                  </span>
                </div>
                <button class="btn btn-primary btn-sm" @click="openScenarioModal(scenario.id)">
                  Попробовать
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Section -->
      <div class="info-section animate-fadeInUp stagger-3">
        <div class="info-card">
          <h3>Как это работает?</h3>
          <ol class="steps-list">
            <li>Загрузите базу пациентов (Excel или из МИС)</li>
            <li>Выберите сценарий обзвона</li>
            <li>Настройте время и дату запуска</li>
            <li>Робот обзванивает всех автоматически</li>
            <li>Получайте отчёт в реальном времени</li>
          </ol>
        </div>
        <div class="info-card">
          <h3>Преимущества</h3>
          <ul class="features-list">
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              До 5000 звонков в час
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Два языка: казахский и русский
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Интеграция с DamuMed и МИС
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Детальная аналитика результатов
            </li>
          </ul>
        </div>
      </div>
    </main>

    <!-- Scenario Modal -->
    <Teleport to="body">
      <div v-if="isModalOpen" class="modal-overlay active" @click.self="closeScenarioModal">
        <div class="modal scenario-modal">
          <div class="modal-header">
            <h3 class="modal-title">{{ scenarioData[currentScenario]?.title }}</h3>
            <button class="modal-close" @click="closeScenarioModal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <!-- Recordings Section -->
            <div class="recordings-section">
              <h4>Примеры звонков</h4>
              <div class="recordings-list">
                <div
                  v-for="rec in scenarioData[currentScenario]?.recordings || []"
                  :key="rec.id"
                  class="recording-item"
                  @click="playRecording(currentScenario, rec.id)"
                >
                  <div class="recording-play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                  <div class="recording-info">
                    <div class="recording-desc">{{ rec.desc }}</div>
                    <div class="recording-meta">
                      <span class="recording-duration">{{ rec.duration }}</span>
                    </div>
                  </div>
                  <span class="lang-badge" :class="getLangClass(rec.lang)">{{ rec.lang }}</span>
                </div>
              </div>
            </div>

            <!-- Test Call Section -->
            <div class="test-call-section">
              <h4>Попробовать на себе</h4>
              <p class="test-call-desc">Оставьте номер — робот позвонит вам прямо сейчас</p>
              <div class="phone-input-group">
                <div class="phone-input">
                  <span class="phone-prefix">+7</span>
                  <input
                    type="tel"
                    :value="testPhone"
                    placeholder="XXX XXX XX XX"
                    maxlength="13"
                    @input="formatTestPhone"
                  >
                </div>
                <button class="btn btn-primary" @click="requestTestCall">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Позвонить мне
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.script-robot-page {
  min-height: calc(100vh - 140px);
  background: var(--bg-primary);
}

.script-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

/* Hero Section */
.script-hero {
  text-align: center;
  padding: var(--spacing-2xl) 0;
}

.hero-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-lg);
}

.hero-icon svg {
  width: 40px;
  height: 40px;
  stroke: white;
}

.script-hero h1 {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-md);
}

.hero-desc {
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: var(--spacing-2xl);
  margin-top: var(--spacing-xl);
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
}

/* Scenarios Section */
.scenarios-section {
  margin-top: var(--spacing-2xl);
}

.scenarios-section h2 {
  text-align: center;
  margin-bottom: var(--spacing-sm);
}

.section-desc {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
}

.scenarios-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

@media (max-width: 768px) {
  .scenarios-grid {
    grid-template-columns: 1fr;
  }

  .hero-stats {
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .script-hero h1 {
    font-size: 1.8rem;
  }
}

/* Scenario Card */
.scenario-card {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.scenario-card:hover {
  border-color: var(--accent-cyan);
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.scenario-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.8rem;
}

.scenario-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.scenario-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.scenario-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  flex: 1;
}

.scenario-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-top: auto;
  padding-top: var(--spacing-md);
}

.scenario-footer .btn {
  flex-shrink: 0;
}

.scenario-tags {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

/* Info Section */
.info-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
  margin-top: var(--spacing-2xl);
}

@media (max-width: 768px) {
  .info-section {
    grid-template-columns: 1fr;
  }
}

.info-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

.info-card h3 {
  margin-bottom: var(--spacing-lg);
  font-size: 1.2rem;
}

.steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
  counter-reset: step;
}

.steps-list li {
  position: relative;
  padding-left: 40px;
  margin-bottom: var(--spacing-md);
  color: var(--text-secondary);
  line-height: 1.5;
}

.steps-list li:last-child {
  margin-bottom: 0;
}

.steps-list li::before {
  counter-increment: step;
  content: counter(step);
  position: absolute;
  left: 0;
  top: 0;
  width: 28px;
  height: 28px;
  background: var(--accent-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--bg-primary);
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features-list li {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  color: var(--text-primary);
}

.features-list svg {
  color: var(--status-green);
  flex-shrink: 0;
}

/* Scenario Modal */
.scenario-modal {
  max-width: 560px;
  width: 100%;
}

.modal-body {
  padding: var(--spacing-lg);
}

.recordings-section {
  margin-bottom: var(--spacing-xl);
}

.recordings-section h4,
.test-call-section h4 {
  font-size: 1rem;
  margin-bottom: var(--spacing-md);
}

.recordings-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.recording-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.recording-item:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-cyan);
}

.recording-play {
  width: 36px;
  height: 36px;
  background: var(--accent-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.recording-play svg {
  margin-left: 2px;
}

.recording-info {
  flex: 1;
  min-width: 0;
}

.recording-desc {
  font-size: 0.9rem;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.recording-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.recording-duration {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.lang-badge {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.lang-ru {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.lang-kz {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.lang-kz-ru {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
}

/* Test Call Section */
.test-call-section {
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-default);
}

.test-call-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.phone-input-group {
  display: flex;
  gap: var(--spacing-md);
}

.phone-input {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.phone-prefix {
  padding: 0 var(--spacing-md);
  color: var(--text-muted);
  font-weight: 500;
  border-right: 1px solid var(--border-default);
  background: var(--bg-tertiary);
}

.phone-input input {
  flex: 1;
  padding: var(--spacing-md);
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1rem;
}

.phone-input input:focus {
  outline: none;
}

.phone-input input::placeholder {
  color: var(--text-muted);
}

@media (max-width: 500px) {
  .phone-input-group {
    flex-direction: column;
  }

  .phone-input-group .btn {
    width: 100%;
  }
}
</style>
