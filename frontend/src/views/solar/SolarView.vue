<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Gudang Solar</div>
        <div class="page-subtitle">Manajemen masuk dan keluar solar</div>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-warning" @click="openModal('keluar')">
          <Minus :size="16" /> Solar Keluar
        </button>
        <button class="btn btn-success" @click="openModal('masuk')">
          <Plus :size="16" /> Solar Masuk
        </button>
      </div>
    </div>

    <div class="grid-3 mb-4">
      <div class="card bg-success-light">
        <div class="text-muted text-sm font-semibold uppercase">Total Masuk</div>
        <div class="text-2xl font-bold mt-1 text-success">{{ stok.totalMasuk }} L</div>
      </div>
      <div class="card bg-danger-light">
        <div class="text-muted text-sm font-semibold uppercase">Total Keluar</div>
        <div class="text-2xl font-bold mt-1 text-danger">{{ stok.totalKeluar }} L</div>
      </div>
      <div class="card bg-primary-light">
        <div class="text-muted text-sm font-semibold uppercase">Stok Tersedia</div>
        <div class="text-2xl font-bold mt-1 text-primary">{{ stok.stokSaatIni }} L</div>
      </div>
    </div>

    <div class="card" style="padding:0">
      <div class="flex border-b">
        <button 
          class="tab-btn" :class="{ active: activeTab === 'masuk' }"
          @click="activeTab = 'masuk'"
        >Riwayat Masuk</button>
        <button 
          class="tab-btn" :class="{ active: activeTab === 'keluar' }"
          @click="activeTab = 'keluar'"
        >Riwayat Keluar</button>
      </div>

      <div class="table-wrapper" v-if="activeTab === 'masuk'">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Supplier</th>
              <th>No DO</th>
              <th>Jumlah (L)</th>
              <th>Keterangan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6" style="text-align:center;padding:2rem"><div class="loading-spinner" style="margin:auto"></div></td></tr>
            <tr v-else-if="masukList.length === 0"><td colspan="6"><div class="empty-state"><Fuel :size="40" /> Belum ada data solar masuk</div></td></tr>
            <tr v-for="item in masukList" :key="item.id">
              <td>{{ item.tanggal }} {{ item.jam?.substring(0,5) || '' }}</td>
              <td>{{ item.supplier?.nama || '-' }}</td>
              <td>{{ item.noDo || '-' }}</td>
              <td class="font-bold text-success">+{{ item.jumlahLiter }}</td>
              <td class="text-sm text-muted">{{ item.keterangan || '-' }}</td>
              <td>
                <button class="btn btn-danger btn-sm" @click="hapus('masuk', item.id)"><Trash2 :size="14" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-wrapper" v-if="activeTab === 'keluar'">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Alat Berat</th>
              <th>Operator</th>
              <th>Jumlah (L)</th>
              <th>Keterangan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6" style="text-align:center;padding:2rem"><div class="loading-spinner" style="margin:auto"></div></td></tr>
            <tr v-else-if="keluarList.length === 0"><td colspan="6"><div class="empty-state"><Fuel :size="40" /> Belum ada data solar keluar</div></td></tr>
            <tr v-for="item in keluarList" :key="item.id">
              <td>{{ item.tanggal }} {{ item.jam?.substring(0,5) || '' }}</td>
              <td>{{ item.alatBerat?.nama || '-' }}</td>
              <td>{{ item.operator || '-' }}</td>
              <td class="font-bold text-danger">-{{ item.jumlahLiter }}</td>
              <td class="text-sm text-muted">{{ item.keterangan || '-' }}</td>
              <td>
                <button class="btn btn-danger btn-sm" @click="hapus('keluar', item.id)"><Trash2 :size="14" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Masuk/Keluar -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">Catat Solar {{ modalType === 'masuk' ? 'Masuk' : 'Keluar' }}</div>
          <button class="btn btn-ghost btn-sm" @click="showModal = false"><X :size="16" /></button>
        </div>
        <form @submit.prevent="save" class="modal-body">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Tanggal *</label>
              <input type="date" v-model="form.tanggal" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Jam</label>
              <input type="time" v-model="form.jam" class="form-control" />
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Jumlah (Liter) *</label>
            <input type="number" step="0.1" v-model.number="form.jumlahLiter" class="form-control" required />
          </div>

          <!-- Fields for Masuk -->
          <template v-if="modalType === 'masuk'">
            <div class="form-group">
              <label class="form-label">Supplier</label>
              <select v-model="form.supplierId" class="form-control">
                <option value="">Pilih Supplier...</option>
                <option v-for="s in supplierList" :key="s.id" :value="s.id">{{ s.nama }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">No DO</label>
              <input v-model="form.noDo" class="form-control" />
            </div>
          </template>

          <!-- Fields for Keluar -->
          <template v-if="modalType === 'keluar'">
            <div class="form-group">
              <label class="form-label">Alat Berat</label>
              <select v-model="form.alatBeratId" class="form-control">
                <option value="">Pilih Alat Berat...</option>
                <option v-for="a in alatList" :key="a.id" :value="a.id">{{ a.nama }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Operator</label>
              <input v-model="form.operator" class="form-control" />
            </div>
          </template>

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
import { ref, onMounted, watch } from 'vue'
import { solarApi, supplierApi, alatBeratApi } from '@/api'
import { useProjectStore } from '@/stores/project'
import { useToast } from 'vue-toastification'
import { Plus, Minus, Trash2, X, Fuel } from '@lucide/vue'

const projectStore = useProjectStore()
const toast = useToast()

const activeTab = ref('masuk')
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const modalType = ref<'masuk' | 'keluar'>('masuk')

const masukList = ref<any[]>([])
const keluarList = ref<any[]>([])
const supplierList = ref<any[]>([])
const alatList = ref<any[]>([])
const stok = ref({ totalMasuk: 0, totalKeluar: 0, stokSaatIni: 0 })

const defaultForm = () => ({
  tanggal: new Date().toISOString().split('T')[0],
  jam: new Date().toTimeString().substring(0,5),
  jumlahLiter: null as number | null,
  supplierId: '', noDo: '',
  alatBeratId: '', operator: '',
  keterangan: ''
})
const form = ref(defaultForm())

async function loadData() {
  if (!projectStore.currentProject) return
  loading.value = true
  try {
    const pid = projectStore.currentProject.id
    const [masukRes, keluarRes, stokRes, supRes, alatRes] = await Promise.all([
      solarApi.getMasuk({ projectId: pid }),
      solarApi.getKeluar({ projectId: pid }),
      solarApi.getStok(pid),
      supplierApi.list(),
      alatBeratApi.list({ projectId: pid })
    ])
    masukList.value = masukRes.data.data
    keluarList.value = keluarRes.data.data
    stok.value = stokRes.data.data
    supplierList.value = supRes.data.data
    alatList.value = alatRes.data.data
  } finally { loading.value = false }
}

function openModal(type: 'masuk' | 'keluar') {
  modalType.value = type
  form.value = defaultForm()
  showModal.value = true
}

async function save() {
  saving.value = true
  try {
    const payload = { ...form.value, projectId: projectStore.currentProject?.id }
    if (modalType.value === 'masuk') {
      await solarApi.createMasuk(payload)
    } else {
      await solarApi.createKeluar(payload)
    }
    toast.success('Data solar tersimpan')
    showModal.value = false
    loadData()
  } catch { toast.error('Gagal menyimpan') } finally { saving.value = false }
}

async function hapus(type: 'masuk'|'keluar', id: number) {
  if (!confirm('Hapus riwayat solar ini?')) return
  try {
    if(type === 'masuk') await solarApi.deleteMasuk(id)
    else await solarApi.deleteKeluar(id)
    toast.success('Data dihapus')
    loadData()
  } catch { toast.error('Gagal menghapus') }
}

watch(() => projectStore.currentProject, loadData)
onMounted(loadData)
</script>

<style scoped>
.bg-success-light { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); }
.bg-danger-light { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); }
.bg-primary-light { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.2); }

.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  padding: 1rem;
  font-weight: 600;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  transition: all var(--transition);
}
.tab-btn:hover { color: var(--text); background: var(--bg-card-hover); }
.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}
.text-2xl { font-size: 1.5rem; }
</style>
