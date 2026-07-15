import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
        },
        // Master Data
        {
          path: 'proyek',
          name: 'proyek',
          component: () => import('@/views/master/ProyekView.vue'),
        },
        {
          path: 'alat-berat',
          name: 'alat-berat',
          component: () => import('@/views/master/AlatBeratView.vue'),
        },
        {
          path: 'barang',
          name: 'barang',
          component: () => import('@/views/master/BarangView.vue'),
        },
        {
          path: 'supplier',
          name: 'supplier',
          component: () => import('@/views/master/SupplierView.vue'),
        },
        // Operasional
        {
          path: 'operasional',
          name: 'operasional',
          component: () => import('@/views/operasional/OperasionalView.vue'),
        },
        // Gudang Solar
        {
          path: 'solar',
          name: 'solar',
          component: () => import('@/views/solar/SolarView.vue'),
        },
        // Pembelian
        {
          path: 'pembelian',
          name: 'pembelian',
          component: () => import('@/views/pembelian/PembelianView.vue'),
        },
        // Pemakaian
        {
          path: 'pemakaian',
          name: 'pemakaian',
          component: () => import('@/views/pemakaian/PemakaianView.vue'),
        },
        // Stok
        {
          path: 'stok',
          name: 'stok',
          component: () => import('@/views/stok/StokView.vue'),
        },
        // Laporan
        {
          path: 'laporan/operasional',
          name: 'laporan-operasional',
          component: () => import('@/views/laporan/LaporanOperasional.vue'),
        },
        {
          path: 'laporan/solar',
          name: 'laporan-solar',
          component: () => import('@/views/laporan/LaporanSolar.vue'),
        },
        {
          path: 'laporan/pembelian',
          name: 'laporan-pembelian',
          component: () => import('@/views/laporan/LaporanPembelian.vue'),
        },
        {
          path: 'laporan/material',
          name: 'laporan-material',
          component: () => import('@/views/laporan/LaporanMaterial.vue'),
        },
        {
          path: 'laporan/peralatan',
          name: 'laporan-peralatan',
          component: () => import('@/views/laporan/LaporanPeralatan.vue'),
        },
        // Users
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/users/UsersView.vue'),
          meta: { roles: ['administrator'] },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth) {
    if (!auth.token) {
      return next('/login')
    }
    if (!auth.user) {
      await auth.fetchMe()
      if (!auth.user) return next('/login')
    }
    if (to.meta.roles && !auth.canAccess(to.meta.roles as string[])) {
      return next('/')
    }
  }

  if (to.meta.guest && auth.token) {
    return next('/')
  }

  next()
})

export default router
