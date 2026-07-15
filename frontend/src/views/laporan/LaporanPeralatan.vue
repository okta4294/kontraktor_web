<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Laporan Peralatan</div>
      </div>
      <button class="btn btn-success" @click="downloadExcel" :disabled="loading || items.length === 0">
        <Download :size="16" /> Export Excel
      </button>
    </div>

    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nama Peralatan</th>
              <th>Satuan</th>
              <th style="text-align:right">Total Dibeli</th>
              <th style="text-align:right">Tersedia</th>
              <th style="text-align:right">Rusak</th>
              <th style="text-align:right">Hilang</th>
              <th style="text-align:right">Dipinjam</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="7" style="text-align:center;padding:2rem"><div class="loading-spinner" style="margin:auto"></div></td></tr>
            <tr v-else-if="items.length === 0"><td colspan="7"><div class="empty-state"><Package :size="40" /> Data tidak ditemukan</div></td></tr>
            <tr v-for="(item, idx) in items" :key="idx">
              <td><div class="font-medium">{{ item.nama }}</div></td>
              <td>{{ item.satuan }}</td>
              <td style="text-align:right">{{ item.jumlah }}</td>
              <td style="text-align:right" class="font-bold text-success">{{ item.tersedia }}</td>
              <td style="text-align:right" :class="{'text-danger font-bold': item.rusak > 0}">{{ item.rusak }}</td>
              <td style="text-align:right" :class="{'text-warning font-bold': item.hilang > 0}">{{ item.hilang }}</td>
              <td style="text-align:right" :class="{'text-info font-bold': item.dipinjam > 0}">{{ item.dipinjam }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { laporanApi } from '@/api'
import { useProjectStore } from '@/stores/project'
import { useToast } from 'vue-toastification'
import { Download, Package } from '@lucide/vue'

const projectStore = useProjectStore()
const toast = useToast()

const items = ref<any[]>([])
const loading = ref(false)

async function loadData() {
  if (!projectStore.currentProject) return
  loading.value = true
  try {
    const res = await laporanApi.peralatan({ projectId: projectStore.currentProject.id })
    items.value = res.data.data
  } finally { loading.value = false }
}

async function downloadExcel() {
  try {
    const res = await laporanApi.downloadPeralatan({ projectId: projectStore.currentProject?.id })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'laporan_peralatan.xlsx')
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
