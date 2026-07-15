import { ref, watch, onMounted } from 'vue'

export function useTheme() {
  const theme = ref<'light' | 'dark'>('light')

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  onMounted(() => {
    const saved = localStorage.getItem('app-theme')
    if (saved === 'light' || saved === 'dark') {
      theme.value = saved
    } else {
      // Default to device preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        theme.value = 'dark'
      } else {
        theme.value = 'light'
      }
    }
    
    // Apply theme on mount
    document.documentElement.setAttribute('data-theme', theme.value)
  })

  // Watch for changes and apply to DOM and localStorage
  watch(theme, (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('app-theme', newTheme)
  })

  return {
    theme,
    toggleTheme
  }
}
