<template>
  <div class="login-page">
    <div class="theme-toggle">
      <button class="btn btn-ghost btn-sm" @click="toggleTheme" title="Toggle Theme">
        <Sun :size="18" v-if="theme === 'dark'" />
        <Moon :size="18" v-else />
      </button>
    </div>

    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">
          <HardHat :size="28" />
        </div>
        <h1 class="login-title">KontraktorApp</h1>
        <p class="login-subtitle">Sistem Informasi Operasional Proyek</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-control"
            placeholder="admin@kontraktor.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="password-wrapper">
            <input
              id="password"
              v-model="form.password"
              :type="showPass ? 'text' : 'password'"
              class="form-control"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
            <button type="button" class="eye-btn" @click="showPass = !showPass">
              <Eye :size="16" v-if="!showPass" />
              <EyeOff :size="16" v-else />
            </button>
          </div>
        </div>

        <div class="error-msg" v-if="errorMsg">{{ errorMsg }}</div>

        <button type="submit" class="btn btn-primary w-full" :disabled="loading" id="btn-login">
          <div class="loading-spinner" v-if="loading" style="width:16px;height:16px;border-width:2px"></div>
          <LogIn :size="16" v-else />
          {{ loading ? 'Masuk...' : 'Masuk' }}
        </button>
      </form>

      <div class="login-footer">
        <p>Belum punya akun? <RouterLink to="/register" class="text-primary font-medium">Daftar di sini</RouterLink></p>
        <p style="margin-top:0.5rem;color:var(--text-faint);font-size:0.75rem">© 2025 KontraktorApp · All rights reserved</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { HardHat, LogIn, Eye, EyeOff, Sun, Moon } from '@lucide/vue'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToast()
const { theme, toggleTheme } = useTheme()
const form = ref({ email: '', password: '' })
const loading = ref(false)
const showPass = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    const result = await auth.login(form.value.email, form.value.password)
    if (result.success) {
      toast.success(`Selamat datang, ${result.user.nama}!`)
      router.push('/')
    } else {
      errorMsg.value = result.message || 'Login gagal'
    }
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Terjadi kesalahan. Coba lagi.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: var(--bg);
}

.theme-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.login-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  position: relative;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-logo {
  width: 56px;
  height: 56px;
  background: var(--primary);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: var(--text-on-primary);
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.login-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 0.3rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.password-wrapper {
  position: relative;
}

.password-wrapper .form-control {
  padding-right: 2.5rem;
}

.eye-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  padding: 0;
}

.eye-btn:hover { color: var(--text); }

.error-msg {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--danger);
  border-radius: var(--radius-sm);
  padding: 0.6rem 0.75rem;
  font-size: 0.85rem;
}

.login-footer {
  margin-top: 1.5rem;
  text-align: center;
  color: var(--text-faint);
  font-size: 0.75rem;
}
</style>
