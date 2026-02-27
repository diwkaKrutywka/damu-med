<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotification } from '@/composables/useNotification'
import { useLanguage } from '@/composables/useLanguage'

const { show } = useNotification()
const { t } = useI18n()
const { language } = useLanguage()

// State
const screen = ref('setup') // setup, realtime
const sessionId = ref(null)
const phone = ref('')
const operatorPhone = ref('')
const stage = ref('connecting') // connecting, active, doctors, calendar, faq, confirmation
const showWaitingModal = ref(false)
const isConnected = ref(false)
const callTime = ref(0)
const messages = ref([])
const logs = ref([])
const selectedDoctor = ref(null)
const selectedDate = ref(null)
const selectedTime = ref(null)
const kbQuery = ref('')
const kbResult = ref(null)
const activeKbTopic = ref(null)
const currentIntent = ref('')
const isTyping = ref(false)
const partialBotText = ref('')
const partialUserText = ref('')
const currentFunction = ref(null) // { name, args, result }
const audioQueue = ref([])
const isPlayingAudio = ref(false)
const lastBotText = ref('') // Для отслеживания уже показанного текста
const transcriptRef = ref(null) // Реф для контейнера сообщений
const logsRef = ref(null) // Реф для контейнера логов
let typingInterval = null // Интервал для эффекта печатания
let currentTypingMsgId = null // ID текущего печатаемого сообщения

// Данные из API функций
const specialtiesList = ref([]) // Список специальностей
const doctorsList = ref([]) // Список врачей
const availableSlots = ref([]) // Доступные временные слоты
const appointmentData = ref(null) // Данные созданной записи
const appointmentError = ref(false) // Ошибка создания записи
const transferReason = ref('') // Причина перевода на оператора
const functionLoading = ref(false) // Индикатор загрузки функции
const slotsDate = ref(null) // Выбранная дата из API get_available_slots

let timerInterval = null
let demoTimeouts = []
let websocket = null
let audioStream = null
let audioContext = null
let audioWorklet = null
let sourceNode = null

// Mock Data
const doctors = [
  { id: 1, name: 'Иванов А.П.', specialty: 'Терапевт', rating: 4.9, avatar: 'ИА' },
  { id: 2, name: 'Петрова М.С.', specialty: 'Кардиолог', rating: 4.8, avatar: 'ПМ' },
  { id: 3, name: 'Сидоров К.В.', specialty: 'Невролог', rating: 4.7, avatar: 'СК' },
  { id: 4, name: 'Козлова Е.И.', specialty: 'Эндокринолог', rating: 4.9, avatar: 'КЕ' }
]

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

const formatOperatorPhoneInput = (e) => {
  let digits = e.target.value.replace(/\D/g, '').substring(0, 10)
  let formatted = ''
  if (digits.length > 0) formatted = digits.substring(0, 3)
  if (digits.length > 3) formatted += ' ' + digits.substring(3, 6)
  if (digits.length > 6) formatted += ' ' + digits.substring(6, 8)
  if (digits.length > 8) formatted += ' ' + digits.substring(8, 10)
  operatorPhone.value = formatted
}

const generateSessionId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const openSession = () => {
  const phoneDigits = phone.value.replace(/\s/g, '')
  if (phoneDigits.length < 10) {
    show(t('voiceRobot.notifications.invalidPhone'), 'error')
    return
  }

  sessionId.value = generateSessionId()
  showWaitingModal.value = true

  // Подключение к WebSocket
  const wsUrl = `ws://78.40.109.44:8000/ws/front/${sessionId.value}`
  websocket = new WebSocket(wsUrl)

  websocket.onopen = () => {
    console.log('WebSocket подключен')
    addLog('system', '🔌 WebSocket подключен')
    // Отправляем номер телефона для регистрации
    const phoneNumber = '+7' + phoneDigits
    websocket.send(JSON.stringify({
      type: 'register_phone_number',
      phone_number: phoneNumber
    }))
    addLog('system', `📱 Отправлен номер: ${phoneNumber}`)
    websocket.send(JSON.stringify({
      type: 'register_language_code',
      language_code: language.value
    }))
    addLog('system', `🌐 Отправлен язык: ${language.value}`)
    const operatorDigits = operatorPhone.value.replace(/\s/g, '')
    if (operatorDigits.length === 10) {
      const operatorNumber = '+7' + operatorDigits
      websocket.send(JSON.stringify({
        type: 'register_operator_phone_number',
        phone_number: operatorNumber
      }))
      addLog('system', `📱 Отправлен номер оператора: ${operatorNumber}`)
    }
  }

  websocket.onmessage = (event) => {
    console.log('=== RAW WebSocket message ===')
    console.log('event.data:', event.data)
    console.log('event.data type:', typeof event.data)
    try {
      const data = JSON.parse(event.data)
      console.log('Parsed data:', data)
      handleWebSocketMessage(data)
    } catch (e) {
      console.log('JSON parse error:', e)
      console.log('Получено текстовое сообщение:', event.data)
    }
  }

  websocket.onerror = (error) => {
    console.error('WebSocket ошибка:', error)
    addLog('system', '❌ Ошибка подключения')
    show(t('voiceRobot.notifications.connectionError'), 'error')
    showWaitingModal.value = false
  }

  websocket.onclose = () => {
    console.log('WebSocket отключен')
    addLog('system', '🔌 WebSocket отключен')
    isConnected.value = false
    stopMicrophone()
  }
}

// Парсинг времени из текста бота (например "Свободно в 09:00, 09:30, 10:00")
const parseTimesFromText = (text) => {
  if (!text) return []
  // Ищем все времена в формате HH:MM или H:MM
  const timeRegex = /\b(\d{1,2}:\d{2})\b/g
  const matches = text.match(timeRegex)
  return matches || []
}

// Форматирование даты в YYYY-MM-DD без UTC сдвига
const formatDateLocal = (date) => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Парсинг даты из текста (например "на 9 февраля", "сегодня", "завтра", "послезавтра")
const parseDateFromText = (text) => {
  if (!text) return null

  const today = new Date()
  const months = {
    'январ': 0, 'феврал': 1, 'март': 2, 'апрел': 3, 'ма': 4, 'июн': 5,
    'июл': 6, 'август': 7, 'сентябр': 8, 'октябр': 9, 'ноябр': 10, 'декабр': 11
  }

  // "сегодня" или "на сегодня"
  if (/(?:на\s+)?сегодня/i.test(text)) {
    return formatDateLocal(today)
  }

  // "послезавтра" или "на послезавтра" (ВАЖНО: проверять ДО "завтра"!)
  if (/(?:на\s+)?послезавтра/i.test(text)) {
    const dayAfter = new Date(today)
    dayAfter.setDate(dayAfter.getDate() + 2)
    return formatDateLocal(dayAfter)
  }

  // "завтра" или "на завтра"
  if (/(?:на\s+)?завтра/i.test(text)) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return formatDateLocal(tomorrow)
  }

  // "на 9 февраля" или "9 февраля"
  const dateMatch = text.match(/(?:на\s+)?(\d{1,2})\s+(январ|феврал|март|апрел|ма[йя]|июн|июл|август|сентябр|октябр|ноябр|декабр)\w*/i)
  if (dateMatch) {
    const day = parseInt(dateMatch[1])
    const monthPrefix = dateMatch[2].toLowerCase().substring(0, 3)
    let month = null
    for (const [prefix, m] of Object.entries(months)) {
      if (prefix.startsWith(monthPrefix) || monthPrefix.startsWith(prefix.substring(0, 3))) {
        month = m
        break
      }
    }
    if (month !== null) {
      const year = today.getFullYear()
      const date = new Date(year, month, day)
      // Если дата в прошлом, берём следующий год
      if (date < today) {
        date.setFullYear(year + 1)
      }
      return formatDateLocal(date)
    }
  }

  return null
}

// Проверяем, говорит ли бот о свободных слотах
const checkBotTextForSlots = (text) => {
  if (!text) return

  // Если текст - JSON строка, извлекаем answer
  let actualText = text
  if (typeof text === 'string' && text.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(text)
      actualText = parsed.answer || parsed.text || text
    } catch (e) {
      // Не JSON, используем как есть
    }
  }

  // Ищем паттерны типа "свободно", "есть 9:00", "доступно"
  // Также проверяем времена + дата (сегодня/завтра/послезавтра/на 8 февраля)
  const times = parseTimesFromText(actualText)
  const hasSlotKeywords = /свободн|есть\s+\d{1,2}:\d{2}|есть\s+врем|доступн|можем\s+записать|окошк/i.test(actualText) ||
                          (times.length > 0 && /(?:на\s+)?(?:сегодня|завтра|послезавтра|\d{1,2}\s+(?:январ|феврал|март|апрел|ма[йя]|июн|июл|август|сентябр|октябр|ноябр|декабр))/i.test(actualText))

  if (hasSlotKeywords && times.length > 0) {
    console.log('=== BOT TEXT HAS SLOTS ===')
    console.log('Text:', actualText)
    console.log('Parsed times:', times)

    // Пробуем получить дату из текста
    const dateFromText = parseDateFromText(actualText)
    console.log('Date from text:', dateFromText)

    // Если нашли дату, обновляем визуализацию (но не перезаписываем confirmation!)
    if (dateFromText && stage.value !== 'confirmation') {
      stage.value = 'calendar'
      slotsDate.value = dateFromText
      availableSlots.value = times.map(time => ({
        time: time,
        is_available: true,
        date: dateFromText
      }))
      console.log('Updated slotsDate:', slotsDate.value)
      console.log('Updated availableSlots:', availableSlots.value)
    }
  }
}

// Обработка данных функции (вызывается когда приходит data.function)
const processFunctionData = (func, botText = null) => {
  console.log('=== processFunctionData ===')
  console.log('func:', func)

  if (!func || !func.name) return

  // Парсим результат если это строка JSON
  let parsedResult = func.result
  if (typeof parsedResult === 'string') {
    try {
      parsedResult = JSON.parse(parsedResult)
    } catch (e) {
      // Оставляем как строку
    }
  }

  console.log('Function name:', func.name)
  console.log('Parsed result:', parsedResult)

  // Обновляем currentFunction для отображения карточки
  let parsedArgs = {}
  try {
    parsedArgs = typeof func.args === 'string' ? JSON.parse(func.args) : func.args
  } catch (e) {
    parsedArgs = { raw: func.args }
  }
  currentFunction.value = {
    name: func.name,
    args: parsedArgs,
    result: parsedResult
  }

  // Обрабатываем в зависимости от функции
  switch (func.name) {
    case 'get_specialties':
      stage.value = 'specialties'
      specialtiesList.value = Array.isArray(parsedResult) ? parsedResult : []
      break

    case 'get_doctors':
    case 'get_doctors_by_specialty':
      stage.value = 'doctors'
      doctorsList.value = Array.isArray(parsedResult) ? parsedResult : []
      break

    case 'get_available_slots':
    case 'get_doctor_schedule':
      {
        // Не перезаписываем confirmation
        if (stage.value === 'confirmation') break

        console.log('=== PROCESSING SLOTS ===')
        stage.value = 'calendar'

        // Дату берём из аргументов функции (fallback)
        const argsDate = parsedArgs.schedule_date || parsedArgs.date || null

        const allSlots = []

        if (Array.isArray(parsedResult)) {
          // Массив объектов-расписаний [{doctor_id, date, slots: [...]}, ...]
          slotsDate.value = parsedResult[0]?.date || parsedResult[0]?.schedule_date || argsDate
          parsedResult.forEach(item => {
            if (item.slots && Array.isArray(item.slots)) {
              item.slots.forEach(slot => {
                if (slot.is_available) {
                  allSlots.push({
                    ...slot,
                    doctor_id: item.doctor_id,
                    date: item.date || item.schedule_date || slotsDate.value
                  })
                }
              })
            }
          })
        } else if (parsedResult && typeof parsedResult === 'object') {
          // Один объект: {doctor_id, date, clinic_id, slots: [...]}
          slotsDate.value = parsedResult.date || parsedResult.schedule_date || argsDate
          const flatSlots = parsedResult.slots || parsedResult.data || parsedResult.result || []
          if (Array.isArray(flatSlots)) {
            flatSlots.forEach(slot => {
              if (slot.is_available) {
                allSlots.push({
                  ...slot,
                  doctor_id: parsedResult.doctor_id,
                  date: slotsDate.value
                })
              }
            })
          }
        } else {
          slotsDate.value = argsDate
        }

        console.log('slotsDate from args/result:', slotsDate.value)
        console.log('botText:', botText)

        // Если слотов нет из результата, парсим из текста бота
        if (allSlots.length === 0 && botText) {
          const timesFromText = parseTimesFromText(botText)
          console.log('Parsed times from bot text:', timesFromText)
          timesFromText.forEach(time => {
            allSlots.push({
              time: time,
              is_available: true,
              date: slotsDate.value
            })
          })
        }

        availableSlots.value = allSlots
        console.log('availableSlots:', allSlots)
      }
      break

    case 'create_appointment':
    case 'book_appointment':
      console.log('=== CREATE APPOINTMENT (processFunctionData) ===')
      console.log('Setting appointmentData to:', parsedResult)
      appointmentData.value = parsedResult
      stage.value = 'confirmation'
      console.log('appointmentData.value is now:', appointmentData.value)
      console.log('stage is now:', stage.value)
      // НЕ обнуляем currentFunction здесь - сделаем это в function_ended
      break
  }

  // Скрываем карточку функции через 3 секунды
  if (func.name !== 'create_appointment' && func.name !== 'book_appointment') {
    setTimeout(() => {
      if (currentFunction.value && currentFunction.value.name === func.name) {
        currentFunction.value = null
      }
    }, 3000)
  }
}

const handleWebSocketMessage = (data) => {
  console.log('=== WS MESSAGE ===')
  console.log('WS data:', data)
  console.log('WS data.type:', data.type)
  console.log('WS keys:', Object.keys(data))

  // Проверяем есть ли function в любом сообщении (кроме function_ended - он обрабатывается отдельно)
  if (data.function && data.type !== 'function_ended') {
    console.log('!!! FOUND function in message !!!', data.function)
    // Передаём текст бота (может быть в data.text) для парсинга времени
    processFunctionData(data.function, data.text || null)
  }

  // Если сообщение без type но с answer - это ответ бота
  if (!data.type && data.answer) {
    addMessage('robot', data.answer)
    // Проверяем текст на наличие информации о слотах
    checkBotTextForSlots(data.answer)
    // Если есть аудио - воспроизводим
    if (data.audio) {
      audioQueue.value.push(data.audio)
      playAudioQueue()
    }
    return
  }

  // Если есть user_text - это распознанная речь пользователя
  if (!data.type && data.user_text) {
    addMessage('user', data.user_text)
    return
  }

  switch (data.type) {
    // Статус-лог (ответ на register_phone_number и др.)
    case 'status_log':
      addLog('system', data.message)
      break

    // Звонок поступает (идут гудки)
    case 'call_ringing':
      addLog('system', `📞 Звонок: ${data.caller_number} → ${data.did_number}`)
      break

    // Звонок начался — открываем сессию
    case 'call_started':
      addLog('system', '🤖 ' + (data.message || 'Звонок активен'))
      showWaitingModal.value = false
      isConnected.value = true
      startRealtimeDemo()
      startMicrophone()
      break

    // Звонок завершён
    case 'call_ended':
      addLog('system', '📞 ' + (data.message || 'Звонок завершён'))
      stopTimer()
      isConnected.value = false
      stopMicrophone()
      break

    // Логи для нижней панели
    case 'log':
      addLog('system', data.message)
      break

    // Индикатор печати
    case 'typing':
      isTyping.value = data.value
      // Когда бот начинает печатать - добавляем текст пользователя и сбрасываем
      if (data.value === true) {
        // Если есть накопленный текст пользователя - добавляем как сообщение
        if (partialUserText.value) {
          addMessage('user', partialUserText.value)
          partialUserText.value = ''
        }
        lastBotText.value = ''
      }
      break

    // Частичный текст бота (стриминг)
    case 'bot_text_partial':
      partialBotText.value = data.text
      break

    // Финальный текст бота
    case 'bot_text':
      partialBotText.value = ''
      // Сервер может отправлять текст как объект с полем answer или как строку
      const botTextMsg = typeof data.text === 'object' ? data.text.answer : (data.answer || data.text)
      addMessage('robot', botTextMsg)
      // Проверяем текст на наличие информации о слотах
      checkBotTextForSlots(botTextMsg)
      break

    // Аудио чанк от бота (оба варианта)
    case 'bot_audio_chunk':
    case 'audio':
      // Добавляем аудио в очередь
      if (data.audio) {
        audioQueue.value.push(data.audio)
        playAudioQueue()
      }
      // Проверяем текст на наличие информации о слотах
      if (data.text) {
        checkBotTextForSlots(data.text)
      }
      break

    // Частичный текст пользователя
    case 'user_text_partial':
      partialUserText.value = data.text
      break

    // Финальный текст пользователя
    case 'user_text_final':
      partialUserText.value = ''
      addMessage('user', data.text)
      break

    // Функция начала выполняться
    case 'function_started':
      {
        let parsedArgs = {}
        try {
          parsedArgs = typeof data.function.args === 'string'
            ? JSON.parse(data.function.args)
            : data.function.args
        } catch (e) {
          parsedArgs = { raw: data.function.args }
        }
        currentFunction.value = {
          name: data.function.name,
          args: parsedArgs,
          result: null
        }
        functionLoading.value = true
        addLog('mis', `🔍 Вызов: ${data.function.name}`)

        // Меняем stage в зависимости от функции
        switch (data.function.name) {
          case 'search_knowledge_base':
            stage.value = 'faq'
            kbQuery.value = parsedArgs.query || ''
            kbResult.value = null
            break
          case 'get_specialties':
            stage.value = 'specialties'
            specialtiesList.value = []
            break
          case 'get_doctors':
          case 'get_doctors_by_specialty':
            stage.value = 'doctors'
            doctorsList.value = []
            break
          case 'get_available_slots':
          case 'get_doctor_schedule':
            stage.value = 'calendar'
            availableSlots.value = []
            slotsDate.value = null // Сбрасываем чтобы показать загрузку
            break
          case 'create_appointment':
          case 'book_appointment':
            stage.value = 'booking'
            appointmentData.value = null
            break
          case 'transfer_for_operator':
            stage.value = 'transfer'
            transferReason.value = parsedArgs.reason || ''
            break
        }
      }
      break

    // Функция завершилась
    case 'function_ended':
      {
        functionLoading.value = false
        console.log('=== function_ended ===')
        console.log('function name:', data.function?.name)
        console.log('function result type:', typeof data.function?.result)
        console.log('function result:', data.function?.result)

        // Парсим результат если это строка JSON
        let parsedResult = data.function.result
        if (typeof parsedResult === 'string') {
          try {
            parsedResult = JSON.parse(parsedResult)
          } catch (e) {
            // Оставляем как строку если не JSON
          }
        }

        if (currentFunction.value) {
          currentFunction.value.result = parsedResult
        }
        addLog('mis', `✅ Результат: ${data.function.name}`)

        // Обрабатываем результат в зависимости от функции
        switch (data.function.name) {
          case 'search_knowledge_base':
            {
              const resultText = typeof parsedResult === 'string' ? parsedResult : JSON.stringify(parsedResult)
              kbResult.value = {
                title: 'Результат поиска',
                full: resultText,
                short: resultText.length > 200 ? resultText.substring(0, 200) + '...' : resultText
              }
            }
            break
          case 'get_specialties':
            specialtiesList.value = Array.isArray(parsedResult) ? parsedResult : []
            break
          case 'get_doctors':
          case 'get_doctors_by_specialty':
            doctorsList.value = Array.isArray(parsedResult) ? parsedResult : []
            break
          case 'get_available_slots':
          case 'get_doctor_schedule':
            {
              // Не перезаписываем confirmation
              if (stage.value === 'confirmation') break

              console.log('=== PROCESSING get_available_slots/get_doctor_schedule ===')
              stage.value = 'calendar'

              const allSlots = []

              if (Array.isArray(parsedResult)) {
                // Массив объектов-расписаний [{doctor_id, date, slots: [...]}, ...]
                slotsDate.value = parsedResult[0]?.date || parsedResult[0]?.schedule_date || null
                parsedResult.forEach(item => {
                  if (item.slots && Array.isArray(item.slots)) {
                    item.slots.forEach(slot => {
                      if (slot.is_available) {
                        allSlots.push({
                          ...slot,
                          doctor_id: item.doctor_id,
                          date: item.date || item.schedule_date || slotsDate.value
                        })
                      }
                    })
                  }
                })
              } else if (parsedResult && typeof parsedResult === 'object') {
                // Один объект: {doctor_id, date, clinic_id, slots: [...]}
                slotsDate.value = parsedResult.date || parsedResult.schedule_date || null
                const flatSlots = parsedResult.slots || parsedResult.data || parsedResult.result || []
                if (Array.isArray(flatSlots)) {
                  flatSlots.forEach(slot => {
                    if (slot.is_available) {
                      allSlots.push({
                        ...slot,
                        doctor_id: parsedResult.doctor_id,
                        date: slotsDate.value
                      })
                    }
                  })
                }
              } else {
                slotsDate.value = null
              }

              availableSlots.value = allSlots
              console.log('FINAL slotsDate.value:', slotsDate.value)
              console.log('FINAL availableSlots.value:', availableSlots.value)
            }
            break
          case 'create_appointment':
          case 'book_appointment':
            console.log('=== function_ended: CREATE APPOINTMENT ===')
            console.log('Setting appointmentData to:', parsedResult)

            // Проверяем, есть ли валидные данные в результате
            const hasValidData = parsedResult && (
              parsedResult.doctor ||
              parsedResult.doctor_name ||
              parsedResult.datetime ||
              parsedResult.date ||
              parsedResult.appointment_date ||
              parsedResult.code ||
              parsedResult.id
            )

            if (hasValidData) {
              appointmentData.value = parsedResult
              appointmentError.value = false
              stage.value = 'confirmation'
            } else {
              // Нет данных - показываем ошибку
              console.log('No valid appointment data received')
              appointmentData.value = null
              appointmentError.value = true
              stage.value = 'confirmation'
            }
            // Скрываем карточку функции - показываем сразу confirmation
            currentFunction.value = null
            console.log('appointmentData.value is now:', appointmentData.value)
            console.log('appointmentError.value is now:', appointmentError.value)
            break
          case 'transfer_for_operator':
            currentFunction.value = null
            functionLoading.value = false
            addLog('system', '🔀 Перевод на оператора выполнен')
            break
        }

        // Автоматически скрываем карточку функции через 3 секунды (кроме confirmation и transfer)
        if (data.function.name !== 'create_appointment' && data.function.name !== 'book_appointment' && data.function.name !== 'transfer_for_operator') {
          setTimeout(() => {
            if (currentFunction.value && currentFunction.value.name === data.function.name) {
              currentFunction.value = null
            }
          }, 3000)
        }
      }
      break
  }
}

// Конвертация HEX строки в Uint8Array
const hexToBytes = (hex) => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

// Воспроизведение аудио очереди
const playAudioQueue = async () => {
  if (isPlayingAudio.value || audioQueue.value.length === 0) return

  console.log('Начинаю воспроизведение, чанков в очереди:', audioQueue.value.length)
  isPlayingAudio.value = true

  while (audioQueue.value.length > 0) {
    const audioData = audioQueue.value.shift()
    try {
      // Декодируем HEX в бинарные данные
      const bytes = hexToBytes(audioData)
      console.log('Декодировано байт:', bytes.length)

      // Создаём Blob и воспроизводим через Audio элемент
      const blob = new Blob([bytes], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)

      await new Promise((resolve, reject) => {
        audio.onended = () => {
          console.log('Аудио чанк проигран')
          URL.revokeObjectURL(url)
          resolve()
        }
        audio.onerror = (e) => {
          console.error('Audio element error:', e)
          URL.revokeObjectURL(url)
          reject(e)
        }
        audio.play().then(() => {
          console.log('Воспроизведение началось')
        }).catch(reject)
      })
    } catch (e) {
      console.error('Ошибка воспроизведения аудио:', e)
    }
  }

  isPlayingAudio.value = false
  console.log('Все аудио чанки проиграны')

  // Отправляем audio_ended после проигрывания всех чанков
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    console.log('Отправляю audio_ended')
    websocket.send(JSON.stringify({ type: 'audio_ended' }))
  }
}

// Конвертация ArrayBuffer в HEX строку
const bufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Ресамплинг аудио до 8000 Гц
const resampleTo8000 = (inputBuffer, inputSampleRate) => {
  const ratio = inputSampleRate / 8000
  const outputLength = Math.floor(inputBuffer.length / ratio)
  const output = new Float32Array(outputLength)

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = Math.floor(i * ratio)
    output[i] = inputBuffer[srcIndex]
  }

  return output
}

// Конвертация Float32 в Int16 PCM
const floatTo16BitPCM = (float32Array) => {
  const int16Array = new Int16Array(float32Array.length)
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]))
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
  }
  return int16Array
}

// Запуск захвата микрофона
const startMicrophone = async () => {
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        channelCount: 1
      }
    })

    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const inputSampleRate = audioContext.sampleRate
    console.log('Исходная частота дискретизации:', inputSampleRate)

    sourceNode = audioContext.createMediaStreamSource(audioStream)

    // Размер буфера для ~250ms при 8000 Гц = 2000 сэмплов
    // При исходной частоте нужно больше
    const bufferSize = 4096
    const processorNode = audioContext.createScriptProcessor(bufferSize, 1, 1)

    processorNode.onaudioprocess = (e) => {
      if (!websocket || websocket.readyState !== WebSocket.OPEN) return

      const inputData = e.inputBuffer.getChannelData(0)
      // Ресамплируем до 8000 Гц
      const resampled = resampleTo8000(inputData, inputSampleRate)
      // Конвертируем в 16-bit PCM
      const pcmData = floatTo16BitPCM(resampled)
      // Конвертируем в HEX
      const hexData = bufferToHex(pcmData.buffer)
      // Отправляем
      websocket.send(JSON.stringify({
        type: 'audio',
        audio: hexData
      }))
    }

    sourceNode.connect(processorNode)
    processorNode.connect(audioContext.destination)

    audioWorklet = processorNode // сохраняем для остановки

    addLog('system', '🎤 Микрофон активен (8000 Гц, 16-bit PCM)')
    console.log('Микрофон запущен: 8000 Гц, 16-bit PCM, HEX')

  } catch (error) {
    console.error('Ошибка доступа к микрофону:', error)
    show('Не удалось получить доступ к микрофону', 'error')
    addLog('system', '❌ Ошибка микрофона')
  }
}

// Остановка микрофона
const stopMicrophone = () => {
  if (audioWorklet) {
    audioWorklet.disconnect()
    audioWorklet = null
  }
  if (sourceNode) {
    sourceNode.disconnect()
    sourceNode = null
  }
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop())
    audioStream = null
  }
}

const startRealtimeDemo = () => {
  screen.value = 'realtime'
  stage.value = 'active'

  timerInterval = setInterval(() => {
    callTime.value++
  }, 1000)

  // Демо-сценарий отключен - используем реальные данные из WebSocket
  // runDemoScenario()
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
  const msgId = Date.now()
  const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  // Если текст - JSON строка, извлекаем answer
  let displayText = text
  if (typeof text === 'string' && text.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(text)
      displayText = parsed.answer || parsed.text || text
    } catch (e) {
      // Не JSON, используем как есть
    }
  }

  if (sender === 'robot') {
    // Останавливаем предыдущую анимацию и завершаем предыдущее сообщение
    if (typingInterval) {
      clearInterval(typingInterval)
      typingInterval = null
      // Завершаем предыдущее сообщение - показываем полный текст
      if (currentTypingMsgId) {
        const prevMsg = messages.value.find(m => m.id === currentTypingMsgId)
        if (prevMsg && prevMsg.fullText) {
          prevMsg.text = prevMsg.fullText
          prevMsg.isTyping = false
        }
      }
    }

    // Скрываем индикатор "три точки" - теперь сообщение будет печататься
    isTyping.value = false
    partialBotText.value = ''

    // Для робота - эффект печатания
    messages.value.push({ id: msgId, sender, text: '', fullText: displayText, time, isTyping: true })
    currentTypingMsgId = msgId

    let charIndex = 0
    const msg = messages.value.find(m => m.id === msgId)

    typingInterval = setInterval(() => {
      if (charIndex < displayText.length) {
        msg.text = displayText.substring(0, charIndex + 1)
        charIndex++
        scrollToBottom()
      } else {
        clearInterval(typingInterval)
        typingInterval = null
        currentTypingMsgId = null
        msg.isTyping = false
      }
    }, 25) // Скорость печати - 25ms на символ
  } else {
    // Для пользователя - сразу показываем
    messages.value.push({ id: msgId, sender, text: displayText, time })
  }
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

const closeWebSocket = () => {
  stopMicrophone()
  if (websocket) {
    websocket.close()
    websocket = null
  }
}

const resetDemo = () => {
  demoTimeouts.forEach(t => clearTimeout(t))
  demoTimeouts = []
  if (typingInterval) {
    clearInterval(typingInterval)
    typingInterval = null
  }
  stopTimer()
  closeWebSocket()

  screen.value = 'setup'
  sessionId.value = null
  phone.value = ''
  operatorPhone.value = ''
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
  isTyping.value = false
  partialBotText.value = ''
  partialUserText.value = ''
  currentFunction.value = null
  audioQueue.value = []
  isPlayingAudio.value = false
  lastBotText.value = ''
  specialtiesList.value = []
  doctorsList.value = []
  availableSlots.value = []
  appointmentData.value = null
  appointmentError.value = false
  transferReason.value = ''
  functionLoading.value = false
  slotsDate.value = null

  show('Демо сброшено', 'success')
}

const clearLogs = () => {
  logs.value = []
}

const stageName = computed(() => {
  const names = {
    connecting: 'Соединяем',
    active: 'Разговор',
    specialties: 'Специальности',
    doctors: 'Выбираем врача',
    calendar: 'Выбираем время',
    faq: 'Отвечаю на вопрос',
    booking: 'Создаём запись',
    confirmation: 'Записано!',
    transfer: 'Перевод на оператора'
  }
  return names[stage.value] || stage.value
})

// Получение инициалов из имени
const getInitials = (name) => {
  if (!name) return '??'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0]
  }
  return name.substring(0, 2).toUpperCase()
}

// Форматирование даты записи
const formatAppointmentDate = (dateStr) => {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  } catch (e) {
    return dateStr
  }
}

// Получение поля из appointmentData с поддержкой вложенных объектов
const getAppointmentField = (field) => {
  if (!appointmentData.value) return null
  const data = appointmentData.value

  switch (field) {
    case 'doctor':
      // Вложенный объект doctor или прямое поле
      if (data.doctor?.full_name) return data.doctor.full_name
      if (data.doctor?.name) return data.doctor.name
      return data.doctor_name || data.doctor || null

    case 'specialty':
      // Из вложенного doctor или прямое поле
      if (data.doctor?.specialty_name) return data.doctor.specialty_name
      if (data.doctor?.specialty) return data.doctor.specialty
      return data.specialty_name || data.specialty || null

    case 'date':
      // datetime или отдельные поля
      if (data.datetime) return data.datetime.split('T')[0]
      return data.date || data.appointment_date || null

    case 'time':
      // Из datetime или отдельное поле
      if (data.datetime) {
        const timePart = data.datetime.split('T')[1]
        return timePart ? timePart.substring(0, 5) : null
      }
      return data.time || data.appointment_time || null

    case 'address':
      // Из вложенного clinic или прямое поле
      if (data.clinic?.address) return data.clinic.address
      return data.address || data.clinic_address || null

    case 'phone':
      // Из вложенного clinic или прямое поле
      if (data.clinic?.phone) return data.clinic.phone
      return data.phone || data.clinic_phone || null

    case 'patient':
      // ФИО пациента
      if (data.patient?.full_name) return data.patient.full_name
      if (data.patient?.first_name && data.patient?.last_name) {
        return `${data.patient.last_name} ${data.patient.first_name}${data.patient.patronymic ? ' ' + data.patient.patronymic : ''}`
      }
      return data.patient_name || null

    case 'patient_phone':
      // Телефон пациента
      if (data.patient?.phone) return data.patient.phone
      return data.patient_phone || null

    case 'clinic':
      // Название клиники
      if (data.clinic?.name) return data.clinic.name
      return data.clinic_name || null

    case 'code':
      // Код записи
      return data.code || data.appointment_code || null

    default:
      return data[field] || null
  }
}

// Автопрокрутка при новых сообщениях
const scrollToBottom = () => {
  nextTick(() => {
    if (transcriptRef.value) {
      transcriptRef.value.scrollTop = transcriptRef.value.scrollHeight
    }
  })
}

// Автопрокрутка логов
const scrollLogsToBottom = () => {
  nextTick(() => {
    if (logsRef.value) {
      logsRef.value.scrollTop = logsRef.value.scrollHeight
    }
  })
}

watch(messages, scrollToBottom, { deep: true })
watch(partialBotText, scrollToBottom)
watch(partialUserText, scrollToBottom)
watch(isTyping, scrollToBottom)
watch(logs, scrollLogsToBottom, { deep: true })

onUnmounted(() => {
  demoTimeouts.forEach(t => clearTimeout(t))
  if (typingInterval) clearInterval(typingInterval)
  stopTimer()
  closeWebSocket()
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
          <h1 contenteditable="false">{{ t('voiceRobot.setup.title') }}</h1>
          <p class="setup-description" contenteditable="false">{{ t('voiceRobot.setup.description') }}</p>

          <div class="setup-features">
            <div class="setup-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>{{ t('voiceRobot.setup.features.speech') }}</span>
            </div>
            <div class="setup-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>{{ t('voiceRobot.setup.features.always') }}</span>
            </div>
            <div class="setup-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>{{ t('voiceRobot.setup.features.schedule') }}</span>
            </div>
          </div>

          <div class="demo-flow">
            <p class="flow-label" contenteditable="false">{{ t('voiceRobot.setup.phoneLabel') }}</p>
            <div class="phone-input-group">
              <div class="phone-input">
                <span class="phone-prefix">+7</span>
                <input type="tel" :value="phone" @input="formatPhoneInput" placeholder="XXX XXX XX XX" maxlength="13">
              </div>
            </div>
            <p class="flow-label" contenteditable="false" style="margin-top: 12px;">{{ t('voiceRobot.setup.operatorLabel') }}</p>
            <div class="phone-input-group">
              <div class="phone-input">
                <span class="phone-prefix">+7</span>
                <input type="tel" :value="operatorPhone" @input="formatOperatorPhoneInput" placeholder="XXX XXX XX XX" maxlength="13">
              </div>
            </div>
            <button class="btn btn-primary btn-lg btn-glow" @click="openSession">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
              {{ t('voiceRobot.setup.openSession') }}
            </button>
          </div>
        </div>

        <div class="setup-preview">
          <div class="preview-badge">
            <span class="badge badge-cyan">{{ t('voiceRobot.setup.interactiveDemo') }}</span>
          </div>
          <p>{{ t('voiceRobot.setup.demoDesc') }}</p>
        </div>
      </div>
    </div>

    <!-- Realtime Screen -->
    <div v-else class="realtime-screen">
      <div class="controls-bar">
        <div class="controls-left">
          <h2 class="session-title" contenteditable="false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
            {{ t('voiceRobot.realtime.sessionTitle') }} <span class="text-gradient">{{ sessionId }}</span>
          </h2>
          <div class="connection-status">
            <span class="connection-dot" :class="{ connected: isConnected }"></span>
            <span>{{ isConnected ? t('voiceRobot.realtime.connected') : t('voiceRobot.realtime.connecting') }}</span>
          </div>
          <div class="call-timer">{{ formattedTime }}</div>
        </div>
        <div class="controls-right">
          <button class="btn btn-secondary btn-sm" @click="resetDemo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 4v6h6"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            {{ t('voiceRobot.realtime.reset') }}
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
                {{ t('voiceRobot.realtime.transcriptTitle') }}
              </div>
              <div class="audio-visualizer" :class="{ active: isConnected && stage !== 'confirmation' }">
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
              </div>
            </div>

            <div class="transcript-content" ref="transcriptRef">
              <div v-if="messages.length === 0" class="transcript-placeholder">
                <div class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
                <p>{{ t('voiceRobot.realtime.waitingConnection') }}</p>
              </div>
              <div v-for="msg in messages" :key="msg.id" class="message" :class="[msg.sender, { 'typing-message': msg.isTyping }]">
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
                  <div class="message-sender">{{ msg.sender === 'robot' ? t('voiceRobot.realtime.senderRobot') : t('voiceRobot.realtime.senderPatient') }}</div>
                  <div class="message-text">{{ msg.text }}<span v-if="msg.isTyping" class="typing-cursor">|</span></div>
                  <div class="message-time">{{ msg.time }}</div>
                </div>
              </div>

              <!-- Печатающийся текст пользователя -->
              <div v-if="partialUserText" class="message user typing-message">
                <div class="message-avatar user">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div class="message-content">
                  <div class="message-sender">{{ t('voiceRobot.realtime.senderPatient') }}</div>
                  <div class="message-text">{{ partialUserText }}<span class="typing-cursor">|</span></div>
                </div>
              </div>

              <!-- Индикатор печатания бота (три точки пока получаем текст) -->
              <div v-if="isTyping || partialBotText" class="message robot typing-message">
                <div class="message-avatar robot">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  </svg>
                </div>
                <div class="message-content">
                  <div class="message-sender">{{ t('voiceRobot.realtime.senderRobot') }}</div>
                  <div class="message-text">
                    <span class="typing-dots"><span></span><span></span><span></span></span>
                  </div>
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
                {{ t('voiceRobot.realtime.visualTitle') }}
              </div>
              <span class="badge badge-cyan">{{ stageName }}</span>
            </div>

            <div class="visual-content">
              <!-- AI Thinking Loader (while function is executing) -->
              <div v-if="functionLoading && currentFunction" class="ai-thinking-overlay">
                <div class="ai-thinking-content">
                  <div class="ai-thinking-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <div class="ai-thinking-text">{{ t('voiceRobot.realtime.aiThinking') }}</div>
                  <div class="ai-thinking-function">{{ currentFunction.name.replace(/_/g, ' ') }}</div>
                  <div class="ai-thinking-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>

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
                <h3 contenteditable="false">{{ t('voiceRobot.realtime.connecting') }}</h3>
                <p class="text-secondary" contenteditable="false">{{ t('voiceRobot.realtime.robotAnswering') }}</p>
              </div>

              <!-- Active Call -->
              <div v-else-if="stage === 'active'" class="visual-stage-content">
                <div class="active-call-visual">
                  <div class="waveform-container">
                    <div class="waveform-label">{{ t('voiceRobot.realtime.aiRobot') }}</div>
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
                    <div class="waveform-label">{{ t('voiceRobot.realtime.senderPatient') }}</div>
                    <div class="waveform user-waveform">
                      <div class="wave-bar" v-for="i in 8" :key="i"></div>
                    </div>
                  </div>
                </div>
                <div v-if="currentIntent" class="current-intent">
                  <span class="intent-label">{{ t('voiceRobot.realtime.understood') }}</span>
                  <span class="intent-value">{{ currentIntent }}</span>
                </div>
              </div>

              <!-- Specialties -->
              <div v-else-if="stage === 'specialties'" class="visual-stage-content">
                <h4 class="stage-title" contenteditable="false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                  {{ t('voiceRobot.realtime.specialtiesTitle') }}
                </h4>

                <div v-if="functionLoading" class="loading-indicator">
                  <div class="loading-spinner"></div>
                  <span>{{ t('voiceRobot.realtime.loadingSpecialties') }}</span>
                </div>

                <div v-else-if="specialtiesList.length > 0" class="specialties-list">
                  <div class="specialties-count">{{ t('voiceRobot.realtime.foundCount', { n: specialtiesList.length }) }} {{ t('voiceRobot.realtime.specialtiesTitle').toLowerCase() }}</div>
                  <div class="specialties-grid">
                    <div v-for="spec in specialtiesList.slice(0, 12)" :key="spec.id" class="specialty-card" style="min-height: 150px;">
                      <div class="specialty-name">{{ spec.name }}</div>
                      <div v-if="spec.description" class="specialty-desc">{{ spec.description }}</div>
                      <div v-if="spec.doctor_count" class="specialty-count" style="bottom: 0; margin-top:auto;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                        </svg>
                        {{ spec.doctor_count }} {{ t('voiceRobot.realtime.doctors') }}
                      </div>
                    </div>
                  </div>
                  <div v-if="specialtiesList.length > 12" class="specialties-more">
                    {{ t('voiceRobot.realtime.specialtiesMore', { n: specialtiesList.length - 12 }) }}
                  </div>
                </div>

                <div v-else class="empty-state">
                  <p>{{ t('voiceRobot.realtime.noSpecialties') }}</p>
                </div>
              </div>

              <!-- Doctors -->
              <div v-else-if="stage === 'doctors'" class="visual-stage-content">
                <h4 class="stage-title" contenteditable="false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  {{ t('voiceRobot.realtime.doctorsTitle') }}
                </h4>

                <div v-if="functionLoading" class="loading-indicator">
                  <div class="loading-spinner"></div>
                  <span>{{ t('voiceRobot.realtime.loadingDoctors') }}</span>
                </div>

                <div v-else-if="doctorsList.length > 0" class="doctors-list-api">
                  <div class="doctors-count">{{ t('voiceRobot.realtime.foundDoctors', { n: doctorsList.length }) }}</div>
                  <div class="doctors-grid">
                    <div v-for="doc in doctorsList.slice(0, 8)" :key="doc.id" class="doctor-card" :class="{ selected: selectedDoctor?.id === doc.id }">
                      <div class="doctor-avatar">{{ getInitials(doc.name || doc.full_name) }}</div>
                      <div class="doctor-name">{{ doc.name || doc.full_name }}</div>
                      <div class="doctor-specialty">{{ doc.specialty || doc.specialty_name }}</div>
                      <div v-if="doc.rating" class="doctor-rating">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        {{ doc.rating }}
                      </div>
                    </div>
                  </div>
                  <div v-if="doctorsList.length > 8" class="doctors-more">
                    {{ t('voiceRobot.realtime.doctorsMore', { n: doctorsList.length - 8 }) }}
                  </div>
                </div>

                <!-- Fallback to mock data -->
                <div v-else class="doctors-grid">
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

              <!-- Booking in progress -->
              <div v-else-if="stage === 'booking'" class="visual-stage-content">
                <div class="booking-progress">
                  <div class="booking-icon">
                    <div class="loading-spinner large"></div>
                  </div>
                  <h3 contenteditable="false">{{ t('voiceRobot.realtime.bookingTitle') }}</h3>
                  <p class="text-secondary" contenteditable="false">{{ t('voiceRobot.realtime.bookingSubtitle') }}</p>
                </div>
              </div>

              <!-- Calendar -->
              <div v-else-if="stage === 'calendar'" class="visual-stage-content">
                <h4 class="stage-title" contenteditable="false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {{ t('voiceRobot.realtime.calendarTitle') }}
                </h4>

                <!-- Загрузка -->
                <div v-if="functionLoading" class="loading-indicator">
                  <div class="loading-spinner"></div>
                  <span>{{ t('voiceRobot.realtime.loadingSchedule') }}</span>
                </div>

                <!-- Данные из API: выбранная дата и свободные слоты -->
                <div v-else-if="slotsDate && availableSlots.length > 0" class="slots-container">
                  <div class="selected-date-card">
                    <div class="selected-date-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div class="selected-date-info">
                      <div class="selected-date-label">{{ t('voiceRobot.realtime.selectedDate') }}</div>
                      <div class="selected-date-value">{{ formatAppointmentDate(slotsDate) }}</div>
                    </div>
                  </div>

                  <div class="time-slots">
                    <div class="time-slots-title" contenteditable="false">{{ t('voiceRobot.realtime.freeSlots', { n: availableSlots.length }) }}</div>
                    <div class="time-slots-grid">
                      <button
                        v-for="(slot, idx) in availableSlots"
                        :key="idx"
                        class="time-slot"
                        :class="{ selected: selectedTime === slot.time }"
                      >
                        {{ slot.time }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Нет свободных слотов -->
                <div v-else-if="slotsDate && availableSlots.length === 0" class="empty-state">
                  <p>{{ t('voiceRobot.realtime.noSlots', { date: formatAppointmentDate(slotsDate) }) }}</p>
                </div>

                <!-- Ожидание данных о дате -->
                <div v-else class="empty-state">
                  <p>{{ t('voiceRobot.realtime.waitingDate') }}</p>
                </div>
              </div>

              <!-- FAQ / Knowledge Base -->
              <div v-else-if="stage === 'faq'" class="visual-stage-content">
                <h4 class="stage-title" contenteditable="false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  {{ t('voiceRobot.realtime.kbTitle') }}
                </h4>

                <div class="kb-query">
                  <div class="kb-query-label">{{ t('voiceRobot.realtime.patientQuestion') }}</div>
                  <div class="kb-query-text">"{{ kbQuery || '—' }}"</div>
                </div>

                <div v-if="!kbResult" class="kb-search">
                  <div class="kb-search-indicator">
                    <div class="kb-search-dot"></div>
                    <span>{{ t('voiceRobot.realtime.kbSearching') }}</span>
                  </div>
                </div>

                <div v-else class="kb-result">
                  <div class="kb-result-header">
                    <span class="kb-result-icon">📄</span>
                    <span class="kb-result-title" contenteditable="false">{{ kbResult.title }}</span>
                    <span class="kb-result-score">{{ (0.85 + Math.random() * 0.14).toFixed(2) }} {{ t('voiceRobot.realtime.relevance') }}</span>
                  </div>
                  <div class="kb-result-full">{{ kbResult.full }}</div>
                  <div class="kb-result-answer">
                    <div class="kb-answer-label">{{ t('voiceRobot.realtime.robotAnswer') }}</div>
                    <div class="kb-answer-text">{{ kbResult.short }}</div>
                  </div>
                </div>

                <div class="kb-bank">
                  <div class="kb-bank-title" contenteditable="false">{{ t('voiceRobot.realtime.kbTopics') }}</div>
                  <div class="kb-bank-items">
                    <div v-for="topic in kbTopics" :key="topic.id" class="kb-bank-item" :class="{ active: activeKbTopic === topic.id }">
                      {{ topic.title }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Transfer to Operator -->
              <div v-else-if="stage === 'transfer'" class="visual-stage-content">
                <div class="transfer-card">
                  <div class="transfer-handoff">
                    <div class="transfer-node robot-node">
                      <div class="transfer-avatar robot-avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                          <line x1="12" y1="19" x2="12" y2="23"/>
                          <line x1="8" y1="23" x2="16" y2="23"/>
                        </svg>
                      </div>
                      <div class="transfer-node-label">{{ t('voiceRobot.realtime.aiAssel') }}</div>
                    </div>

                    <div class="transfer-arrow-block">
                      <div class="transfer-arrow-line">
                        <div class="transfer-dot dot-1"></div>
                        <div class="transfer-dot dot-2"></div>
                        <div class="transfer-dot dot-3"></div>
                      </div>
                      <svg class="transfer-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </div>

                    <div class="transfer-node operator-node">
                      <div class="transfer-avatar operator-avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                      <div class="transfer-node-label">{{ t('voiceRobot.realtime.operator') }}</div>
                    </div>
                  </div>

                  <div class="transfer-status">
                    <div class="transfer-status-badge">
                      <span class="transfer-status-dot"></span>
                      {{ t('voiceRobot.realtime.connectingOperator') }}
                    </div>
                  </div>

                  <div v-if="transferReason" class="transfer-reason">
                    <div class="transfer-reason-label">{{ t('voiceRobot.realtime.transferReason') }}</div>
                    <div class="transfer-reason-text">{{ transferReason }}</div>
                  </div>
                </div>
              </div>

              <!-- Confirmation -->
              <div v-else-if="stage === 'confirmation'" class="visual-stage-content">
                <!-- Ошибка создания записи -->
                <div v-if="appointmentError" class="confirmation-card error-card">
                  <div class="confirmation-icon error-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <h3 contenteditable="false">{{ t('voiceRobot.realtime.errorTitle') }}</h3>
                  <p class="text-secondary" contenteditable="false">{{ t('voiceRobot.realtime.errorDesc') }}</p>

                  <div class="confirmation-actions">
                    <button class="btn btn-primary btn-sm" @click="stage = 'active'; appointmentError = false">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 4v6h6"/>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                      </svg>
                      {{ t('voiceRobot.realtime.retryBtn') }}
                    </button>
                    <router-link to="/" class="btn btn-secondary btn-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                      </svg>
                      {{ t('voiceRobot.realtime.backToStands') }}
                    </router-link>
                  </div>
                </div>

                <!-- Успешная запись -->
                <div v-else class="confirmation-card">
                  <div class="confirmation-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h3 contenteditable="false">{{ t('voiceRobot.realtime.successTitle') }}</h3>
                  <p class="text-secondary" contenteditable="false">{{ t('voiceRobot.realtime.successSubtitle') }}</p>

                  <!-- Данные из API -->
                  <div v-if="appointmentData" class="confirmation-details">
                    <!-- Код записи -->
                    <div v-if="getAppointmentField('code')" class="confirmation-row">
                      <span class="confirmation-label">{{ t('voiceRobot.realtime.confirmCode') }}</span>
                      <span class="confirmation-value confirmation-code">{{ getAppointmentField('code') }}</span>
                    </div>
                    <!-- Пациент -->
                    <div v-if="getAppointmentField('patient')" class="confirmation-row">
                      <span class="confirmation-label">{{ t('voiceRobot.realtime.confirmPatient') }}</span>
                      <span class="confirmation-value">{{ getAppointmentField('patient') }}</span>
                    </div>
                    <!-- Врач -->
                    <div v-if="getAppointmentField('doctor')" class="confirmation-row">
                      <span class="confirmation-label">{{ t('voiceRobot.realtime.confirmDoctor') }}</span>
                      <span class="confirmation-value">{{ getAppointmentField('doctor') }}</span>
                    </div>
                    <!-- Специальность -->
                    <div v-if="getAppointmentField('specialty')" class="confirmation-row">
                      <span class="confirmation-label">{{ t('voiceRobot.realtime.confirmSpecialty') }}</span>
                      <span class="confirmation-value">{{ getAppointmentField('specialty') }}</span>
                    </div>
                    <!-- Дата -->
                    <div v-if="getAppointmentField('date')" class="confirmation-row">
                      <span class="confirmation-label">{{ t('voiceRobot.realtime.confirmDate') }}</span>
                      <span class="confirmation-value">{{ formatAppointmentDate(getAppointmentField('date')) }}</span>
                    </div>
                    <!-- Время -->
                    <div v-if="getAppointmentField('time')" class="confirmation-row">
                      <span class="confirmation-label">{{ t('voiceRobot.realtime.confirmTime') }}</span>
                      <span class="confirmation-value">{{ getAppointmentField('time') }}</span>
                    </div>
                    <!-- Клиника -->
                    <div v-if="getAppointmentField('clinic')" class="confirmation-row">
                      <span class="confirmation-label">{{ t('voiceRobot.realtime.confirmClinic') }}</span>
                      <span class="confirmation-value">{{ getAppointmentField('clinic') }}</span>
                    </div>
                    <!-- Адрес -->
                    <div v-if="getAppointmentField('address')" class="confirmation-row">
                      <span class="confirmation-label">{{ t('voiceRobot.realtime.confirmAddress') }}</span>
                      <span class="confirmation-value">{{ getAppointmentField('address') }}</span>
                    </div>
                    <!-- Телефон клиники -->
                    <div v-if="getAppointmentField('phone')" class="confirmation-row">
                      <span class="confirmation-label">{{ t('voiceRobot.realtime.confirmPhone') }}</span>
                      <span class="confirmation-value">{{ getAppointmentField('phone') }}</span>
                    </div>
                  </div>

                  <!-- Fallback: данные из локального состояния -->
                  <div v-else-if="selectedDoctor && selectedDate" class="confirmation-details">
                    <div class="confirmation-row">
                      <span class="confirmation-label">{{ t('voiceRobot.realtime.confirmDoctor') }}</span>
                      <span class="confirmation-value">{{ selectedDoctor.name }}</span>
                    </div>
                    <div class="confirmation-row">
                      <span class="confirmation-label">{{ t('voiceRobot.realtime.confirmSpecialty') }}</span>
                      <span class="confirmation-value">{{ selectedDoctor.specialty }}</span>
                    </div>
                    <div class="confirmation-row">
                      <span class="confirmation-label">{{ t('voiceRobot.realtime.confirmDate') }}</span>
                      <span class="confirmation-value">{{ selectedDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }) }}</span>
                    </div>
                    <div class="confirmation-row">
                      <span class="confirmation-label">{{ t('voiceRobot.realtime.confirmTime') }}</span>
                      <span class="confirmation-value">{{ selectedTime }}</span>
                    </div>
                    <div class="confirmation-row">
                      <span class="confirmation-label">{{ t('voiceRobot.realtime.confirmAddress') }}</span>
                      <span class="confirmation-value">ул. Абая 52, каб. 305</span>
                    </div>
                  </div>

                  <div class="confirmation-actions">
                    <router-link to="/" class="btn btn-secondary btn-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                      </svg>
                      {{ t('voiceRobot.realtime.backToStands') }}
                    </router-link>
                  </div>
                </div>
                </div>
              </div>
            </div>
        </div>

        <!-- AI Logs - Bottom Panel -->
        <div class="ai-logs-panel">
          <div class="ai-logs-header">
            <div class="ai-logs-title" contenteditable="false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>{{ t('voiceRobot.realtime.logsTitle') }}</span>
            </div>
            <div class="ai-logs-actions">
              <span class="logs-count">{{ t('voiceRobot.realtime.logsRecords', { n: logs.length }) }}</span>
              <button class="btn btn-ghost btn-sm" @click="clearLogs">{{ t('voiceRobot.realtime.clearLogs') }}</button>
            </div>
          </div>
          <div class="ai-logs-content" ref="logsRef">
            <div v-if="logs.length === 0" class="logs-empty">
              <span>{{ t('voiceRobot.realtime.logsEmpty') }}</span>
            </div>
            <div v-for="log in logs" :key="log.id" class="ai-log-entry">
              <span class="ai-log-time">{{ log.time }}</span>
              <span class="ai-log-type" :class="log.type">{{ log.type.toUpperCase() }}</span>
              <span class="ai-log-message">{{ log.message }}</span>
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
          <h3 contenteditable="false">{{ t('voiceRobot.realtime.waitingCall') }}</h3>
          <p class="waiting-phone" contenteditable="false">{{ t('voiceRobot.realtime.fromNumber') }} <strong>+7 {{ phone }}</strong></p>
          <p class="waiting-hint" contenteditable="false">{{ t('voiceRobot.realtime.callTo') }} <strong>+7 700 632 01-27</strong></p>
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

/* Transfer to Operator */
.transfer-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px 16px;
}

.transfer-handoff {
  display: flex;
  align-items: center;
  gap: 20px;
}

.transfer-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.transfer-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.robot-avatar {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 212, 255, 0.05));
  border: 2px solid rgba(0, 212, 255, 0.4);
  color: var(--accent-cyan);
}

.robot-avatar svg { width: 28px; height: 28px; }

.operator-avatar {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05));
  border: 2px solid rgba(168, 85, 247, 0.4);
  color: #a855f7;
  animation: operator-pulse 1.8s ease-in-out infinite;
}

.operator-avatar svg { width: 28px; height: 28px; }

@keyframes operator-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.3); }
  50% { box-shadow: 0 0 0 10px rgba(168, 85, 247, 0); }
}

.transfer-node-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  letter-spacing: 0.03em;
}

.transfer-arrow-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 72px;
}

.transfer-arrow-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
}

.transfer-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-cyan);
  opacity: 0;
  animation: dot-travel 1.4s ease-in-out infinite;
}

.transfer-dot.dot-1 { animation-delay: 0s; }
.transfer-dot.dot-2 { animation-delay: 0.25s; }
.transfer-dot.dot-3 { animation-delay: 0.5s; }

@keyframes dot-travel {
  0%   { opacity: 0; transform: translateX(-4px); }
  30%  { opacity: 1; }
  70%  { opacity: 1; }
  100% { opacity: 0; transform: translateX(4px); }
}

.transfer-arrow-icon {
  width: 20px;
  height: 20px;
  color: rgba(168, 85, 247, 0.7);
}

.transfer-status {
  display: flex;
  align-items: center;
  justify-content: center;
}

.transfer-status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.25);
  border-radius: 24px;
  font-size: 13px;
  color: #c084fc;
  font-weight: 500;
}

.transfer-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a855f7;
  animation: status-blink 1s ease-in-out infinite;
}

@keyframes status-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.transfer-reason {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  padding: 14px 16px;
}

.transfer-reason-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.transfer-reason-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}
</style>
