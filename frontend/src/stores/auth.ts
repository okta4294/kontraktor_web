import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export interface User {
  id: number
  nama: string
  email: string
  role: 'administrator' | 'project_manager' | 'admin' | 'logistik' | 'operator'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'administrator')
  const isPM = computed(() => user.value?.role === 'project_manager')

  const canAccess = (roles: string[]) => {
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  async function login(email: string, password: string) {
    const { data } = await authApi.login(email, password)
    if (data.success) {
      token.value = data.token
      user.value = data.user
      localStorage.setItem('token', data.token)
    }
    return data
  }

  async function fetchMe() {
    try {
      const { data } = await authApi.me()
      if (data.success) {
        user.value = data.data
      }
    } catch {
      logout()
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  return { user, token, isAuthenticated, isAdmin, isPM, canAccess, login, fetchMe, logout }
})
