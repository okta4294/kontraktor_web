<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Manajemen User</div>
        <div class="page-subtitle">Kelola hak akses pengguna sistem (Khusus Administrator)</div>
      </div>
      <button class="btn btn-primary" @click="openModal()">
        <Plus :size="16" /> Tambah User
      </button>
    </div>

    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="5" style="text-align:center;padding:2rem"><div class="loading-spinner" style="margin:auto"></div></td></tr>
            <tr v-else-if="items.length === 0"><td colspan="5"><div class="empty-state"><Users :size="40" /> Belum ada data</div></td></tr>
            <tr v-for="item in items" :key="item.id">
              <td><div class="font-medium">{{ item.nama }}</div></td>
              <td>{{ item.email }}</td>
              <td><span class="badge" :class="roleBadge(item.role)">{{ formatRole(item.role) }}</span></td>
              <td>
                <span class="badge" :class="item.aktif ? 'badge-success' : 'badge-danger'">
                  {{ item.aktif ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-sm" @click="openModal(item)"><Pencil :size="14" /></button>
                  <button class="btn btn-danger btn-sm" @click="hapus(item.id)" :disabled="item.email === 'admin@kontraktor.com'"><Trash2 :size="14" /></button>
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
          <div class="modal-title">{{ editing ? 'Edit' : 'Tambah' }} User</div>
          <button class="btn btn-ghost btn-sm" @click="showModal = false"><X :size="16" /></button>
        </div>
        <form @submit.prevent="save" class="modal-body">
          <div class="grid-2">
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label">Nama *</label>
              <input v-model="form.nama" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input type="email" v-model="form.email" class="form-control" required :disabled="editing && editing.email === 'admin@kontraktor.com'" />
            </div>
            <div class="form-group">
              <label class="form-label">Password <span v-if="editing" class="text-xs text-muted">(kosongkan jika tidak diubah)</span> *</label>
              <input type="password" v-model="form.password" class="form-control" :required="!editing" minlength="6" />
            </div>
            <div class="form-group">
              <label class="form-label">Role *</label>
              <select v-model="form.role" class="form-control" required :disabled="editing && editing.email === 'admin@kontraktor.com'">
                <option value="administrator">Administrator</option>
                <option value="project_manager">Project Manager</option>
                <option value="admin">Admin</option>
                <option value="logistik">Logistik</option>
                <option value="operator">Operator</option>
              </select>
            </div>
            <div class="form-group" v-if="editing">
              <label class="form-label">Status</label>
              <div style="padding-top: 0.5rem">
                <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
                  <input type="checkbox" v-model="form.aktif" :disabled="editing.email === 'admin@kontraktor.com'" />
                  <span style="font-size:0.875rem">Akun Aktif</span>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer" style="padding:0;border:none;margin-top:1rem">
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
import { usersApi } from '@/api'
import { useToast } from 'vue-toastification'
import { Plus, Pencil, Trash2, X, Users } from '@lucide/vue'

const toast = useToast()
const items = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editing = ref<any>(null)

const defaultForm = () => ({ nama: '', email: '', password: '', role: 'operator', aktif: true })
const form = ref(defaultForm())

const roleBadge = (r: string) => ({
  administrator: 'badge-primary', project_manager: 'badge-info', 
  admin: 'badge-success', logistik: 'badge-warning', operator: 'badge-muted'
}[r] || 'badge-muted')

const formatRole = (r: string) => {
  return r.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

async function loadData() {
  loading.value = true
  try {
    const res = await usersApi.list()
    items.value = res.data.data
  } finally { loading.value = false }
}

function openModal(item?: any) {
  editing.value = item || null
  form.value = item ? { ...item, password: '' } : defaultForm()
  showModal.value = true
}

async function save() {
  saving.value = true
  try {
    if (editing.value) {
      const payload: any = { ...form.value }
      if (!payload.password) delete payload.password
      await usersApi.update(editing.value.id, payload)
      toast.success('User diperbarui')
    } else {
      await usersApi.create(form.value)
      toast.success('User ditambahkan')
    }
    showModal.value = false
    loadData()
  } catch (err: any) { 
    toast.error(err.response?.data?.message || 'Gagal menyimpan') 
  } finally { saving.value = false }
}

async function hapus(id: number) {
  if (!confirm('Hapus user ini?')) return
  try { await usersApi.delete(id); toast.success('User dihapus'); loadData() }
  catch { toast.error('Gagal menghapus') }
}

onMounted(loadData)
</script>
