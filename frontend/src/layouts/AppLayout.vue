<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="brand" v-if="!sidebarCollapsed">
          <div class="brand-icon">
            <HardHat :size="20" />
          </div>
          <div>
            <div class="brand-name">KontraktorApp</div>
            <div class="brand-sub">Sistem Informasi</div>
          </div>
        </div>
        <div class="brand-icon-only" v-else><HardHat :size="20" /></div>
        <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <ChevronLeft :size="16" v-if="!sidebarCollapsed" />
          <ChevronRight :size="16" v-else />
        </button>
      </div>

      <!-- Project Selector -->
      <div class="project-select" v-if="!sidebarCollapsed && projectStore.projects.length">
        <label class="form-label">Proyek Aktif</label>
        <select class="form-control" @change="onProjectChange" :value="projectStore.currentProject?.id">
          <option v-for="p in projectStore.projects" :key="p.id" :value="p.id">
            {{ p.nama }}
          </option>
        </select>
      </div>

      <nav class="sidebar-nav">
        <div v-for="group in navGroups" :key="group.label" class="nav-group">
          <div class="nav-group-label" v-if="!sidebarCollapsed">{{ group.label }}</div>
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :class="{ active: isActive(item.to) }"
            :title="sidebarCollapsed ? item.label : ''"
          >
            <component :is="item.icon" :size="18" />
            <span v-if="!sidebarCollapsed">{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>

      <div class="sidebar-footer" v-if="!sidebarCollapsed">
        <div class="user-info">
          <div class="user-avatar">{{ auth.user?.nama?.charAt(0) }}</div>
          <div>
            <div class="font-medium truncate" style="max-width:120px">{{ auth.user?.nama }}</div>
            <div class="text-xs text-muted">{{ roleLabel }}</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" @click="handleLogout">
          <LogOut :size="16" />
        </button>
      </div>
    </aside>

    <div class="mobile-overlay" v-if="!sidebarCollapsed" @click="sidebarCollapsed = true"></div>

    <!-- Main Content -->
    <div class="main-area" :class="{ 'mobile-push': !sidebarCollapsed }">
      <header class="topbar">
        <div class="topbar-left flex items-center gap-3">
          <button class="btn btn-ghost btn-sm mobile-only" @click="sidebarCollapsed = !sidebarCollapsed">
            <Menu :size="20" />
          </button>
          <h1 class="page-heading">{{ currentPageTitle }}</h1>
        </div>
        <div class="topbar-right flex items-center gap-2">
          <button class="btn btn-ghost btn-sm" @click="toggleTheme" title="Toggle Theme">
            <Sun :size="18" v-if="theme === 'dark'" />
            <Moon :size="18" v-else />
          </button>
          <span class="badge badge-primary" v-if="projectStore.currentProject">
            {{ projectStore.currentProject.nama }}
          </span>
        </div>
      </header>
      <main class="content">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/project'
import { useTheme } from '@/composables/useTheme'
import {
  LayoutDashboard, Truck, Package, ShoppingCart, Fuel,
  BarChart3, ClipboardList, Settings, Users, LogOut,
  HardHat, ChevronLeft, ChevronRight, Building2, Warehouse,
  FileText, Wrench, BoxesIcon, Sun, Moon, Menu
} from '@lucide/vue'

const auth = useAuthStore()
const projectStore = useProjectStore()
const route = useRoute()
const router = useRouter()
const { theme, toggleTheme } = useTheme()
const sidebarCollapsed = ref(window.innerWidth <= 768) // Default collapsed on mobile

// Handle window resize
onMounted(() => {
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
      sidebarCollapsed.value = true
    } else {
      sidebarCollapsed.value = false
    }
  })
})

const navGroups = computed(() => {
  const groups = [
    {
      label: 'Utama',
      items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      label: 'Master Data',
      items: [
        { to: '/proyek', label: 'Proyek', icon: Building2 },
        { to: '/alat-berat', label: 'Alat Berat', icon: Truck },
        { to: '/barang', label: 'Barang', icon: Package },
        { to: '/supplier', label: 'Supplier', icon: ShoppingCart },
      ],
    },
    {
      label: 'Operasional',
      items: [
        { to: '/operasional', label: 'Operasional Alat', icon: ClipboardList },
        { to: '/solar', label: 'Gudang Solar', icon: Fuel },
        { to: '/pembelian', label: 'Pembelian', icon: ShoppingCart },
        { to: '/pemakaian', label: 'Pemakaian Barang', icon: Wrench },
        { to: '/stok', label: 'Stok Barang', icon: Warehouse },
      ],
    },
    {
      label: 'Laporan',
      items: [
        { to: '/laporan/operasional', label: 'Lap. Operasional', icon: BarChart3 },
        { to: '/laporan/solar', label: 'Lap. Solar', icon: Fuel },
        { to: '/laporan/pembelian', label: 'Lap. Pembelian', icon: FileText },
        { to: '/laporan/material', label: 'Lap. Material', icon: BoxesIcon },
        { to: '/laporan/peralatan', label: 'Lap. Peralatan', icon: Package },
      ],
    },
  ]
  if (auth.isAdmin) {
    groups.push({
      label: 'Pengaturan',
      items: [{ to: '/users', label: 'Manajemen User', icon: Users }],
    })
  }
  return groups
})

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const currentPageTitle = computed(() => {
  const map: Record<string, string> = {
    '/': 'Dashboard',
    '/proyek': 'Master Proyek',
    '/alat-berat': 'Master Alat Berat',
    '/barang': 'Master Barang',
    '/supplier': 'Master Supplier',
    '/operasional': 'Operasional Alat Berat',
    '/solar': 'Gudang Solar',
    '/pembelian': 'Pembelian Barang',
    '/pemakaian': 'Pemakaian Barang',
    '/stok': 'Stok Barang',
    '/laporan/operasional': 'Laporan Operasional',
    '/laporan/solar': 'Laporan Solar',
    '/laporan/pembelian': 'Laporan Pembelian',
    '/laporan/material': 'Laporan Material',
    '/laporan/peralatan': 'Laporan Peralatan',
    '/users': 'Manajemen User',
  }
  return map[route.path] || 'KontraktorApp'
})

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    administrator: 'Administrator',
    project_manager: 'Project Manager',
    admin: 'Admin',
    logistik: 'Logistik',
    operator: 'Operator',
  }
  return map[auth.user?.role || ''] || ''
})

function onProjectChange(e: Event) {
  const id = Number((e.target as HTMLSelectElement).value)
  const project = projectStore.projects.find((p) => p.id === id)
  if (project) projectStore.setCurrentProject(project)
}

async function handleLogout() {
  auth.logout()
  router.push('/login')
}

onMounted(async () => {
  await projectStore.fetchProjects()
})
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 100;
  transition: width var(--transition);
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border);
  min-height: var(--header-height);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-icon {
  width: 32px;
  height: 32px;
  background: var(--primary);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-on-primary);
  flex-shrink: 0;
}

.brand-icon-only {
  width: 32px;
  height: 32px;
  background: var(--primary);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-on-primary);
  margin: 0 auto;
}

.brand-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
}

.brand-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.collapse-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  padding: 0.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.collapse-btn:hover { color: var(--text); border-color: var(--primary); }

.project-select {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.nav-group {
  margin-bottom: 0.5rem;
}

.nav-group-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
  padding: 0.5rem 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.875rem;
  transition: all var(--transition);
  text-decoration: none;
  margin-bottom: 2px;
}

.nav-item:hover {
  background: var(--bg-card-hover);
  color: var(--text);
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.15);
  color: var(--primary);
}

.sidebar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--text-on-primary);
  flex-shrink: 0;
}

/* Main area */
.main-area {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left var(--transition);
}

.sidebar.collapsed ~ .main-area {
  margin-left: 64px;
}

.topbar {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  position: sticky;
  top: 0;
  z-index: 50;
}

.page-heading {
  font-size: 1.1rem;
  font-weight: 600;
}

.content {
  flex: 1;
  padding: 1.5rem;
}
.mobile-overlay {
  display: none;
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 1000;
    transform: translateX(0);
  }
  
  .sidebar.collapsed {
    transform: translateX(-100%);
    width: var(--sidebar-width); /* keep width full when animating out */
  }

  .main-area {
    margin-left: 0;
  }
  
  .mobile-only {
    display: inline-flex;
  }
  
  .topbar {
    padding: 0 1rem;
  }

  /* Add overlay when sidebar is open on mobile */
  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
  }
  
  .sidebar.collapsed + .mobile-overlay {
    display: none;
  }
}
</style>
