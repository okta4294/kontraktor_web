<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Laporan Material</div>
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
              <th>Nama Material</th>
              <th>Satuan</th>
              <th style="text-align:right">Total Dibeli</th>
              <th style="text-align:right">Total Dipakai</th>
              <th style="text-align:right">Sisa Stok</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="5" style="text-align:center;padding:2rem"><div class="loading-spinner" style="margin:auto"></div></td></tr>
            <tr v-else-if="items.length === 0"><td colspan="5"><div class="empty-state"><BoxesIcon :size="40" /> Data tidak ditemukan</div></td></tr>
            <tr v-for="(item, idx) in items" :key="idx">
              <td><div class="font-medium">{{ item.nama }}</div></td>
              <td>{{ item.satuan }}</td>
              <td style="text-align:right">{{ item.totalDibeli }}</td>
              <td style="text-align:right">{{ item.totalDipakai }}</td>
              <td style="text-align:right" class="font-bold text-primary">{{ item.sisa }}</td>
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
import { Download, BoxesIcon } from '@lucide/vue'

const projectStore = useProjectStore()
const toast = useToast()

const items = ref<any[]>([])
const loading = ref(false)

async function loadData() {
  if (!projectStore.currentProject) return
  loading.value = true
  try {
    const res = await laporanApi.material({ projectId: projectStore.currentProject.id })
    items.value = res.data.data
  } finally { loading.value = false }
}

async function downloadExcel() {
  try {
    const res = await laporanApi.downloadMaterial({ projectId: projectStore.currentProject?.id })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'laporan_material.xlsx')
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
