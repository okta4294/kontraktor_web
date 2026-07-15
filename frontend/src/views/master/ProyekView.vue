<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Master Proyek</div>
        <div class="page-subtitle">Kelola data proyek</div>
      </div>
      <button class="btn btn-primary" @click="openModal()" id="btn-tambah-proyek">
        <Plus :size="16" /> Tambah Proyek
      </button>
    </div>

    <div class="grid-3" v-if="!loading && items.length > 0">
      <div class="project-card" v-for="item in items" :key="item.id">
        <div class="project-card-header">
          <div class="font-semibold">{{ item.nama }}</div>
          <span class="badge" :class="item.aktif ? 'badge-success' : 'badge-muted'">
            {{ item.aktif ? 'Aktif' : 'Selesai' }}
          </span>
        </div>
        <div class="project-card-body">
          <div class="flex gap-2 items-center text-sm text-muted" v-if="item.lokasi">
            <MapPin :size="14" /> {{ item.lokasi }}
          </div>
          <div class="flex gap-2 items-center text-sm text-muted" v-if="item.tanggalMulai">
            <Calendar :size="14" /> {{ item.tanggalMulai }} — {{ item.tanggalSelesai || 'Selesai' }}
          </div>
          <div class="text-sm text-muted" v-if="item.deskripsi">{{ item.deskripsi }}</div>
        </div>
        <div class="project-card-footer">
          <button class="btn btn-ghost btn-sm" @click="openModal(item)"><Pencil :size="14" /> Edit</button>
          <button class="btn btn-danger btn-sm" @click="hapus(item.id)"><Trash2 :size="14" /> Hapus</button>
        </div>
      </div>
    </div>
    <div class="card" v-else-if="loading" style="padding:2rem;text-align:center">
      <div class="loading-spinner" style="margin:auto"></div>
    </div>
    <div class="empty-state card" v-else>
      <Building2 :size="40" /> Belum ada proyek
    </div>

    <!-- Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">{{ editing ? 'Edit' : 'Tambah' }} Proyek</div>
          <button class="btn btn-ghost btn-sm" @click="showModal = false"><X :size="16" /></button>
        </div>
        <form @submit.prevent="save" class="modal-body">
          <div class="form-group">
            <label class="form-label">Nama Proyek *</label>
            <input v-model="form.nama" class="form-control" required />
          </div>
          <div class="form-group">
            <label class="form-label">Lokasi</label>
            <input v-model="form.lokasi" class="form-control" />
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Tanggal Mulai</label>
              <input v-model="form.tanggalMulai" type="date" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Tanggal Selesai</label>
              <input v-model="form.tanggalSelesai" type="date" class="form-control" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Deskripsi</label>
            <textarea v-model="form.deskripsi" class="form-control" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
              <input type="checkbox" v-model="form.aktif" />
              <span class="form-label" style="margin:0">Proyek Aktif</span>
            </label>
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
import { ref, onMounted } from 'vue'
import { projectsApi } from '@/api'
import { useProjectStore } from '@/stores/project'
import { useToast } from 'vue-toastification'
import { Plus, Pencil, Trash2, X, Building2, MapPin, Calendar } from '@lucide/vue'

const projectStore = useProjectStore()
const toast = useToast()
const items = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editing = ref<any>(null)

const defaultForm = () => ({ nama: '', lokasi: '', tanggalMulai: '', tanggalSelesai: '', deskripsi: '', aktif: true })
const form = ref(defaultForm())

async function load() {
  loading.value = true
  try { const res = await projectsApi.list(); items.value = res.data.data }
  finally { loading.value = false }
}

function openModal(item?: any) {
  editing.value = item || null
  form.value = item ? { ...item } : defaultForm()
  showModal.value = true
}

async function save() {
  saving.value = true
  try {
    if (editing.value) { await projectsApi.update(editing.value.id, form.value); toast.success('Proyek diperbarui') }
    else { await projectsApi.create(form.value); toast.success('Proyek ditambahkan') }
    showModal.value = false
    await load()
    await projectStore.fetchProjects()
  } catch { toast.error('Gagal menyimpan') } finally { saving.value = false }
}

async function hapus(id: number) {
  if (!confirm('Hapus proyek ini? Semua data terkait akan ikut terhapus!')) return
  try { await projectsApi.delete(id); toast.success('Proyek dihapus'); load() }
  catch { toast.error('Gagal menghapus') }
}

onMounted(load)
</script>

<style scoped>
.project-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all var(--transition);
}
.project-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}
.project-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
.project-card-body { display: flex; flex-direction: column; gap: 0.35rem; }
.project-card-footer { display: flex; gap: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border); }
</style>
