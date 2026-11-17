<script setup>
import { ref, computed } from 'vue'
import { Lock, Mail, ShieldCheck, Eye, EyeOff, ArrowRight, X, Info } from 'lucide-vue-next'
import Button from './ui/Button.vue'
import { getSupabaseConfig } from '../lib/supabase'
import { loginWithEmail, requestPasswordReset } from '../lib/auth'

const props = defineProps({
  isModal: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['authenticated', 'close'])

const isSubmitting = ref(false)
const showPassword = ref(false)
const forgotMode = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

const loginForm = ref({
  identifier: '',
  password: '',
})

const resetIdentifier = ref('')

const supabaseConfigured = computed(() => getSupabaseConfig().isConfigured)

async function handleLogin() {
  errorMessage.value = ''
  infoMessage.value = ''
  isSubmitting.value = true
  const { user, error } = await loginWithEmail({
    identifier: loginForm.value.identifier,
    password: loginForm.value.password,
  })
  isSubmitting.value = false

  if (error) {
    errorMessage.value = error
    return
  }
  if (user) {
    emit('authenticated', user)
  }
}

async function handleResetPassword() {
  errorMessage.value = ''
  infoMessage.value = ''
  isSubmitting.value = true
  const { ok, message } = await requestPasswordReset(resetIdentifier.value)
  isSubmitting.value = false
  if (!ok) {
    errorMessage.value = message
    return
  }
  infoMessage.value = message
}
</script>

<template>
  <div :class="isModal ? 'auth-modal-backdrop' : 'auth-page'" @mousedown.self="isModal && emit('close')">
    <div :class="['auth-split', isModal ? 'auth-split-modal' : '']">
      <!-- Panel izquierdo institucional -->
      <aside class="auth-hero">
        <div class="auth-hero-top">
          <div class="brand" style="padding: 0; cursor: default">
            <span class="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            <span class="brand-copy">
              cooperativa<span>digital</span>
            </span>
          </div>
          <span class="auth-pill">
            <ShieldCheck :size="14" />
            Acceso protegido por sesión
          </span>
        </div>

        <div class="auth-hero-body">
          <p class="eyebrow" style="color: var(--mint)">ESCUELA SECUNDARIA TÉCNICA · 7.º AÑO</p>
          <h1>Sistema de Gestión Cooperativa Escolar</h1>
          <p class="auth-hero-desc">
            Iniciá sesión con tu cuenta institucional para acceder con los permisos asignados por el
            Consejo de Administración o el Administrador Técnico.
          </p>
        </div>

        <div class="auth-hero-footer">
          <div class="auth-status-chip">
            <span
              class="auth-dot"
              :style="{ background: supabaseConfigured ? 'var(--mint)' : 'var(--sun)' }"
            />
            <span>
              {{
                supabaseConfigured
                  ? 'Autenticación conectada a Supabase Auth'
                  : 'Autenticación local activa (modo sin credenciales)'
              }}
            </span>
          </div>
        </div>
      </aside>

      <!-- Panel derecho: solo Login / Recuperación -->
      <main class="auth-card-wrap">
        <div class="auth-card">
          <div v-if="isModal" style="display: flex; justify-content: flex-end; margin-bottom: 8px">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cerrar ventana de acceso"
              @click="emit('close')"
            >
              <X :size="18" />
            </Button>
          </div>

          <div v-if="errorMessage" class="auth-alert auth-alert-error" role="alert">
            {{ errorMessage }}
          </div>
          <div v-if="infoMessage" class="auth-alert auth-alert-info" role="status">
            {{ infoMessage }}
          </div>

          <form v-if="!forgotMode" class="auth-form" @submit.prevent="handleLogin">
            <div class="auth-form-head">
              <h2>Ingresá con tu cuenta</h2>
              <p>Usá tu correo institucional o nombre de usuario y tu contraseña.</p>
            </div>

            <label class="auth-field">
              <span>Correo electrónico o usuario</span>
              <div class="auth-input-wrap">
                <Mail :size="16" class="auth-input-icon" />
                <input
                  v-model="loginForm.identifier"
                  type="text"
                  autocomplete="username"
                  placeholder="seba o nombre@escuela.edu.ar"
                  required
                />
              </div>
            </label>

            <label class="auth-field">
              <span>Contraseña</span>
              <div class="auth-input-wrap">
                <Lock :size="16" class="auth-input-icon" />
                <input
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="Tu contraseña"
                  required
                />
                <button
                  type="button"
                  class="auth-eye"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" :size="15" />
                  <Eye v-else :size="15" />
                </button>
              </div>
            </label>

            <div style="display: flex; justify-content: flex-end; margin-top: -6px">
              <button
                type="button"
                class="auth-link-btn"
                style="font-size: 12px"
                @click="forgotMode = true; errorMessage = ''; infoMessage = ''; resetIdentifier = loginForm.identifier"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <Button type="submit" class="auth-submit" :disabled="isSubmitting">
              <span>{{ isSubmitting ? 'Ingresando...' : 'Iniciar sesión' }}</span>
              <ArrowRight :size="16" />
            </Button>

            <div class="auth-admin-notice">
              <Info :size="15" />
              <p>
                <strong>Alta y asignación de roles:</strong> Solo el Consejo de Administración o el
                Administrador Técnico crean cuentas y asignan roles. Si es tu primer ingreso con
                contraseña inicial, el sistema te pedirá cambiarla al entrar.
              </p>
            </div>
          </form>

          <form v-else class="auth-form" @submit.prevent="handleResetPassword">
            <div class="auth-form-head">
              <h2>Recuperar contraseña</h2>
              <p>Ingresá tu usuario o correo institucional para restablecer el acceso.</p>
            </div>

            <label class="auth-field">
              <span>Correo electrónico o usuario</span>
              <div class="auth-input-wrap">
                <Mail :size="16" class="auth-input-icon" />
                <input
                  v-model="resetIdentifier"
                  type="text"
                  placeholder="seba o nombre@escuela.edu.ar"
                  required
                />
              </div>
            </label>

            <Button type="submit" class="auth-submit" :disabled="isSubmitting">
              <span>{{ isSubmitting ? 'Procesando...' : 'Enviar recuperación' }}</span>
              <ArrowRight :size="16" />
            </Button>

            <p class="auth-switch-hint">
              <button
                type="button"
                class="auth-link-btn"
                @click="forgotMode = false; errorMessage = ''; infoMessage = ''"
              >
                Volver a iniciar sesión
              </button>
            </p>
          </form>
        </div>
      </main>
    </div>
  </div>
</template>
