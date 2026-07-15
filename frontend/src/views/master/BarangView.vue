<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Master Barang</div>
        <div class="page-subtitle">Kelola data barang &amp; inventaris</div>
      </div>
      <button class="btn btn-primary" @click="openModal()" id="btn-tambah-barang">
        <Plus :size="16" /> Tambah Barang
      </button>
    </div>

    <div class="filters">
      <input v-model="search" class="form-control" placeholder="Cari barang..." />
      <select v-model="filterKategori" class="form-control">
        <option value="">Semua Kategori</option>
        <option v-for="k in kategoriOptions" :key="k.value" :value="k.value">{{ k.label }}</option>
      </select>
    </div>

    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nama Barang</th>
              <th>Kategori</th>
              <th>Satuan</th>
              <th>Min Stok</th>
              <th>Lokasi Gudang</th>
              <th>Keterangan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="7" style="text-align:center;padding:2rem"><div class="loading-spinner" style="margin:auto"></div></td></tr>
            <tr v-else-if="filtered.length === 0"><td colspan="7"><div class="empty-state"><Package :size="40" /> Belum ada data barang</div></td></tr>
            <tr v-for="item in filtered" :key="item.id">
              <td><div class="font-medium">{{ item.nama }}</div></td>
              <td><span class="badge" :class="kategoriBadge(item.kategori)">{{ item.kategori }}</span></td>
              <td>{{ item.satuan }}</td>
              <td>{{ item.minStok }}</td>
              <td>{{ item.lokasiGudang || '-' }}</td>
              <td class="text-muted text-sm truncate" style="max-width:150px">{{ item.keterangan || '-' }}</td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-sm" @click="openModal(item)"><Pencil :size="14" /></button>
                  <button class="btn btn-danger btn-sm" @click="hapus(item.id)"><Trash2 :size="14" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">{{ editing ? 'Edit' : 'Tambah' }} Barang</div>
          <button class="btn btn-ghost btn-sm" @click="showModal = false"><X :size="16" /></button>
        </div>
        <form @submit.prevent="save" class="modal-body">
          <div class="grid-2">
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label">Nama Barang *</label>
              <input v-model="form.nama" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Kategori *</label>
              <select v-model="form.kategori" class="form-control" required>
                <option v-for="k in kategoriOptions" :key="k.value" :value="k.value">{{ k.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Satuan *</label>
              <input v-model="form.satuan" class="form-control" placeholder="Sak, Pcs, Liter..." required />
            </div>
            <div class="form-group">
              <label class="form-label">Minimum Stok</label>
              <input v-model="form.minStok" type="number" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Lokasi Gudang</label>
              <input v-model="form.lokasiGudang" class="form-control" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Keterangan</label>
            <textarea v-model="form.keterangan" class="form-control" rows="2"></textarea>
          </div>
          <div class="modal-footer" style="padding:0;border:none">
            <button type="button" class="btn btn-ghost" @click="showModal = false">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { barangApi } from '@/api'
import { useProjectStore } from '@/stores/project'
import { useToast } from 'vue-toastification'
import { Plus, Pencil, Trash2, X, Package } from '@lucide/vue'

const projectStore = useProjectStore()
const toast = useToast()
const items = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editing = ref<any>(null)
const search = ref('')
const filterKategori = ref('')

const kategoriOptions = [
  { value: 'material', label: 'Material' },
  { value: 'peralatan', label: 'Peralatan' },
  { value: 'atk', label: 'ATK' },
  { value: 'sparepart', label: 'Sparepart' },
  { value: 'bahan_bakar', label: 'Bahan Bakar' },
]

const kategoriBadge = (k: string) => ({
  material: 'badge-info', peralatan: 'badge-success', atk: 'badge-muted',
  sparepart: 'badge-warning', bahan_bakar: 'badge-danger',
}[k] || 'badge-muted')

const defaultForm = () => ({ nama: '', kategori: 'material', satuan: '', minStok: '0', lokasiGudang: '', keterangan: '' })
const form = ref(defaultForm())

const filtered = computed(() =>
  items.value.filter((i) => {
    const matchSearch = !search.value || i.nama?.toLowerCase().includes(search.value.toLowerCase())
    const matchKat = !filterKategori.value || i.kategori === filterKategori.value
    return matchSearch && matchKat
  })
)

async function load() {
  if (!projectStore.currentProject) return
  loading.value = true
  try {
    const res = await barangApi.list({ projectId: projectStore.currentProject.id })
    items.value = res.data.data
  } finally { loading.value = false }
}

function openModal(item?: any) {
  editing.value = item || null
  form.value = item ? { ...item } : defaultForm()
  showModal.value = true
}

async function save() {
  saving.value = true
  try {
    const payload = { ...form.value, projectId: projectStore.currentProject?.id }
    if (editing.value) {
      await barangApi.update(editing.value.id, payload)
      toast.success('Barang berhasil diperbarui')
    } else {
      await barangApi.create(payload)
      toast.success('Barang berhasil ditambahkan')
    }
    showModal.value = false
    load()
  } catch { toast.error('Gagal menyimpan data') } finally { saving.value = false }
}

async function hapus(id: number) {
  if (!confirm('Hapus barang ini?')) return
  try { await barangApi.delete(id); toast.success('Barang dihapus'); load() }
  catch { toast.error('Gagal menghapus') }
}

watch(() => projectStore.currentProject, load)
onMounted(load)
</script>
