<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Master Supplier</div>
        <div class="page-subtitle">Kelola data supplier</div>
      </div>
      <button class="btn btn-primary" @click="openModal()" id="btn-tambah-supplier">
        <Plus :size="16" /> Tambah Supplier
      </button>
    </div>

    <div class="filters">
      <input v-model="search" class="form-control" placeholder="Cari supplier..." />
    </div>

    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nama Supplier</th>
              <th>PIC</th>
              <th>No HP</th>
              <th>Jenis Barang</th>
              <th>Alamat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6" style="text-align:center;padding:2rem"><div class="loading-spinner" style="margin:auto"></div></td></tr>
            <tr v-else-if="filtered.length === 0"><td colspan="6"><div class="empty-state"><Building :size="40" /> Belum ada supplier</div></td></tr>
            <tr v-for="item in filtered" :key="item.id">
              <td><div class="font-medium">{{ item.nama }}</div></td>
              <td>{{ item.pic || '-' }}</td>
              <td>{{ item.noHp || '-' }}</td>
              <td class="text-sm text-muted">{{ item.jenisBarang || '-' }}</td>
              <td class="text-sm text-muted truncate" style="max-width:180px">{{ item.alamat || '-' }}</td>
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
          <div class="modal-title">{{ editing ? 'Edit' : 'Tambah' }} Supplier</div>
          <button class="btn btn-ghost btn-sm" @click="showModal = false"><X :size="16" /></button>
        </div>
        <form @submit.prevent="save" class="modal-body">
          <div class="grid-2">
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label">Nama Supplier *</label>
              <input v-model="form.nama" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">PIC</label>
              <input v-model="form.pic" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">No HP</label>
              <input v-model="form.noHp" class="form-control" />
            </div>
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label">Jenis Barang</label>
              <input v-model="form.jenisBarang" class="form-control" placeholder="Solar, Material, dll" />
            </div>
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label">Alamat</label>
              <textarea v-model="form.alamat" class="form-control" rows="2"></textarea>
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
import { ref, computed, onMounted } from 'vue'
import { supplierApi } from '@/api'
import { useToast } from 'vue-toastification'
import { Plus, Pencil, Trash2, X, Building } from '@lucide/vue'

const toast = useToast()
const items = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editing = ref<any>(null)
const search = ref('')

const defaultForm = () => ({ nama: '', pic: '', noHp: '', jenisBarang: '', alamat: '' })
const form = ref(defaultForm())

const filtered = computed(() =>
  items.value.filter((i) => !search.value || i.nama?.toLowerCase().includes(search.value.toLowerCase()))
)

async function load() {
  loading.value = true
  try { const res = await supplierApi.list(); items.value = res.data.data }
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
    if (editing.value) { await supplierApi.update(editing.value.id, form.value); toast.success('Supplier diperbarui') }
    else { await supplierApi.create(form.value); toast.success('Supplier ditambahkan') }
    showModal.value = false; load()
  } catch { toast.error('Gagal menyimpan') } finally { saving.value = false }
}

async function hapus(id: number) {
  if (!confirm('Hapus supplier ini?')) return
  try { await supplierApi.delete(id); toast.success('Supplier dihapus'); load() }
  catch { toast.error('Gagal menghapus') }
}

onMounted(load)
</script>
