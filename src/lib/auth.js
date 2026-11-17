import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient, getSupabaseConfig } from './supabase'
import { ROLES_COOPERATIVA } from '../data/cooperativaModels'

const LOCAL_USERS_KEY = 'coop_auth_local_users_v1'
const LOCAL_SESSION_KEY = 'coop_auth_local_session_v1'
const DEFAULT_ROLE_ID = 'socio'

export function getInitials(fullName, email) {
  const source = (fullName || email || 'CD').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

function normalizeRoleId(roleId) {
  const exists = ROLES_COOPERATIVA.some((r) => r.id === roleId)
  return exists ? roleId : DEFAULT_ROLE_ID
}

export function canManageUserAccounts(roleId) {
  return roleId === 'consejo_administracion' || roleId === 'admin_tecnico'
}

function mapSupabaseUser(supaUser) {
  if (!supaUser) return null
  const meta = supaUser.user_metadata || {}
  const fullName = (meta.full_name || meta.name || supaUser.email || 'Usuario').trim()
  const username = (meta.username || (supaUser.email || '').split('@')[0] || '').trim()
  const roleId = normalizeRoleId(meta.role_id)
  return {
    id: supaUser.id,
    email: supaUser.email || '',
    username,
    fullName,
    roleId,
    avatarUrl: meta.avatar_url || '',
    mustChangePassword: Boolean(meta.must_change_password),
    initials: getInitials(fullName, supaUser.email),
    provider: 'supabase',
  }
}

function seedDefaultLocalUsersIfEmpty() {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(LOCAL_USERS_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {
      // Continuar con semilla
    }
  }
  const initialAdmin = [
    {
      id: 'local-admin-1',
      email: 'consejo@cooperativa.edu.ar',
      username: 'consejo',
      password: 'coop2026',
      fullName: 'Consejo de Administración',
      roleId: 'consejo_administracion',
      avatarUrl: '',
      mustChangePassword: false,
    },
  ]
  window.localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(initialAdmin))
  return initialAdmin
}

function readLocalUsers() {
  if (typeof window === 'undefined') return []
  return seedDefaultLocalUsersIfEmpty()
}

function writeLocalUsers(users) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
}

function readLocalSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LOCAL_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeLocalSession(user) {
  if (typeof window === 'undefined') return
  if (!user) {
    window.localStorage.removeItem(LOCAL_SESSION_KEY)
  } else {
    window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user))
  }
}

function translateAuthError(message) {
  const msg = String(message || '').toLowerCase()
  if (msg.includes('invalid login credentials')) {
    return 'Usuario, correo o contraseña incorrectos.'
  }
  if (msg.includes('email not confirmed')) {
    return 'Debés confirmar tu correo electrónico antes de iniciar sesión.'
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'Ya existe una cuenta registrada con ese correo electrónico.'
  }
  if (msg.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }
  if (msg.includes('unable to validate email address')) {
    return 'Ingresá un correo electrónico válido.'
  }
  return message || 'No se pudo completar la operación de cuenta.'
}

export async function getCurrentSession() {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client.auth.getSession()
      if (!error && data?.session?.user) {
        const mapped = mapSupabaseUser(data.session.user)
        // Sincronizar rol desde public.usuarios si existe
        const { data: dbUser } = await client
          .from('usuarios')
          .select('rol, nombre_completo, username')
          .eq('email_institucional', mapped.email)
          .maybeSingle()
        if (dbUser) {
          mapped.roleId = normalizeRoleId(dbUser.rol || mapped.roleId)
          if (dbUser.nombre_completo && (!mapped.fullName || mapped.fullName === mapped.email)) {
            mapped.fullName = dbUser.nombre_completo
            mapped.initials = getInitials(mapped.fullName, mapped.email)
          }
          if (dbUser.username && !mapped.username) {
            mapped.username = dbUser.username
          }
        }
        return mapped
      }
      return null
    } catch {
      return null
    }
  }
  return readLocalSession()
}

export async function loginWithEmail({ identifier, email, password }) {
  const cleanId = String(identifier || email || '').trim().toLowerCase()
  const cleanPass = String(password || '')

  if (!cleanId || !cleanPass) {
    return { user: null, error: 'Completá tu correo o nombre de usuario y tu contraseña.' }
  }

  const client = getSupabaseClient()
  if (client) {
    try {
      let loginEmail = cleanId
      if (!cleanId.includes('@')) {
        const { data: userRow, error: lookupErr } = await client
          .from('usuarios')
          .select('email_institucional')
          .eq('username', cleanId)
          .maybeSingle()
        if (lookupErr || !userRow?.email_institucional) {
          return { user: null, error: 'Usuario o contraseña incorrectos.' }
        }
        loginEmail = userRow.email_institucional
      }

      const { data, error } = await client.auth.signInWithPassword({
        email: loginEmail,
        password: cleanPass,
      })
      if (error) {
        return { user: null, error: translateAuthError(error.message) }
      }
      const mapped = mapSupabaseUser(data.user)
      const { data: dbUser } = await client
        .from('usuarios')
        .select('rol, nombre_completo, username')
        .eq('email_institucional', mapped.email)
        .maybeSingle()
      if (dbUser) {
        mapped.roleId = normalizeRoleId(dbUser.rol || mapped.roleId)
        if (dbUser.nombre_completo) {
          mapped.fullName = dbUser.nombre_completo
          mapped.initials = getInitials(mapped.fullName, mapped.email)
        }
        if (dbUser.username) mapped.username = dbUser.username
      }
      return { user: mapped, error: null }
    } catch (err) {
      return { user: null, error: translateAuthError(err?.message) }
    }
  }

  // Modo local (sin Supabase configurado)
  const users = readLocalUsers()
  const found = users.find(
    (u) => (u.email === cleanId || u.username === cleanId) && u.password === cleanPass
  )
  if (!found) {
    return { user: null, error: 'Usuario, correo o contraseña incorrectos.' }
  }
  const sessionUser = {
    id: found.id,
    email: found.email,
    username: found.username || found.email.split('@')[0],
    fullName: found.fullName,
    roleId: normalizeRoleId(found.roleId),
    avatarUrl: found.avatarUrl || '',
    mustChangePassword: Boolean(found.mustChangePassword),
    initials: getInitials(found.fullName, found.email),
    provider: 'local',
  }
  writeLocalSession(sessionUser)
  return { user: sessionUser, error: null }
}

export async function updateUserProfile({ fullName, username, avatarUrl }) {
  const cleanName = String(fullName || '').trim()
  const cleanUsername = String(username || '').trim().toLowerCase()

  if (cleanName.length < 3) {
    return { user: null, error: 'El nombre y apellido debe tener al menos 3 caracteres.' }
  }
  if (!/^[a-z0-9._-]{3,30}$/.test(cleanUsername)) {
    return {
      user: null,
      error: 'El usuario debe tener entre 3 y 30 caracteres (letras, números, punto o guion).',
    }
  }

  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client.auth.updateUser({
        data: {
          full_name: cleanName,
          username: cleanUsername,
          avatar_url: avatarUrl || '',
        },
      })
      if (error) {
        return { user: null, error: translateAuthError(error.message) }
      }
      const mapped = mapSupabaseUser(data.user)
      await client
        .from('usuarios')
        .update({
          nombre_completo: cleanName,
          username: cleanUsername,
          iniciales: getInitials(cleanName, mapped.email),
        })
        .eq('email_institucional', mapped.email)

      return { user: mapped, error: null }
    } catch (err) {
      return { user: null, error: translateAuthError(err?.message) }
    }
  }

  const current = readLocalSession()
  if (!current) return { user: null, error: 'No hay sesión activa.' }
  const users = readLocalUsers()
  if (users.some((u) => u.username === cleanUsername && u.id !== current.id)) {
    return { user: null, error: 'Ese nombre de usuario ya está en uso.' }
  }
  const updatedUsers = users.map((u) =>
    u.id === current.id
      ? { ...u, fullName: cleanName, username: cleanUsername, avatarUrl: avatarUrl || '' }
      : u
  )
  writeLocalUsers(updatedUsers)
  const updatedSession = {
    ...current,
    fullName: cleanName,
    username: cleanUsername,
    avatarUrl: avatarUrl || '',
    initials: getInitials(cleanName, current.email),
  }
  writeLocalSession(updatedSession)
  return { user: updatedSession, error: null }
}

export async function changeUserPassword(newPassword, currentPassword) {
  const cleanPass = String(newPassword || '')
  if (cleanPass.length < 6) {
    return { user: null, error: 'La nueva contraseña debe tener al menos 6 caracteres.' }
  }

  const client = getSupabaseClient()
  if (client) {
    try {
      if (currentPassword !== undefined) {
        const cleanCurrent = String(currentPassword || '')
        if (!cleanCurrent) {
          return { user: null, error: 'Ingresá tu contraseña actual.' }
        }
        const { data: sessionData } = await client.auth.getSession()
        const email = sessionData?.session?.user?.email
        if (!email) {
          return { user: null, error: 'No hay sesión activa.' }
        }
        const { error: verifyErr } = await client.auth.signInWithPassword({
          email,
          password: cleanCurrent,
        })
        if (verifyErr) {
          return { user: null, error: 'La contraseña actual es incorrecta.' }
        }
      }

      const { data, error } = await client.auth.updateUser({
        password: cleanPass,
        data: {
          must_change_password: false,
        },
      })
      if (error) {
        return { user: null, error: translateAuthError(error.message) }
      }
      return { user: mapSupabaseUser(data.user), error: null }
    } catch (err) {
      return { user: null, error: translateAuthError(err?.message) }
    }
  }

  const current = readLocalSession()
  if (!current) return { user: null, error: 'No hay sesión activa.' }
  const users = readLocalUsers()
  if (currentPassword !== undefined) {
    const cleanCurrent = String(currentPassword || '')
    const found = users.find((u) => u.id === current.id)
    if (!found || found.password !== cleanCurrent) {
      return { user: null, error: 'La contraseña actual es incorrecta.' }
    }
  }
  const updatedUsers = users.map((u) =>
    u.id === current.id ? { ...u, password: cleanPass, mustChangePassword: false } : u
  )
  writeLocalUsers(updatedUsers)
  const updatedSession = { ...current, mustChangePassword: false }
  writeLocalSession(updatedSession)
  return { user: updatedSession, error: null }
}

export async function adminCreateUserAccount({
  fullName,
  username,
  email,
  roleId,
  initialPassword = 'coop2026',
}) {
  const cleanName = String(fullName || '').trim()
  const cleanUsername = String(username || '').trim().toLowerCase()
  const cleanEmail = String(email || '').trim().toLowerCase()
  const cleanPass = String(initialPassword || 'coop2026')
  const validRoleId = normalizeRoleId(roleId)

  if (cleanName.length < 3) {
    return { createdUser: null, error: 'Ingresá nombre y apellido (mínimo 3 caracteres).' }
  }
  if (!/^[a-z0-9._-]{3,30}$/.test(cleanUsername)) {
    return {
      createdUser: null,
      error: 'El usuario debe tener entre 3 y 30 caracteres (letras, números, punto o guion).',
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { createdUser: null, error: 'Ingresá un correo electrónico válido.' }
  }
  if (cleanPass.length < 6) {
    return { createdUser: null, error: 'La contraseña inicial debe tener al menos 6 caracteres.' }
  }

  const cfg = getSupabaseConfig()
  const client = getSupabaseClient()
  if (client && cfg.isConfigured) {
    try {
      const { data: existingUsername } = await client
        .from('usuarios')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle()
      if (existingUsername) {
        return { createdUser: null, error: 'Ese nombre de usuario ya está registrado.' }
      }

      // Cliente efímero para no cerrar la sesión actual del Consejo / Admin
      const ephemeral = createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { data, error } = await ephemeral.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: {
            full_name: cleanName,
            username: cleanUsername,
            role_id: validRoleId,
            must_change_password: true,
          },
        },
      })
      if (error) {
        return { createdUser: null, error: translateAuthError(error.message) }
      }

      const newId = `USR-${Date.now().toString().slice(-6)}`
      await client.from('usuarios').upsert(
        {
          id: newId,
          auth_user_id: data?.user?.id || null,
          username: cleanUsername,
          nombre_completo: cleanName,
          iniciales: getInitials(cleanName, cleanEmail),
          email_institucional: cleanEmail,
          rol: validRoleId,
          cargo_institucional: ROLES_COOPERATIVA.find((r) => r.id === validRoleId)?.shortLabel || 'Socio',
          estado_socio: 'Activo',
        },
        { onConflict: 'email_institucional' }
      )

      return {
        createdUser: {
          id: newId,
          fullName: cleanName,
          username: cleanUsername,
          email: cleanEmail,
          roleId: validRoleId,
          mustChangePassword: true,
        },
        error: null,
      }
    } catch (err) {
      return { createdUser: null, error: translateAuthError(err?.message) }
    }
  }

  // Modo local
  const users = readLocalUsers()
  if (users.some((u) => u.email === cleanEmail)) {
    return { createdUser: null, error: 'Ya existe una cuenta registrada con ese correo.' }
  }
  if (users.some((u) => u.username === cleanUsername)) {
    return { createdUser: null, error: 'Ese nombre de usuario ya está en uso.' }
  }
  const newUser = {
    id: `local-${Date.now()}`,
    email: cleanEmail,
    username: cleanUsername,
    password: cleanPass,
    fullName: cleanName,
    roleId: validRoleId,
    avatarUrl: '',
    mustChangePassword: true,
  }
  writeLocalUsers([...users, newUser])
  return { createdUser: newUser, error: null }
}

export async function listCooperativeUsers() {
  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('usuarios')
        .select('id, username, nombre_completo, email_institucional, rol, estado_socio')
        .order('nombre_completo', { ascending: true })
      if (!error && Array.isArray(data)) {
        return {
          users: data.map((u) => ({
            id: u.id,
            username: u.username,
            fullName: u.nombre_completo,
            email: u.email_institucional,
            roleId: normalizeRoleId(u.rol),
            status: u.estado_socio,
          })),
          error: null,
        }
      }
    } catch {
      // Fallback
    }
  }
  const local = readLocalUsers()
  return {
    users: local.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      roleId: normalizeRoleId(u.roleId),
      status: 'Activo',
    })),
    error: null,
  }
}

export async function adminUpdateUserRole(userId, newRoleId) {
  const validRoleId = normalizeRoleId(newRoleId)
  const client = getSupabaseClient()
  if (client) {
    try {
      const { error } = await client
        .from('usuarios')
        .update({
          rol: validRoleId,
          cargo_institucional: ROLES_COOPERATIVA.find((r) => r.id === validRoleId)?.shortLabel || 'Socio',
        })
        .eq('id', userId)
      if (error) return { ok: false, error: error.message }
      return { ok: true, error: null }
    } catch (err) {
      return { ok: false, error: err?.message || 'No se pudo actualizar el rol.' }
    }
  }
  const users = readLocalUsers()
  const updated = users.map((u) => (u.id === userId ? { ...u, roleId: validRoleId } : u))
  writeLocalUsers(updated)
  return { ok: true, error: null }
}

export async function logoutSession() {
  const client = getSupabaseClient()
  if (client) {
    try {
      await client.auth.signOut()
    } catch {
      // Ignorar error de red al cerrar sesión
    }
  }
  writeLocalSession(null)
}

export async function requestPasswordReset(identifier) {
  const cleanId = String(identifier || '').trim().toLowerCase()
  if (!cleanId) {
    return { ok: false, message: 'Ingresá tu correo electrónico o nombre de usuario.' }
  }

  const client = getSupabaseClient()
  if (client) {
    try {
      let email = cleanId
      if (!cleanId.includes('@')) {
        const { data: userRow } = await client
          .from('usuarios')
          .select('email_institucional')
          .eq('username', cleanId)
          .maybeSingle()
        if (!userRow?.email_institucional) {
          return {
            ok: false,
            message: 'No encontramos un usuario con ese nombre. Probá con tu correo institucional.',
          }
        }
        email = userRow.email_institucional
      }
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      })
      if (error) {
        return { ok: false, message: translateAuthError(error.message) }
      }
      return {
        ok: true,
        message: `Enviamos un correo de recuperación a ${email}. Si no te llega, pedile al Consejo o Admin Técnico que restablezca tu contraseña.`,
      }
    } catch (err) {
      return { ok: false, message: translateAuthError(err?.message) }
    }
  }

  // Modo local: restablece a la contraseña inicial 'coop2026' y obliga a cambiarla
  const users = readLocalUsers()
  const found = users.find((u) => u.email === cleanId || u.username === cleanId)
  if (!found) {
    return { ok: false, message: 'No encontramos ninguna cuenta con ese correo o usuario.' }
  }
  const updated = users.map((u) =>
    u.id === found.id ? { ...u, password: 'coop2026', mustChangePassword: true } : u
  )
  writeLocalUsers(updated)
  return {
    ok: true,
    message:
      'Modo local: tu contraseña se restableció a "coop2026". Iniciá sesión con ella y el sistema te pedirá elegir una nueva.',
  }
}

export function onAuthChange(callback) {
  const client = getSupabaseClient()
  if (!client) return () => {}
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? mapSupabaseUser(session.user) : null)
  })
  return () => data?.subscription?.unsubscribe()
}
