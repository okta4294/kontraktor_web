<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Laporan Solar</div>
      </div>
      <button class="btn btn-success" @click="downloadExcel" :disabled="loading || (data?.masuk?.length === 0 && data?.keluar?.length === 0)">
        <Download :size="16" /> Export Excel
      </button>
    </div>

    <div class="filters card mb-4">
      <input type="date" v-model="filter.tanggalFrom" class="form-control" />
      <span style="align-self: center;">-</span>
      <input type="date" v-model="filter.tanggalTo" class="form-control" />
      <button class="btn btn-primary" @click="loadData">Terapkan Filter</button>
    </div>

    <div class="grid-3 mb-4" v-if="data">
      <div class="card bg-success-light">
        <div class="text-muted text-sm font-semibold uppercase">Total Masuk</div>
        <div class="text-2xl font-bold mt-1 text-success">{{ data.totalMasuk }} L</div>
      </div>
      <div class="card bg-danger-light">
        <div class="text-muted text-sm font-semibold uppercase">Total Keluar</div>
        <div class="text-2xl font-bold mt-1 text-danger">{{ data.totalKeluar }} L</div>
      </div>
      <div class="card bg-primary-light">
        <div class="text-muted text-sm font-semibold uppercase">Stok Akhir Periode</div>
        <div class="text-2xl font-bold mt-1 text-primary">{{ data.stokAkhir }} L</div>
      </div>
    </div>

    <div class="grid-2">
      <!-- Tabel Masuk -->
      <div class="card" style="padding:0">
        <div class="card-title" style="padding:1rem;margin:0;border-bottom:1px solid var(--border)">Solar Masuk</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Supplier</th>
                <th style="text-align:right">Jumlah (L)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading"><td colspan="3" style="text-align:center"><div class="loading-spinner" style="margin:auto"></div></td></tr>
              <tr v-else-if="!data?.masuk?.length"><td colspan="3"><div class="text-muted text-center py-4">Tidak ada data</div></td></tr>
              <tr v-for="m in data?.masuk" :key="'m'+m.id">
                <td>{{ m.tanggal }}</td>
                <td>{{ m.supplier?.nama || '-' }}</td>
                <td style="text-align:right" class="font-bold text-success">+{{ m.jumlahLiter }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tabel Keluar -->
      <div class="card" style="padding:0">
        <div class="card-title" style="padding:1rem;margin:0;border-bottom:1px solid var(--border)">Solar Keluar</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Alat Berat</th>
                <th style="text-align:right">Jumlah (L)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading"><td colspan="3" style="text-align:center"><div class="loading-spinner" style="margin:auto"></div></td></tr>
              <tr v-else-if="!data?.keluar?.length"><td colspan="3"><div class="text-muted text-center py-4">Tidak ada data</div></td></tr>
              <tr v-for="k in data?.keluar" :key="'k'+k.id">
                <td>{{ k.tanggal }}</td>
                <td>{{ k.alatBerat?.nama || '-' }}</td>
                <td style="text-align:right" class="font-bold text-danger">-{{ k.jumlahLiter }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { laporanApi } from '@/api'
import { useProjectStore } from '@/stores/project'
import { useToast } from 'vue-toastification'
import { Download } from '@lucide/vue'

const projectStore = useProjectStore()
const toast = useToast()

const data = ref<any>(null)
const loading = ref(false)
const filter = ref({ tanggalFrom: '', tanggalTo: '' })

async function loadData() {
  if (!projectStore.currentProject) return
  loading.value = true
  try {
    const res = await laporanApi.solar({ projectId: projectStore.currentProject.id, ...filter.value })
    data.value = res.data.data
  } finally { loading.value = false }
}

async function downloadExcel() {
  try {
    const res = await laporanApi.downloadSolar({ projectId: projectStore.currentProject?.id, ...filter.value })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'laporan_solar.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch {
    toast.error('Gagal mengunduh Excel')
  }
}

watch(() => projectStore.currentProject, loadData)
onMounted(loadData)
</script>

<style scoped>
.bg-success-light { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); }
.bg-danger-light { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); }
.bg-primary-light { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.2); }
.text-2xl { font-size: 1.5rem; }
.text-center { text-align: center; }
.py-4 { padding: 1rem 0; }
</style>
