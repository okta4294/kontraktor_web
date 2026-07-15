<template>
  <div>
    <!-- Widgets -->
    <div class="grid-4 mb-4" v-if="data">
      <div class="stat-card" v-for="w in widgets" :key="w.label">
        <div class="stat-icon" :style="{ background: w.color }">
          <component :is="w.icon" :size="20" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ w.value }}</div>
          <div class="stat-label">{{ w.label }}</div>
        </div>
      </div>
    </div>

    <!-- Skeleton loading -->
    <div class="grid-4 mb-4" v-else-if="loading">
      <div class="stat-card skeleton" v-for="i in 8" :key="i"></div>
    </div>

    <!-- Charts -->
    <div class="grid-3" v-if="data">
      <div class="card">
        <div class="card-title">Pembelian Bulanan</div>
        <Bar :data="pembelianChartData" :options="barOptions" />
      </div>
      <div class="card">
        <div class="card-title">Penggunaan Solar (30 hari)</div>
        <Line :data="solarChartData" :options="lineOptions" />
      </div>
      <div class="card">
        <div class="card-title">Jam Efektif Alat (7 hari)</div>
        <Bar :data="jamKerjaChartData" :options="barOptions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { dashboardApi } from '@/api'
import { useProjectStore } from '@/stores/project'
import { Truck, Fuel, ShoppingCart, Package, Wrench, Gauge, TrendingDown, TrendingUp } from '@lucide/vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

const projectStore = useProjectStore()
const data = ref<any>(null)
const loading = ref(true)

async function loadDashboard() {
  if (!projectStore.currentProject) return
  loading.value = true
  try {
    const res = await dashboardApi.get(projectStore.currentProject.id)
    if (res.data.success) data.value = res.data.data
  } finally {
    loading.value = false
  }
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const widgets = computed(() => {
  if (!data.value) return []
  const w = data.value.widgets
  return [
    { label: 'Total Alat Berat', value: w.totalAlatBerat, icon: Truck, color: 'rgba(59,130,246,0.2)' },
    { label: 'Alat Bekerja Hari Ini', value: w.alatBekerjaHariIni, icon: Gauge, color: 'rgba(16,185,129,0.2)' },
    { label: 'Stok Solar (L)', value: Number(w.stokSolar).toFixed(0) + ' L', icon: Fuel, color: 'rgba(245,158,11,0.2)' },
    { label: 'Solar Masuk Hari Ini', value: Number(w.solarMasukHariIni).toFixed(0) + ' L', icon: TrendingUp, color: 'rgba(6,182,212,0.2)' },
    { label: 'Solar Keluar Hari Ini', value: Number(w.solarKeluarHariIni).toFixed(0) + ' L', icon: TrendingDown, color: 'rgba(239,68,68,0.2)' },
    { label: 'Pembelian Bulan Ini', value: formatRupiah(w.totalPembelianBulanIni), icon: ShoppingCart, color: 'rgba(99,102,241,0.2)' },
    { label: 'Total Material', value: w.totalMaterial + ' item', icon: Package, color: 'rgba(16,185,129,0.2)' },
    { label: 'Total Peralatan', value: w.totalPeralatan + ' item', icon: Wrench, color: 'rgba(245,158,11,0.2)' },
  ]
})

const chartDefaults = { responsive: true, maintainAspectRatio: true }
const barOptions = {
  ...chartDefaults,
  plugins: { legend: { display: false }, tooltip: { mode: 'index' as const } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
  },
}
const lineOptions = { ...barOptions }

const pembelianChartData = computed(() => {
  const d = data.value?.grafik?.pembelianBulanan || []
  return {
    labels: d.map((i: any) => i.bulan),
    datasets: [{
      label: 'Pembelian',
      data: d.map((i: any) => Number(i.total)),
      backgroundColor: 'rgba(59,130,246,0.5)',
      borderRadius: 4,
    }],
  }
})

const solarChartData = computed(() => {
  const d = data.value?.grafik?.penggunaanSolar || []
  return {
    labels: d.map((i: any) => i.tanggal),
    datasets: [{
      label: 'Solar (L)',
      data: d.map((i: any) => Number(i.total)),
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245,158,11,0.1)',
      fill: true,
      tension: 0.4,
    }],
  }
})

const jamKerjaChartData = computed(() => {
  const d = data.value?.grafik?.jamKerjaAlatBerat || []
  return {
    labels: d.map((i: any) => i.tanggal),
    datasets: [{
      label: 'Jam Efektif',
      data: d.map((i: any) => Number(i.totalJamEfektif)),
      backgroundColor: 'rgba(16,185,129,0.5)',
      borderRadius: 4,
    }],
  }
})

watch(() => projectStore.currentProject, loadDashboard)
onMounted(loadDashboard)
</script>

<style scoped>
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all var(--transition);
}

.stat-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.skeleton {
  min-height: 90px;
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-hover) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
