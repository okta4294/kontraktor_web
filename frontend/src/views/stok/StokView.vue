<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Stok Barang</div>
        <div class="page-subtitle">Pantau ketersediaan barang secara real-time</div>
      </div>
    </div>

    <div class="filters">
      <input v-model="search" class="form-control" placeholder="Cari barang..." />
      <select v-model="filterKategori" class="form-control">
        <option value="">Semua Kategori</option>
        <option value="material">Material</option>
        <option value="peralatan">Peralatan</option>
        <option value="atk">ATK</option>
        <option value="sparepart">Sparepart</option>
      </select>
    </div>

    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nama Barang</th>
              <th>Kategori</th>
              <th style="text-align:right">Total Dibeli</th>
              <th style="text-align:right">Total Dipakai</th>
              <th style="text-align:right">Sisa Stok</th>
              <th>Satuan</th>
              <th>Status</th>
              <th>Lokasi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="8" style="text-align:center;padding:2rem"><div class="loading-spinner" style="margin:auto"></div></td></tr>
            <tr v-else-if="filtered.length === 0"><td colspan="8"><div class="empty-state"><Warehouse :size="40" /> Belum ada data stok</div></td></tr>
            <tr v-for="item in filtered" :key="item.id">
              <td><div class="font-medium">{{ item.nama }}</div></td>
              <td><span class="badge badge-muted">{{ item.kategori }}</span></td>
              <td style="text-align:right">{{ item.totalDibeli }}</td>
              <td style="text-align:right">
                <span v-if="item.kategori === 'peralatan'" class="text-xs text-muted" title="Dipakai normal">
                  ({{ item.totalDipakai }})
                </span>
                <span v-else>{{ item.totalDipakai }}</span>
              </td>
              <td style="text-align:right">
                <div v-if="item.kategori === 'peralatan'" class="flex flex-col items-end gap-1">
                  <span class="font-bold text-primary">{{ item.tersedia }}</span>
                  <div class="text-xs text-muted flex gap-2">
                    <span v-if="item.rusak" class="text-danger" title="Rusak"><Wrench :size="10"/> {{ item.rusak }}</span>
                    <span v-if="item.hilang" class="text-warning" title="Hilang"><AlertCircle :size="10"/> {{ item.hilang }}</span>
                    <span v-if="item.dipinjam" class="text-info" title="Dipinjam"><Send :size="10"/> {{ item.dipinjam }}</span>
                  </div>
                </div>
                <div v-else class="font-bold" :class="item.isBelowMin ? 'text-danger' : 'text-success'">
                  {{ item.sisa }}
                </div>
              </td>
              <td>{{ item.satuan }}</td>
              <td>
                <span v-if="item.kategori !== 'peralatan' && item.isBelowMin" class="badge badge-danger">Stok Menipis</span>
                <span v-else class="badge badge-success">Aman</span>
              </td>
              <td class="text-sm text-muted">{{ item.lokasiGudang || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { stokApi } from '@/api'
import { useProjectStore } from '@/stores/project'
import { Warehouse, Wrench, AlertCircle, Send } from '@lucide/vue'

const projectStore = useProjectStore()
const items = ref<any[]>([])
const loading = ref(true)
const search = ref('')
const filterKategori = ref('')

const filtered = computed(() => {
  return items.value.filter(i => {
    const matchSearch = !search.value || i.nama?.toLowerCase().includes(search.value.toLowerCase())
    return matchSearch && i.kategori !== 'bahan_bakar' // exclude solar from here
  })
})

async function loadData() {
  if (!projectStore.currentProject) return
  loading.value = true
  try {
    const res = await stokApi.list({ 
      projectId: projectStore.currentProject.id,
      kategori: filterKategori.value || undefined
    })
    items.value = res.data.data
  } finally { loading.value = false }
}

watch(() => projectStore.currentProject, loadData)
watch(filterKategori, loadData)
onMounted(loadData)
</script>
