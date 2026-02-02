<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useNotification } from '@/composables/useNotification'

const { show } = useNotification()

const messages = ref([])
const inputText = ref('')
const botStatus = ref('онлайн')
const isTyping = ref(false)

const appointmentData = {
  doctor: 'Иванов А.П.',
  specialty: 'Терапевт',
  date: 'завтра',
  time: '10:00',
  address: 'ул. Абая 52, каб. 305'
}

const botResponses = {
  confirm: ['Отлично! Ваш приём подтверждён.', 'Ждём вас завтра в 10:00.', 'Не забудьте взять удостоверение личности.'],
  reschedule: {
    prompt: 'На какой день вы хотели бы перенести приём?',
    options: ['Понедельник 10:00', 'Вторник 14:30', 'Среда 11:00', 'Другое время'],
    success: 'Готово! Ваш приём перенесён на {date}. Напоминание придёт за день до визита.'
  },
  cancel: {
    prompt: 'Вы уверены, что хотите отменить приём?',
    options: ['Да, отменить', 'Нет, оставить'],
    success: 'Ваш приём отменён. Если захотите записаться снова, напишите нам.',
    keepAppointment: 'Хорошо, ваш приём остаётся в силе. Ждём вас завтра в 10:00!'
  },
  preparation: 'Для приёма у терапевта:\n\n• Особой подготовки не требуется\n• Возьмите удостоверение личности\n• Если есть — результаты предыдущих анализов\n• Приходите за 10 минут до назначенного времени',
  address: 'Клиника MedContact:\n\n📍 г. Алматы, ул. Абая 52, 3 этаж\n🕐 Работаем с 8:00 до 20:00\n📞 +7 700 123 45 67\n\nКак добраться: 5 минут от станции метро Абая',
  unknown: 'Извините, я не совсем понял ваш вопрос. Вот что я могу:\n\n• Подтвердить приём\n• Перенести на другое время\n• Отменить запись\n• Рассказать о подготовке\n• Дать адрес клиники'
}

const formatTime = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

const scrollToBottom = async () => {
  await nextTick()
  const chat = document.querySelector('.wa-chat')
  if (chat) chat.scrollTop = chat.scrollHeight
}

const addBotMessage = async (text, quickActions = null) => {
  botStatus.value = 'печатает...'
  isTyping.value = true
  await scrollToBottom()

  await new Promise(resolve => setTimeout(resolve, 1500))

  isTyping.value = false
  botStatus.value = 'онлайн'

  messages.value.push({
    id: Date.now(),
    sender: 'bot',
    text,
    quickActions,
    time: formatTime(),
    actionsDisabled: false
  })
  await scrollToBottom()
}

const addUserMessage = async (text) => {
  messages.value.push({
    id: Date.now(),
    sender: 'user',
    text,
    time: formatTime()
  })
  await scrollToBottom()
}

const disableQuickActions = (msgId) => {
  const msg = messages.value.find(m => m.id === msgId)
  if (msg) msg.actionsDisabled = true
}

const handleQuickAction = async (action, msgId) => {
  disableQuickActions(msgId)
  await addUserMessage(action)

  await new Promise(resolve => setTimeout(resolve, 500))

  if (action.includes('Подтвердить')) {
    await addBotMessage(
      botResponses.confirm.join('\n\n') + '\n\n💡 Есть вопросы по подготовке к приёму?',
      ['Как подготовиться?', 'Где находится клиника?', 'Всё понятно, спасибо!']
    )
  } else if (action.includes('Перенести')) {
    await addBotMessage(botResponses.reschedule.prompt, botResponses.reschedule.options)
  } else if (action.includes('Отменить')) {
    await addBotMessage(botResponses.cancel.prompt, botResponses.cancel.options)
  } else if (action.includes('Понедельник') || action.includes('Вторник') || action.includes('Среда')) {
    const message = botResponses.reschedule.success.replace('{date}', action)
    await addBotMessage(message + '\n\n✅ Запись обновлена')
  } else if (action === 'Другое время') {
    await addBotMessage('Напишите удобную дату и время, и я проверю доступность.')
  } else if (action === 'Да, отменить') {
    await addBotMessage(botResponses.cancel.success)
  } else if (action === 'Нет, оставить') {
    await addBotMessage(botResponses.cancel.keepAppointment)
  } else if (action.includes('подготовиться')) {
    await addBotMessage(botResponses.preparation)
  } else if (action.includes('клиника') || action.includes('находится')) {
    await addBotMessage(botResponses.address)
  } else if (action.includes('спасибо') || action.includes('понятно')) {
    await addBotMessage('Всегда рады помочь! Если будут вопросы — пишите. Хорошего дня! 😊')
  }
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text) return

  inputText.value = ''
  await addUserMessage(text)
  await processUserInput(text)
}

const processUserInput = async (text) => {
  const lowerText = text.toLowerCase()

  await new Promise(resolve => setTimeout(resolve, 500))

  if (lowerText.includes('подготов') || lowerText.includes('готовиться')) {
    await addBotMessage(botResponses.preparation)
  } else if (lowerText.includes('адрес') || lowerText.includes('где') || lowerText.includes('находит')) {
    await addBotMessage(botResponses.address)
  } else if (lowerText.includes('спасибо') || lowerText.includes('понятно') || lowerText.includes('ясно')) {
    await addBotMessage('Всегда рады помочь! Если будут вопросы — пишите. Хорошего дня! 😊')
  } else if (lowerText.includes('привет') || lowerText.includes('здравствуй')) {
    await addBotMessage('Здравствуйте! Чем могу помочь?', ['Подтвердить приём', 'Узнать адрес', 'Задать вопрос'])
  } else if (lowerText.includes('подтверд')) {
    await addBotMessage(
      botResponses.confirm.join('\n\n') + '\n\n💡 Есть вопросы по подготовке к приёму?',
      ['Как подготовиться?', 'Где находится клиника?', 'Всё понятно, спасибо!']
    )
  } else if (lowerText.includes('перенес') || lowerText.includes('другое время') || lowerText.includes('другой день')) {
    await addBotMessage(botResponses.reschedule.prompt, botResponses.reschedule.options)
  } else if (lowerText.includes('отмен')) {
    await addBotMessage(botResponses.cancel.prompt, botResponses.cancel.options)
  } else {
    await addBotMessage(botResponses.unknown)
  }
}

const resetChat = async () => {
  messages.value = []
  show('Диалог сброшен', 'success')
  await startInitialScenario()
}

const startInitialScenario = async () => {
  await new Promise(resolve => setTimeout(resolve, 800))
  await addBotMessage(
    `Здравствуйте! Напоминаем о приёме завтра в 10:00.\n\n👨‍⚕️ Врач: ${appointmentData.doctor}\n📋 Специальность: ${appointmentData.specialty}\n📍 Адрес: ${appointmentData.address}`,
    ['Подтвердить ✓', 'Перенести 📅', 'Отменить ✕']
  )
}

onMounted(() => {
  startInitialScenario()
})
</script>

<template>
  <div class="whatsapp-page">
    <div class="container">
      <main class="whatsapp-demo">
        <!-- Info Panel -->
        <div class="info-panel animate-fadeInUp">
          <h2>
            <span style="color: #25D366;">WhatsApp</span> бот
          </h2>
          <p>
            Генеративный чат-бот с базой знаний клиники. Напоминания, подтверждение, перенос записи. Интегрирован с DamuMed и МИС.
          </p>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: var(--spacing-sm);">
            Попробуйте прямо здесь или напишите на WhatsApp
          </p>

          <div class="qr-section">
            <div class="qr-code"></div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--spacing-md);">
              Отсканируйте для начала диалога
            </p>
            <div class="phone-number">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              +7 700 123 45 67
            </div>
            <div class="bot-status">
              <span class="status-dot" style="background: #25D366; width: 8px; height: 8px; border-radius: 50%;"></span>
              <span>Бот онлайн</span>
            </div>
          </div>

          <ul class="features-list">
            <li v-for="feature in ['Отвечает по базе знаний клиники', 'Интеграция с DamuMed', 'Напоминания и подтверждение записи', 'Ответы на вопросы о подготовке', 'Работа с любой МИС']" :key="feature">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {{ feature }}
            </li>
          </ul>

          <button class="btn btn-secondary mt-lg" @click="resetChat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 4v6h6"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Сбросить диалог
          </button>
        </div>

        <!-- iPhone Mockup -->
        <div class="iphone-mockup animate-fadeInUp stagger-2">
          <div class="iphone-screen">
            <!-- WhatsApp Header -->
            <div class="wa-header">
              <div class="wa-back">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </div>
              <div class="wa-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                </svg>
              </div>
              <div class="wa-contact">
                <div class="wa-contact-name">MedContact</div>
                <div class="wa-contact-status">{{ botStatus }}</div>
              </div>
              <div class="wa-actions">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 7l-7 5 7 5V7z"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3"/>
                </svg>
              </div>
            </div>

            <!-- Chat Area -->
            <div class="wa-chat">
              <div class="wa-date-divider">
                <span>Сегодня</span>
              </div>

              <div v-for="msg in messages" :key="msg.id" class="wa-message" :class="msg.sender === 'bot' ? 'incoming' : 'outgoing'">
                <div style="white-space: pre-line;">{{ msg.text }}</div>
                <div v-if="msg.quickActions && !msg.actionsDisabled" class="wa-quick-actions">
                  <button v-for="action in msg.quickActions" :key="action" class="wa-quick-btn" @click="handleQuickAction(action, msg.id)">
                    {{ action }}
                  </button>
                </div>
                <div class="wa-message-time">
                  {{ msg.time }}
                  <span v-if="msg.sender === 'user'" class="wa-check">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                </div>
              </div>

              <div v-if="isTyping" class="wa-typing">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
              </div>
            </div>

            <!-- Input Area -->
            <div class="wa-input-area">
              <div class="wa-emoji">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              <div class="wa-input-wrapper">
                <input v-model="inputText" type="text" placeholder="Сообщение" @keypress.enter="sendMessage">
              </div>
              <div class="wa-send-btn" @click="sendMessage">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
            </div>
          </div>

          <button class="reset-chat-btn" @click="resetChat" title="Сбросить диалог">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 4v6h6"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.whatsapp-page {
  min-height: calc(100vh - 140px);
  padding: var(--spacing-xl) 0;
}

.whatsapp-demo {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--spacing-2xl);
  align-items: start;
}

@media (max-width: 900px) {
  .whatsapp-demo {
    grid-template-columns: 1fr;
  }
}

.info-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
}

.info-panel h2 {
  margin-bottom: var(--spacing-md);
}

.info-panel > p {
  color: var(--text-secondary);
  line-height: 1.6;
}

.qr-section {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  text-align: center;
}

.qr-code {
  width: 120px;
  height: 120px;
  background: white;
  border-radius: var(--radius-md);
  margin: 0 auto var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
                    linear-gradient(-45deg, #ccc 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #ccc 75%),
                    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}

.phone-number {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-size: 1.1rem;
  font-weight: 600;
  color: #25D366;
  margin-bottom: var(--spacing-sm);
}

.bot-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.features-list {
  list-style: none;
  margin-top: var(--spacing-xl);
}

.features-list li {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  color: var(--text-secondary);
}

.features-list svg {
  color: #25D366;
  flex-shrink: 0;
}

/* iPhone Mockup */
.iphone-mockup {
  position: relative;
  width: 375px;
  height: 700px;
  background: #1a1a1a;
  border-radius: 45px;
  padding: 15px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.iphone-screen {
  width: 100%;
  height: 100%;
  background: #0b141a;
  border-radius: 35px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* WhatsApp Header */
.wa-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 12px;
  background: #1f2c34;
}

.wa-back {
  color: #00a884;
}

.wa-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #00a884, #128C7E);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wa-avatar svg {
  width: 20px;
  height: 20px;
  stroke: white;
}

.wa-contact {
  flex: 1;
}

.wa-contact-name {
  font-weight: 500;
  color: white;
}

.wa-contact-status {
  font-size: 0.75rem;
  color: #8696a0;
}

.wa-actions {
  display: flex;
  gap: var(--spacing-md);
  color: #8696a0;
}

/* Chat Area */
.wa-chat {
  flex: 1;
  padding: var(--spacing-md);
  overflow-y: auto;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.wa-date-divider {
  display: flex;
  justify-content: center;
  margin: var(--spacing-md) 0;
}

.wa-date-divider span {
  background: #1d282f;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  color: #8696a0;
}

.wa-message {
  max-width: 85%;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  animation: fadeInUp 0.3s ease;
}

.wa-message.incoming {
  background: #1f2c34;
  color: white;
  border-top-left-radius: 0;
  margin-right: auto;
}

.wa-message.outgoing {
  background: #005c4b;
  color: white;
  border-top-right-radius: 0;
  margin-left: auto;
}

.wa-message-time {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: 0.65rem;
  color: #8696a0;
  margin-top: 4px;
}

.wa-check {
  color: #53bdeb;
}

.wa-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.wa-quick-btn {
  padding: 6px 12px;
  background: #0b141a;
  border: 1px solid #2a3942;
  border-radius: 20px;
  color: #00a884;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.wa-quick-btn:hover {
  background: #1f2c34;
  border-color: #00a884;
}

.wa-typing {
  display: flex;
  gap: 4px;
  padding: 12px;
  background: #1f2c34;
  border-radius: 8px;
  border-top-left-radius: 0;
  width: fit-content;
  margin-bottom: 8px;
}

.wa-typing .dot {
  width: 8px;
  height: 8px;
  background: #8696a0;
  border-radius: 50%;
  animation: typing 1.4s ease-in-out infinite;
}

.wa-typing .dot:nth-child(2) { animation-delay: 0.2s; }
.wa-typing .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
  30% { transform: translateY(-4px); opacity: 1; }
}

/* Input Area */
.wa-input-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #1f2c34;
}

.wa-emoji {
  color: #8696a0;
  cursor: pointer;
}

.wa-input-wrapper {
  flex: 1;
  background: #2a3942;
  border-radius: 20px;
  padding: 8px 16px;
}

.wa-input-wrapper input {
  width: 100%;
  background: none;
  border: none;
  color: white;
  font-size: 0.9rem;
}

.wa-input-wrapper input::placeholder {
  color: #8696a0;
}

.wa-input-wrapper input:focus {
  outline: none;
}

.wa-send-btn {
  width: 40px;
  height: 40px;
  background: #00a884;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.wa-send-btn:hover {
  background: #00c897;
}

.reset-chat-btn {
  position: absolute;
  bottom: -50px;
  right: 10px;
  width: 40px;
  height: 40px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.reset-chat-btn:hover {
  color: var(--accent-cyan);
  border-color: var(--accent-cyan);
}
</style>
