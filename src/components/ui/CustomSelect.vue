<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDown, ChevronUp, Check } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: 'Seleccionar...',
  },
  dark: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const rootRef = ref(null)
const triggerRef = ref(null)
const menuRef = ref(null)
const menuStyle = ref({})

const normalizedOptions = computed(() =>
  props.options.map((opt) =>
    typeof opt === 'object' && opt !== null
      ? { value: opt.value, label: opt.label }
      : { value: opt, label: String(opt) }
  )
)

const selectedLabel = computed(() => {
  const found = normalizedOptions.value.find((o) => o.value === props.modelValue)
  return found ? found.label : props.placeholder
})

function updateMenuPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const menuW = Math.max(rect.width, 145)
  const spaceBelow = window.innerHeight - rect.bottom
  const estHeight = Math.min(240, normalizedOptions.value.length * 36 + 14)
  const top =
    spaceBelow >= estHeight + 10
      ? rect.bottom + 6
      : Math.max(12, rect.top - estHeight - 6)
  const left = Math.min(window.innerWidth - menuW - 12, Math.max(12, rect.left))
  menuStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    width: `${menuW}px`,
    zIndex: 9999,
  }
}

function toggleOpen() {
  if (!isOpen.value) {
    updateMenuPosition()
    isOpen.value = true
  } else {
    isOpen.value = false
  }
}

function selectOption(val) {
  emit('update:modelValue', val)
  emit('change', val)
  isOpen.value = false
}

function handleClickOutside(e) {
  if (
    rootRef.value &&
    !rootRef.value.contains(e.target) &&
    (!menuRef.value || !menuRef.value.contains(e.target))
  ) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  window.addEventListener('resize', updateMenuPosition)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  window.removeEventListener('resize', updateMenuPosition)
})
</script>

<template>
  <div ref="rootRef" :class="['cselect', dark ? 'cselect-dark' : '', isOpen ? 'cselect-open' : '']">
    <button
      ref="triggerRef"
      type="button"
      class="cselect-trigger"
      :aria-expanded="isOpen"
      @click="toggleOpen"
    >
      <span class="cselect-label">{{ selectedLabel }}</span>
      <ChevronUp v-if="isOpen" :size="15" class="cselect-arrow" />
      <ChevronDown v-else :size="15" class="cselect-arrow" />
    </button>

    <Teleport to="body">
      <div v-if="isOpen" ref="menuRef" class="cselect-menu" :style="menuStyle" role="listbox">
        <button
          v-for="opt in normalizedOptions"
          :key="String(opt.value)"
          type="button"
          role="option"
          :aria-selected="opt.value === modelValue"
          :class="['cselect-option', opt.value === modelValue ? 'cselect-option-active' : '']"
          @click="selectOption(opt.value)"
        >
          <span>{{ opt.label }}</span>
          <Check v-if="opt.value === modelValue" :size="14" />
        </button>
      </div>
    </Teleport>
  </div>
</template>
