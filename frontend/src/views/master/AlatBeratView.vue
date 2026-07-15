<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Master Alat Berat</div>
        <div class="page-subtitle">Kelola data alat berat proyek</div>
      </div>
      <button class="btn btn-primary" @click="openModal()" id="btn-tambah-alat">
        <Plus :size="16" /> Tambah Alat
      </button>
    </div>

    <div class="filters">
      <input v-model="search" class="form-control" placeholder="Cari alat berat..." />
      <select v-model="filterStatus" class="form-control">
        <option value="">Semua Status</option>
        <option value="aktif">Aktif</option>
        <option value="rusak">Rusak</option>
        <option value="maintenance">Maintenance</option>
      </select>
    </div>

    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nama Alat</th>
              <th>Merk / Tipe</th>
              <th>No Polisi</th>
              <th>No Lambung</th>
              <th>Tahun</th>
              <th>Kapasitas</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" style="text-align:center;padding:2rem">
                <div class="loading-spinner" style="margin:auto"></div>
              </td>
            </tr>
            <tr v-else-if="filtered.length === 0">
              <td colspan="8">
                <div class="empty-state"><Truck :size="40" /> Belum ada data alat berat</div>
              </td>
            </tr>
            <tr v-for="item in filtered" :key="item.id">
              <td><div class="font-medium">{{ item.nama }}</div></td>
              <td>{{ item.merk }} {{ item.tipe }}</td>
              <td>{{ item.noPolisi || '-' }}</td>
              <td>{{ item.noLambung || '-' }}</td>
              <td>{{ item.tahun || '-' }}</td>
              <td>{{ item.kapasitas || '-' }}</td>
              <td>
                <span class="badge" :class="statusBadge(item.status)">{{ item.status }}</span>
              </td>
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
          <div class="modal-title">{{ editing ? 'Edit' : 'Tambah' }} Alat Berat</div>
          <button class="btn btn-ghost btn-sm" @click="showModal = false"><X :size="16" /></button>
        </div>
        <form @submit.prevent="save" class="modal-body">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Nama Alat *</label>
              <input v-model="form.nama" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Merk</label>
              <input v-model="form.merk" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Tipe</label>
              <input v-model="form.tipe" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">No Polisi</label>
              <input v-model="form.noPolisi" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">No Lambung</label>
              <input v-model="form.noLambung" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Tahun</label>
              <input v-model.number="form.tahun" type="number" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Kapasitas</label>
              <input v-model="form.kapasitas" class="form-control" placeholder="e.g. 20 ton" />
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select v-model="form.status" class="form-control">
                <option value="aktif">Aktif</option>
                <option value="rusak">Rusak</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Keterangan</label>
            <textarea v-model="form.keterangan" class="form-control" rows="2"></textarea>
          </div>
          <div class="modal-footer" style="padding:0;border:none">
            <button type="button" class="btn btn-ghost" @click="showModal = false">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <div class="loading-spinner" v-if="saving" style="width:14px;height:14px;border-width:2px"></div>
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { alatBeratApi } from '@/api'
import { useProjectStore } from '@/stores/project'
import { useToast } from 'vue-toastification'
import { Plus, Pencil, Trash2, X, Truck } from '@lucide/vue'

const projectStore = useProjectStore()
const toast = useToast()

const items = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editing = ref<any>(null)
const search = ref('')
const filterStatus = ref('')

const defaultForm = () => ({
  nama: '', merk: '', tipe: '', noPolisi: '', noLambung: '',
  tahun: null as number | null, kapasitas: '', status: 'aktif', keterangan: '',
})
const form = ref(defaultForm())

const filtered = computed(() =>
  items.value.filter((i) => {
    const matchSearch = !search.value ||
      i.nama?.toLowerCase().includes(search.value.toLowerCase()) ||
      i.merk?.toLowerCase().includes(search.value.toLowerCase())
    const matchStatus = !filterStatus.value || i.status === filterStatus.value
    return matchSearch && matchStatus
  })
)

const statusBadge = (s: string) => ({
  aktif: 'badge-success', rusak: 'badge-danger', maintenance: 'badge-warning',
}[s] || 'badge-muted')

async function load() {
  if (!projectStore.currentProject) return
  loading.value = true
  try {
    const res = await alatBeratApi.list({ projectId: projectStore.currentProject.id })
    items.value = res.data.data
  } finally {
    loading.value = false
  }
}

function openModal(item?: any) {
  editing.value = item || null
  form.value = item ? { ...item } : defaultForm()
  ;(form.value as any).projectId = projectStore.currentProject?.id
  showModal.value = true
}

async function save() {
  saving.value = true
  try {
    const payload = { ...form.value, projectId: projectStore.currentProject?.id }
    if (editing.value) {
      await alatBeratApi.update(editing.value.id, payload)
      toast.success('Alat berat berhasil diperbarui')
    } else {
      await alatBeratApi.create(payload)
      toast.success('Alat berat berhasil ditambahkan')
    }
    showModal.value = false
    load()
  } catch {
    toast.error('Gagal menyimpan data')
  } finally {
    saving.value = false
  }
}

async function hapus(id: number) {
  if (!confirm('Hapus alat berat ini?')) return
  try {
    await alatBeratApi.delete(id)
    toast.success('Alat berat berhasil dihapus')
    load()
  } catch {
    toast.error('Gagal menghapus data')
  }
}

watch(() => projectStore.currentProject, load)
onMounted(load)
</script>
