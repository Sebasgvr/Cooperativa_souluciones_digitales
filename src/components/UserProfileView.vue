<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Camera,
  CheckCircle2,
  KeyRound,
  LogOut,
  Pencil,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-vue-next'
import Button from './ui/Button.vue'
import CustomSelect from './ui/CustomSelect.vue'
import { ROLES_COOPERATIVA } from '../data/cooperativaModels'
import {
  adminCreateUserAccount,
  adminUpdateUserRole,
  canManageUserAccounts,
  changeUserPassword,
  listCooperativeUsers,
  updateUserProfile,
} from '../lib/auth'

const props = defineProps({
  authUser: {
    type: Object,
    required: true,
  },
  roleLabel: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    default: 'profile', // 'profile' | 'admin'
  },
})

const emit = defineEmits(['user-updated', 'logout', 'open-login'])

const isAdmin = computed(() => canManageUserAccounts(props.authUser?.roleId))

// Formulario de perfil
const profileForm = ref({
  fullName: props.authUser.fullName || '',
  username: props.authUser.username || '',
  avatarUrl: props.authUser.avatarUrl || '',
})
const profileMsg = ref({ type: '', text: '' })
const savingProfile = ref(false)

// Formulario de contraseña
const passForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passMsg = ref({ type: '', text: '' })
const savingPass = ref(false)

// Formulario de alta de usuario (solo Consejo / Admin)
const createUserForm = ref({
  fullName: '',
  username: '',
  email: '',
  roleId: 'socio',
  initialPassword: 'coop2026',
})
const createMsg = ref({ type: '', text: '' })
const creatingUser = ref(false)
const usersList = ref([])
const loadingUsers = ref(false)

async function loadUsers() {
  if (!isAdmin.value) return
  loadingUsers.value = true
  const { users } = await listCooperativeUsers()
  usersList.value = users || []
  loadingUsers.value = false
}

onMounted(() => {
  loadUsers()
})

function handleAvatarFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    profileMsg.value = { type: 'error', text: 'Seleccioná un archivo de imagen válido (JPG, PNG o WebP).' }
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      const size = 200
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      const minSide = Math.min(img.width, img.height)
      const sx = (img.width - minSide) / 2
      const sy = (img.height - minSide) / 2
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size)
      profileForm.value.avatarUrl = canvas.toDataURL('image/png')
      profileMsg.value = {
        type: 'info',
        text: 'Foto cargada en vista previa. Hacé clic en "Guardar datos del perfil" para confirmarla.',
      }
    }
    img.src = String(reader.result)
  }
  reader.readAsDataURL(file)
}

async function handleSaveProfile() {
  profileMsg.value = { type: '', text: '' }
  savingProfile.value = true
  const { user, error } = await updateUserProfile({
    fullName: profileForm.value.fullName,
    username: profileForm.value.username,
    avatarUrl: profileForm.value.avatarUrl,
  })
  savingProfile.value = false
  if (error) {
    profileMsg.value = { type: 'error', text: error }
    return
  }
  if (user) {
    emit('user-updated', user)
    profileMsg.value = { type: 'success', text: 'Datos y foto de perfil actualizados correctamente.' }
  }
}

async function handleChangePassword() {
  passMsg.value = { type: '', text: '' }
  if (!passForm.value.currentPassword) {
    passMsg.value = { type: 'error', text: 'Ingresá tu contraseña actual.' }
    return
  }
  if (passForm.value.newPassword !== passForm.value.confirmPassword) {
    passMsg.value = { type: 'error', text: 'Las contraseñas nuevas no coinciden.' }
    return
  }
  savingPass.value = true
  const { user, error } = await changeUserPassword(
    passForm.value.newPassword,
    passForm.value.currentPassword
  )
  savingPass.value = false
  if (error) {
    passMsg.value = { type: 'error', text: error }
    return
  }
  passForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  if (user) emit('user-updated', user)
  passMsg.value = { type: 'success', text: 'Contraseña actualizada correctamente.' }
}

async function handleAdminCreateUser() {
  createMsg.value = { type: '', text: '' }
  creatingUser.value = true
  const { createdUser, error } = await adminCreateUserAccount(createUserForm.value)
  creatingUser.value = false
  if (error) {
    createMsg.value = { type: 'error', text: error }
    return
  }
  createMsg.value = {
    type: 'success',
    text: `Cuenta creada para ${createdUser.fullName} (${createdUser.username}). Contraseña inicial: "${createUserForm.value.initialPassword}". El sistema le exigirá cambiarla al iniciar sesión.`,
  }
  createUserForm.value = {
    fullName: '',
    username: '',
    email: '',
    roleId: 'socio',
    initialPassword: 'coop2026',
  }
  await loadUsers()
}

async function handleRoleChange(userId, newRoleId) {
  const { ok, error } = await adminUpdateUserRole(userId, newRoleId)
  if (!ok) {
    createMsg.value = { type: 'error', text: error || 'No se pudo actualizar el rol.' }
    return
  }
  createMsg.value = { type: 'success', text: 'Rol actualizado en el padrón de usuarios.' }
  await loadUsers()
}
</script>

<template>
  <div class="profile-shell">
    <!-- CABECERA Y DATOS PERSONALES (SOLO EN MODO PERFIL) -->
    <template v-if="mode !== 'admin'">
    <section class="profile-card profile-hero">
      <div class="profile-avatar-block">
        <label
          class="profile-avatar-clickable"
          title="Hacé clic en la imagen para cambiar tu foto de perfil"
        >
          <div class="profile-avatar-circle">
            <img
              v-if="profileForm.avatarUrl"
              :src="profileForm.avatarUrl"
              alt="Foto de perfil"
              class="profile-avatar-img"
            />
            <span v-else>{{ authUser.initials }}</span>
            <span class="profile-avatar-hover">
              <Camera :size="18" />
            </span>
          </div>
          <span class="profile-avatar-edit-badge" aria-hidden="true">
            <Pencil :size="12" />
          </span>
          <input type="file" accept="image/*" hidden @change="handleAvatarFile" />
        </label>
        <Button
          v-if="profileForm.avatarUrl"
          variant="ghost"
          size="sm"
          title="Quitar foto de perfil"
          @click="profileForm.avatarUrl = ''"
        >
          <Trash2 :size="14" />
          <span>Quitar</span>
        </Button>
      </div>

      <div class="profile-summary">
        <span class="eyebrow">CUENTA PERSONAL · COOPERATIVA DIGITAL</span>
        <h2>{{ authUser.fullName }}</h2>
        <p class="profile-meta-line">
          <span><strong>Usuario:</strong> @{{ authUser.username }}</span>
          <span>·</span>
          <span><strong>Correo:</strong> {{ authUser.email }}</span>
        </p>
        <div class="profile-badges">
          <span class="profile-role-pill">
            <Shield :size="14" />
            Rol asignado: {{ roleLabel }}
          </span>
        </div>
      </div>

      <div class="profile-session-actions">
        <Button variant="outline" size="sm" @click="emit('open-login')">
          <UserCheck :size="15" />
          <span>Cambiar de cuenta</span>
        </Button>
        <Button variant="outline" size="sm" @click="emit('logout')">
          <LogOut :size="15" />
          <span>Cerrar sesión</span>
        </Button>
      </div>
    </section>

    <div class="profile-grid">
      <!-- EDITAR DATOS PERSONALES -->
      <section class="profile-card">
        <div class="profile-card-head">
          <UserCheck :size="18" />
          <div>
            <h3>Mis datos personales</h3>
            <p>Actualizá tu nombre visible, usuario y foto de perfil.</p>
          </div>
        </div>

        <div v-if="profileMsg.text" :class="['profile-alert', `profile-alert-${profileMsg.type}`]">
          {{ profileMsg.text }}
        </div>

        <form class="profile-form" @submit.prevent="handleSaveProfile">
          <label>
            Nombre y apellido
            <input v-model="profileForm.fullName" type="text" required minlength="3" />
          </label>
          <label>
            Nombre de usuario
            <input v-model="profileForm.username" type="text" required minlength="3" />
          </label>
          <label>
            Correo institucional (solo lectura)
            <input :value="authUser.email" type="email" disabled />
          </label>
          <label>
            Rol asignado (solo modificable por Consejo / Admin)
            <input :value="roleLabel" type="text" disabled />
          </label>
        </form>
      </section>

      <!-- CAMBIAR CONTRASEÑA (INDEPENDIENTE) -->
      <section class="profile-card">
        <div class="profile-card-head">
          <KeyRound :size="18" />
          <div>
            <h3>Seguridad y contraseña</h3>
            <p>Ingresá tu contraseña actual para definir una nueva (mínimo 6 caracteres).</p>
          </div>
        </div>

        <div v-if="passMsg.text" :class="['profile-alert', `profile-alert-${passMsg.type}`]">
          {{ passMsg.text }}
        </div>

        <form class="profile-form" @submit.prevent="handleChangePassword">
          <label>
            Contraseña actual *
            <input
              v-model="passForm.currentPassword"
              type="password"
              autocomplete="current-password"
              placeholder="Tu contraseña actual"
              required
            />
          </label>
          <label>
            Nueva contraseña *
            <input
              v-model="passForm.newPassword"
              type="password"
              minlength="6"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </label>
          <label>
            Confirmar nueva contraseña *
            <input
              v-model="passForm.confirmPassword"
              type="password"
              minlength="6"
              placeholder="Repetí tu nueva contraseña"
              required
            />
          </label>
          <Button type="submit" :disabled="savingPass">
            <KeyRound :size="15" />
            <span>{{ savingPass ? 'Actualizando...' : 'Actualizar contraseña' }}</span>
          </Button>
        </form>
      </section>
    </div>

    <!-- BARRA ESTÁTICA INFERIOR PARA GUARDAR CAMBIOS DE PERFIL Y FOTO -->
    <div class="profile-save-bar">
      <span>Recordá guardar después de modificar tu foto o tus datos personales.</span>
      <button
        type="button"
        class="profile-save-btn"
        :disabled="savingProfile"
        @click="handleSaveProfile"
      >
        <CheckCircle2 :size="16" />
        <span>{{ savingProfile ? 'Guardando...' : 'Guardar cambios' }}</span>
      </button>
    </div>
    </template>

    <!-- PANEL EXCLUSIVO PARA CONSEJO / ADMIN: CREAR CUENTAS Y ASIGNAR ROLES -->
    <section v-if="mode === 'admin' && isAdmin" class="profile-card">
      <div class="profile-card-head">
        <Users :size="18" />
        <div>
          <span class="eyebrow">ADMINISTRACIÓN DE ACCESOS · EXCLUSIVO CONSEJO / ADMIN</span>
          <h3>Crear cuentas y asignar roles</h3>
          <p>
            Solo el Consejo de Administración o el Administrador Técnico pueden crear usuarios y
            definir su rol. La contraseña inicial es sencilla y el usuario deberá cambiarla al
            iniciar sesión por primera vez.
          </p>
        </div>
      </div>

      <div v-if="createMsg.text" :class="['profile-alert', `profile-alert-${createMsg.type}`]">
        {{ createMsg.text }}
      </div>

      <form class="profile-admin-form" @submit.prevent="handleAdminCreateUser">
        <label>
          Nombre y apellido *
          <input v-model="createUserForm.fullName" type="text" placeholder="Ej. Sofía Fernández" required />
        </label>
        <label>
          Nombre de usuario *
          <input v-model="createUserForm.username" type="text" placeholder="Ej. sofia.fernandez" required />
        </label>
        <label>
          Correo institucional *
          <input v-model="createUserForm.email" type="email" placeholder="sofia@escuela.edu.ar" required />
        </label>
        <label>
          Rol asignado *
          <CustomSelect
            v-model="createUserForm.roleId"
            :options="ROLES_COOPERATIVA.map((r) => ({ value: r.id, label: r.label }))"
            style="width: 100%"
          />
        </label>
        <label>
          Contraseña inicial sencilla *
          <input v-model="createUserForm.initialPassword" type="text" minlength="6" required />
          <small style="color: var(--muted-foreground)">
            Por defecto: <code>coop2026</code> (el sistema obligará a cambiarla al ingresar).
          </small>
        </label>
        <div class="profile-admin-submit-wrap">
          <span class="profile-admin-spacer" aria-hidden="true">&nbsp;</span>
          <Button type="submit" style="height: 38px; width: 100%" :disabled="creatingUser">
            <UserPlus :size="15" />
            <span>{{ creatingUser ? 'Creando cuenta...' : 'Crear cuenta y asignar rol' }}</span>
          </Button>
        </div>
      </form>

      <div class="table-responsive" style="margin-top: 18px">
        <table class="kpi-matrix-table profile-users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol asignado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingUsers">
              <td colspan="4">Cargando padrón de usuarios...</td>
            </tr>
            <tr v-for="u in usersList" :key="u.id">
              <td><strong>{{ u.fullName }}</strong></td>
              <td><strong>@{{ u.username }}</strong></td>
              <td><strong>{{ u.email }}</strong></td>
              <td>
                <CustomSelect
                  :model-value="u.roleId"
                  :options="ROLES_COOPERATIVA.map((r) => ({ value: r.id, label: r.label }))"
                  class="cselect-compact"
                  style="width: 240px; min-width: 240px"
                  @update:model-value="(val) => handleRoleChange(u.id, val)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
