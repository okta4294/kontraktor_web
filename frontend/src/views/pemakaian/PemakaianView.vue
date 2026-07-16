<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Pemakaian Barang</div>
        <div class="page-subtitle">Pencatatan pemakaian material & peralatan di lapangan</div>
      </div>
      <button class="btn btn-primary" @click="openModal()" id="btn-tambah-pemakaian">
        <Plus :size="16" /> Catat Pemakaian
      </button>
    </div>

    <div class="filters">
      <input type="date" v-model="filter.tanggalFrom" class="form-control" />
      <span style="align-self: center;">-</span>
      <input type="date" v-model="filter.tanggalTo" class="form-control" />
      <select v-model="filter.barangId" class="form-control">
        <option value="">Semua Barang</option>
        <option v-for="b in barangList" :key="b.id" :value="b.id">{{ b.nama }}</option>
      </select>
    </div>

    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Barang</th>
              <th>Kategori</th>
              <th>Jumlah Dipakai</th>
              <th>Lokasi Penggunaan</th>
              <th>Keterangan / Kondisi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="7" style="text-align:center;padding:2rem"><div class="loading-spinner" style="margin:auto"></div></td></tr>
            <tr v-else-if="filtered.length === 0"><td colspan="7"><div class="empty-state"><Wrench :size="40" /> Belum ada data pemakaian</div></td></tr>
            <tr v-for="item in filtered" :key="item.id">
              <td>{{ item.tanggal }}</td>
              <td><div class="font-medium">{{ item.barang?.nama }}</div></td>
              <td><span class="badge badge-muted">{{ item.barang?.kategori }}</span></td>
              <td class="font-bold text-danger">-{{ item.jumlah }} {{ item.barang?.satuan }}</td>
              <td>{{ item.lokasi || '-' }}</td>
              <td class="text-sm">
                <span v-if="item.kondisi" class="badge badge-warning" style="margin-right: 0.5rem">{{ item.kondisi }}</span>
                <span class="text-muted">{{ item.keterangan || '-' }}</span>
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
          <div class="modal-title">{{ editing ? 'Edit' : 'Catat' }} Pemakaian</div>
          <button class="btn btn-ghost btn-sm" @click="showModal = false"><X :size="16" /></button>
        </div>
        <form @submit.prevent="save" class="modal-body">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Tanggal *</label>
              <input type="date" v-model="form.tanggal" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Barang *</label>
              <select v-model="form.barangId" class="form-control" required @change="onBarangChange">
                <option value="">Pilih Barang...</option>
                <option v-for="b in barangList" :key="b.id" :value="b.id">{{ b.nama }} (Stok sisa dihitung otomatis)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Jumlah *</label>
              <input type="number" step="0.1" v-model.number="form.jumlah" class="form-control" required min="0.1" />
            </div>
            <div class="form-group" v-if="selectedBarang?.kategori === 'peralatan'">
              <label class="form-label">Kondisi Peralatan</label>
              <select v-model="form.kondisi" class="form-control">
                <option value="">Dipakai (Normal)</option>
                <option value="rusak">Rusak</option>
                <option value="hilang">Hilang</option>
                <option value="dipinjam">Dipinjam</option>
              </select>
            </div>
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label">Lokasi Penggunaan</label>
              <input v-model="form.lokasi" class="form-control" placeholder="Contoh: STA 1+200, Pos Security" />
            </div>
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label">Keterangan</label>
              <textarea v-model="form.keterangan" class="form-control" rows="2"></textarea>
            </div>
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
import { pemakaianApi, barangApi } from '@/api'
import { useProjectStore } from '@/stores/project'
import { useToast } from 'vue-toastification'
import { Plus, Pencil, Trash2, X, Wrench } from '@lucide/vue'

const projectStore = useProjectStore()
const toast = useToast()

const items = ref<any[]>([])
const barangList = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editing = ref<any>(null)

const filter = ref({ tanggalFrom: '', tanggalTo: '', barangId: '' })

const defaultForm = () => ({
  tanggal: new Date().toISOString().split('T')[0],
  barangId: '', jumlah: null as number | null,
  kondisi: '', lokasi: '', keterangan: ''
})
const form = ref(defaultForm())

const selectedBarang = computed(() => barangList.value.find(b => b.id === form.value.barangId))
const filtered = computed(() => items.value)

async function loadData() {
  if (!projectStore.currentProject) return
  loading.value = true
  try {
    const pid = projectStore.currentProject.id
    const [pemRes, brgRes] = await Promise.all([
      pemakaianApi.list({ 
        projectId: pid,
        tanggalFrom: filter.value.tanggalFrom,
        tanggalTo: filter.value.tanggalTo,
        barangId: filter.value.barangId
      }),
      barangApi.list({ projectId: pid })
    ])
    items.value = pemRes.data.data
    // Filter bahan bakar as it has separate Solar view
    barangList.value = brgRes.data.data.filter((b: any) => b.kategori !== 'bahan_bakar')
  } finally { loading.value = false }
}

function openModal(item?: any) {
  editing.value = item || null
  form.value = item ? { ...item } : defaultForm()
  showModal.value = true
}

function onBarangChange() {
  if(selectedBarang.value?.kategori !== 'peralatan') {
    form.value.kondisi = ''
  }
}

async function save() {
  saving.value = true
  try {
    const payload: any = { ...form.value, projectId: projectStore.currentProject?.id }
    
    // Clean up empty strings for optional fields
    if (payload.barangId === '') delete payload.barangId;
    if (payload.kondisi === '') delete payload.kondisi;
    if (payload.lokasi === '') delete payload.lokasi;
    if (payload.keterangan === '') delete payload.keterangan;

    if (editing.value) {
      await pemakaianApi.update(editing.value.id, payload)
      toast.success('Data diperbarui')
    } else {
      await pemakaianApi.create(payload)
      toast.success('Pemakaian dicatat')
    }
    showModal.value = false
    loadData()
  } catch { toast.error('Gagal menyimpan') } finally { saving.value = false }
}

async function hapus(id: number) {
  if (!confirm('Hapus pencatatan ini? Stok barang akan dikembalikan.')) return
  try { await pemakaianApi.delete(id); toast.success('Data dihapus'); loadData() }
  catch { toast.error('Gagal menghapus') }
}

watch(() => projectStore.currentProject, loadData)
watch(filter, loadData, { deep: true })
onMounted(loadData)
</script>
