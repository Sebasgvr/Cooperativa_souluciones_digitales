<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'DD/MM/AAAA',
  },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const rootRef = ref(null)
const triggerRef = ref(null)
const popoverRef = ref(null)
const popoverStyle = ref({})
const textValue = ref('')

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]
const WEEKDAYS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO']

function getTodayYMD() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`
}

function parseYMD(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || ''))
  if (!m) return null
  return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) }
}

function formatDMY(ymd) {
  const p = parseYMD(ymd)
  if (!p) return ''
  return `${String(p.day).padStart(2, '0')}/${String(p.month + 1).padStart(2, '0')}/${p.year}`
}

function isRealDate(day, month, year) {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false
  }
  const d = new Date(year, month - 1, day)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day
}

const initDate = parseYMD(props.modelValue) || {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  day: new Date().getDate(),
}
const viewYear = ref(initDate.year)
const viewMonth = ref(initDate.month)
textValue.value = formatDMY(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    const p = parseYMD(val)
    if (p) {
      viewYear.value = p.year
      viewMonth.value = p.month
      textValue.value = formatDMY(val)
    } else if (!val) {
      textValue.value = ''
    }
  }
)

function applyToday() {
  const today = getTodayYMD()
  emit('update:modelValue', today)
  textValue.value = formatDMY(today)
  return today
}

function handleManualInput(e) {
  const digits = String(e.target.value || '').replace(/\D/g, '').slice(0, 8)
  let formatted = digits
  if (digits.length > 4) {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  } else if (digits.length > 2) {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  // Validación rápida de día/mes mientras escribe
  if (digits.length >= 2) {
    const d = Number(digits.slice(0, 2))
    if (d < 1 || d > 31) {
      applyToday()
      e.target.value = textValue.value
      return
    }
  }
  if (digits.length >= 4) {
    const m = Number(digits.slice(2, 4))
    if (m < 1 || m > 12) {
      applyToday()
      e.target.value = textValue.value
      return
    }
  }

  textValue.value = formatted
  e.target.value = formatted

  if (digits.length === 0) {
    emit('update:modelValue', '')
    return
  }

  if (digits.length === 8) {
    const day = Number(digits.slice(0, 2))
    const month = Number(digits.slice(2, 4))
    const year = Number(digits.slice(4, 8))
    if (!isRealDate(day, month, year)) {
      applyToday()
      e.target.value = textValue.value
      return
    }
    const ymd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const today = getTodayYMD()
    if (ymd > today) {
      applyToday()
      e.target.value = textValue.value
      return
    }
    emit('update:modelValue', ymd)
  }
}

function handleManualBlur() {
  const clean = textValue.value.trim()
  if (!clean) return
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    applyToday()
  }
}

const todayYMD = computed(() => getTodayYMD())

const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const prevMonthDays = new Date(viewYear.value, viewMonth.value, 0).getDate()

  const cells = []
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, current: false, disabled: true, ymd: '' })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(viewMonth.value + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    const ymd = `${viewYear.value}-${mm}-${dd}`
    cells.push({
      day: d,
      current: true,
      disabled: ymd > todayYMD.value,
      ymd,
    })
  }
  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - (startOffset + daysInMonth) + 1
    cells.push({ day: nextDay, current: false, disabled: true, ymd: '' })
  }
  return cells
})

function updatePosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const popH = 345
  const popW = 276
  const top =
    rect.top >= popH + 12
      ? rect.top - popH - 6
      : Math.min(window.innerHeight - popH - 12, rect.bottom + 6)
  const left = Math.min(window.innerWidth - popW - 12, Math.max(12, rect.right - popW))
  popoverStyle.value = {
    position: 'fixed',
    top: `${Math.max(12, top)}px`,
    left: `${left}px`,
    zIndex: 9999,
  }
}

function toggleCalendar() {
  if (!isOpen.value) {
    updatePosition()
    isOpen.value = true
  } else {
    isOpen.value = false
  }
}

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value -= 1
  } else {
    viewMonth.value -= 1
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value += 1
  } else {
    viewMonth.value += 1
  }
}

function selectDay(ymd) {
  if (!ymd) return
  const today = getTodayYMD()
  const finalYmd = ymd > today ? today : ymd
  emit('update:modelValue', finalYmd)
  textValue.value = formatDMY(finalYmd)
  isOpen.value = false
}

function selectToday() {
  applyToday()
  isOpen.value = false
}

function clearDate() {
  emit('update:modelValue', '')
  textValue.value = ''
  isOpen.value = false
}

function handleClickOutside(e) {
  if (
    rootRef.value &&
    !rootRef.value.contains(e.target) &&
    (!popoverRef.value || !popoverRef.value.contains(e.target))
  ) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  window.addEventListener('resize', updatePosition)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  window.removeEventListener('resize', updatePosition)
})
</script>

<template>
  <div ref="rootRef" class="cdate">
    <div ref="triggerRef" class="cdate-input-wrap">
      <input
        :value="textValue"
        type="text"
        class="cdate-input"
        :placeholder="placeholder"
        maxlength="10"
        inputmode="numeric"
        @input="handleManualInput"
        @blur="handleManualBlur"
      />
      <button
        type="button"
        class="cdate-icon-btn"
        aria-label="Abrir calendario"
        :aria-expanded="isOpen"
        @click="toggleCalendar"
      >
        <CalendarDays :size="15" />
      </button>
    </div>

    <Teleport to="body">
      <div v-if="isOpen" ref="popoverRef" class="cdate-popover" :style="popoverStyle">
        <div class="cdate-header">
          <strong>{{ MONTHS[viewMonth] }} de {{ viewYear }}</strong>
          <div class="cdate-nav">
            <button type="button" aria-label="Mes anterior" @click="prevMonth">
              <ChevronLeft :size="16" />
            </button>
            <button type="button" aria-label="Mes siguiente" @click="nextMonth">
              <ChevronRight :size="16" />
            </button>
          </div>
        </div>

        <div class="cdate-weekdays">
          <span v-for="w in WEEKDAYS" :key="w">{{ w }}</span>
        </div>

        <div class="cdate-grid">
          <button
            v-for="(cell, idx) in calendarDays"
            :key="idx"
            type="button"
            :disabled="!cell.current || cell.disabled"
            :class="[
              'cdate-day',
              !cell.current || cell.disabled ? 'cdate-day-muted' : '',
              cell.ymd && cell.ymd === modelValue ? 'cdate-day-selected' : '',
            ]"
            @click="selectDay(cell.ymd)"
          >
            {{ cell.day }}
          </button>
        </div>

        <div class="cdate-footer">
          <button type="button" @click="clearDate">Borrar</button>
          <button type="button" class="cdate-today-btn" @click="selectToday">Hoy</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
