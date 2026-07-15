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
        <h1 class="login-title">Registrasi Akun</h1>
        <p class="login-subtitle">Bergabung dengan KontraktorApp</p>
      </div>

      <form @submit.prevent="handleRegister" class="login-form">
        <div class="form-group">
          <label class="form-label">Nama Lengkap</label>
          <input
            id="nama"
            v-model="form.nama"
            type="text"
            class="form-control"
            placeholder="John Doe"
            required
            autocomplete="name"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-control"
            placeholder="john@kontraktor.com"
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
              minlength="6"
              autocomplete="new-password"
            />
            <button type="button" class="eye-btn" @click="showPass = !showPass">
              <Eye :size="16" v-if="!showPass" />
              <EyeOff :size="16" v-else />
            </button>
          </div>
        </div>

        <div class="error-msg" v-if="errorMsg">{{ errorMsg }}</div>

        <button type="submit" class="btn btn-primary w-full" :disabled="loading" id="btn-register">
          <div class="loading-spinner" v-if="loading" style="width:16px;height:16px;border-width:2px"></div>
          <UserPlus :size="16" v-else />
          {{ loading ? 'Mendaftar...' : 'Daftar' }}
        </button>
      </form>

      <div class="login-footer">
        <p>Sudah punya akun? <RouterLink to="/login" class="text-primary font-medium">Masuk di sini</RouterLink></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import { useToast } from 'vue-toastification'
import { HardHat, UserPlus, Eye, EyeOff, Sun, Moon } from '@lucide/vue'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const toast = useToast()
const { theme, toggleTheme } = useTheme()

const form = ref({ nama: '', email: '', password: '' })
const loading = ref(false)
const showPass = ref(false)
const errorMsg = ref('')

async function handleRegister() {
  loading.value = true
  errorMsg.value = ''
  try {
    const { data } = await authApi.register(form.value)
    if (data.success) {
      toast.success('Registrasi berhasil! Silakan login.')
      router.push('/login')
    } else {
      errorMsg.value = data.message || 'Registrasi gagal'
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
  font-size: 0.85rem;
}
.login-footer a {
  text-decoration: none;
}
.login-footer a:hover {
  text-decoration: underline;
}
</style>
