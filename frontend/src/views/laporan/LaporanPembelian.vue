<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Laporan Pembelian</div>
      </div>
      <button class="btn btn-success" @click="downloadExcel" :disabled="loading || items.length === 0">
        <Download :size="16" /> Export Excel
      </button>
    </div>

    <div class="filters card mb-4">
      <input type="date" v-model="filter.tanggalFrom" class="form-control" />
      <span style="align-self: center;">-</span>
      <input type="date" v-model="filter.tanggalTo" class="form-control" />
      <button class="btn btn-primary" @click="loadData">Terapkan Filter</button>
    </div>

    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Supplier</th>
              <th>No PO</th>
              <th>Total Item</th>
              <th style="text-align:right">Grand Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="5" style="text-align:center;padding:2rem"><div class="loading-spinner" style="margin:auto"></div></td></tr>
            <tr v-else-if="items.length === 0"><td colspan="5"><div class="empty-state"><FileText :size="40" /> Data tidak ditemukan</div></td></tr>
            <template v-for="item in items" :key="item.id">
              <tr style="background:var(--bg)">
                <td class="font-bold">{{ item.tanggal }}</td>
                <td class="font-bold">{{ item.supplier?.nama || '-' }}</td>
                <td class="font-bold">{{ item.noPo || '-' }}</td>
                <td class="font-bold">{{ item.items?.length || 0 }} item</td>
                <td class="font-bold text-primary" style="text-align:right">{{ formatRupiah(item.totalHarga) }}</td>
              </tr>
              <!-- Item Details -->
              <tr v-for="detail in item.items" :key="'det'+detail.id" class="text-sm">
                <td></td>
                <td colspan="2">
                  <div class="flex items-center gap-2">
                    <div style="width:4px;height:4px;border-radius:50%;background:var(--text-muted)"></div>
                    {{ detail.barang?.nama }}
                    <span class="badge badge-muted" style="font-size:0.65rem">{{ detail.barang?.kategori }}</span>
                  </div>
                </td>
                <td>{{ detail.jumlah }} {{ detail.barang?.satuan }} x {{ formatRupiah(detail.hargaSatuan) }} <span v-if="detail.ppn>0">(+ PPN {{detail.ppn}}%)</span></td>
                <td style="text-align:right">{{ formatRupiah(detail.total) }}</td>
              </tr>
            </template>
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
import { Download, FileText } from '@lucide/vue'

const projectStore = useProjectStore()
const toast = useToast()

const items = ref<any[]>([])
const loading = ref(false)
const filter = ref({ tanggalFrom: '', tanggalTo: '' })

const formatRupiah = (val: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val) || 0)

async function loadData() {
  if (!projectStore.currentProject) return
  loading.value = true
  try {
    const res = await laporanApi.pembelian({ projectId: projectStore.currentProject.id, ...filter.value })
    items.value = res.data.data
  } finally { loading.value = false }
}

async function downloadExcel() {
  try {
    const res = await laporanApi.downloadPembelian({ projectId: projectStore.currentProject?.id, ...filter.value })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'laporan_pembelian.xlsx')
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
