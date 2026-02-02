<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref('')
const currentDate = ref('')

let timeInterval = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  currentDate.value = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
}

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<template>
  <div class="terminal-page">
    <div class="container">
      <div class="terminal-demo">
        <!-- Info Panel -->
        <div class="info-panel animate-fadeInUp">
          <h2>Терминал самозаписи</h2>
          <p class="text-secondary">
            Пациенты записываются за 3 клика. Выбор врача, оплата Kaspi, талон — без очереди.
            Интегрирован с DamuMed.
          </p>

          <div class="stats-grid mt-xl">
            <div class="stat-card">
              <div class="stat-value text-gradient">3</div>
              <div class="stat-label">клика до записи</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-gradient">−60%</div>
              <div class="stat-label">нагрузка на регистратуру</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-gradient">24/7</div>
              <div class="stat-label">доступность</div>
            </div>
          </div>

          <ul class="features-list mt-xl">
            <li v-for="feature in ['Голосовой ввод и управление', 'Оплата через Kaspi QR', 'Печать талона на месте', 'Интеграция с МИС', 'Работа без интернета']" :key="feature">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {{ feature }}
            </li>
          </ul>
        </div>

        <!-- Kiosk Mockup -->
        <div class="kiosk-mockup animate-fadeInUp stagger-2">
          <div class="kiosk-bezel">
            <div class="kiosk-screen">
              <div class="kiosk-time">{{ currentTime }}</div>
              <div class="kiosk-date">{{ currentDate }}</div>

              <div class="kiosk-video">
                <div class="kiosk-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <p>Здравствуйте!</p>
                <p class="text-secondary" style="font-size: 0.9rem;">Нажмите, чтобы начать запись</p>
              </div>

              <div class="kiosk-actions">
                <button class="kiosk-btn kiosk-btn-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Записаться на приём
                </button>
                <div class="kiosk-lang">
                  <button class="kiosk-lang-btn active">KZ</button>
                  <button class="kiosk-lang-btn">RU</button>
                </div>
              </div>
            </div>
          </div>
          <div class="kiosk-bottom">
            <div class="kiosk-printer">
              <div class="printer-slot"></div>
              <span>Принтер талонов</span>
            </div>
            <div class="kiosk-payment">
              <div class="kaspi-logo">Kaspi</div>
              <span>Оплата QR</span>
            </div>
          </div>
          <div class="kiosk-stand"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.terminal-page {
  min-height: calc(100vh - 140px);
  padding: var(--spacing-xl) 0;
}

.terminal-demo {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--spacing-2xl);
  align-items: start;
}

@media (max-width: 900px) {
  .terminal-demo {
    grid-template-columns: 1fr;
  }
}

.info-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.stat-card {
  text-align: center;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

.features-list {
  list-style: none;
}

.features-list li {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  color: var(--text-secondary);
}

.features-list svg {
  color: var(--accent-cyan);
  flex-shrink: 0;
}

/* Kiosk Mockup */
.kiosk-mockup {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.kiosk-bezel {
  width: 360px;
  background: #1a1a1a;
  border-radius: 20px;
  padding: 20px;
  box-shadow: var(--shadow-lg);
}

.kiosk-screen {
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-radius: 12px;
  padding: var(--spacing-lg);
  min-height: 450px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.kiosk-time {
  font-size: 3rem;
  font-weight: 700;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.kiosk-date {
  color: var(--text-secondary);
  text-transform: capitalize;
  margin-bottom: var(--spacing-xl);
}

.kiosk-video {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.kiosk-avatar {
  width: 80px;
  height: 80px;
  background: var(--accent-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.kiosk-avatar svg {
  width: 40px;
  height: 40px;
  stroke: white;
}

.kiosk-actions {
  width: 100%;
  margin-top: auto;
}

.kiosk-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.kiosk-btn-primary {
  background: var(--accent-gradient);
  color: white;
  border: none;
  box-shadow: var(--glow-cyan);
}

.kiosk-btn-primary:hover {
  transform: translateY(-2px);
}

.kiosk-lang {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.kiosk-lang-btn {
  padding: 8px 20px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.kiosk-lang-btn.active {
  background: var(--accent-cyan-dim);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.kiosk-bottom {
  display: flex;
  justify-content: space-between;
  width: 320px;
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: #1a1a1a;
  border-radius: 12px;
}

.kiosk-printer, .kiosk-payment {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.printer-slot {
  width: 80px;
  height: 6px;
  background: #333;
  border-radius: 3px;
}

.kaspi-logo {
  padding: 4px 12px;
  background: #f14635;
  color: white;
  font-weight: 700;
  border-radius: 4px;
  font-size: 0.8rem;
}

.kiosk-stand {
  width: 60px;
  height: 100px;
  background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
  margin-top: -10px;
  border-radius: 0 0 10px 10px;
}
</style>
