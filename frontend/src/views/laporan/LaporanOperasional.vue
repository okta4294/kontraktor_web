<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Laporan Operasional Alat Berat</div>
      </div>
      <button class="btn btn-success" @click="downloadExcel" :disabled="loading || items.length === 0">
        <Download :size="16" /> Export Excel
      </button>
    </div>

    <div class="filters card mb-4">
      <input type="date" v-model="filter.tanggalFrom" class="form-control" />
      <span style="align-self: center;">-</span>
      <input type="date" v-model="filter.tanggalTo" class="form-control" />
      <select v-model="filter.alatBeratId" class="form-control">
        <option value="">Semua Alat</option>
        <option v-for="a in alatList" :key="a.id" :value="a.id">{{ a.nama }}</option>
      </select>
      <input v-model="filter.operator" class="form-control" placeholder="Nama Operator..." />
      <button class="btn btn-primary" @click="loadData">Terapkan Filter</button>
    </div>

    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Alat Berat</th>
              <th>Operator</th>
              <th>Jam Kerja</th>
              <th>Jam Trouble</th>
              <th>Jam Efektif</th>
              <th>Solar (L)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="7" style="text-align:center;padding:2rem"><div class="loading-spinner" style="margin:auto"></div></td></tr>
            <tr v-else-if="items.length === 0"><td colspan="7"><div class="empty-state"><BarChart3 :size="40" /> Data tidak ditemukan</div></td></tr>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.tanggal }}</td>
              <td><div class="font-medium">{{ item.alatBerat?.nama }}</div></td>
              <td>{{ item.operator }}</td>
              <td>{{ item.durasiKerja }}</td>
              <td class="text-danger">{{ item.durasiTrouble }}</td>
              <td class="font-bold text-success">{{ item.jamEfektif }}</td>
              <td>{{ item.solarLiter }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { laporanApi, alatBeratApi } from '@/api'
import { useProjectStore } from '@/stores/project'
import { useToast } from 'vue-toastification'
import { Download, BarChart3 } from '@lucide/vue'

const projectStore = useProjectStore()
const toast = useToast()

const items = ref<any[]>([])
const alatList = ref<any[]>([])
const loading = ref(false)

const filter = ref({ tanggalFrom: '', tanggalTo: '', alatBeratId: '', operator: '' })

async function loadData() {
  if (!projectStore.currentProject) return
  loading.value = true
  try {
    const [opsRes, alatRes] = await Promise.all([
      laporanApi.operasional({ projectId: projectStore.currentProject.id, ...filter.value }),
      alatBeratApi.list({ projectId: projectStore.currentProject.id })
    ])
    items.value = opsRes.data.data
    alatList.value = alatRes.data.data
  } finally { loading.value = false }
}

async function downloadExcel() {
  try {
    const res = await laporanApi.downloadOperasional({ projectId: projectStore.currentProject?.id, ...filter.value })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'laporan_operasional.xlsx')
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
