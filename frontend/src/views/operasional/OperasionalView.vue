<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Operasional Alat Berat</div>
        <div class="page-subtitle">Pencatatan aktivitas harian alat berat</div>
      </div>
      <button class="btn btn-primary" @click="openModal()" id="btn-tambah-operasional">
        <Plus :size="16" /> Input Operasional
      </button>
    </div>

    <div class="filters">
      <input type="date" v-model="filter.tanggalFrom" class="form-control" />
      <span style="align-self: center;">-</span>
      <input type="date" v-model="filter.tanggalTo" class="form-control" />
      <select v-model="filter.alatBeratId" class="form-control">
        <option value="">Semua Alat</option>
        <option v-for="a in alatList" :key="a.id" :value="a.id">{{ a.nama }} ({{ a.noPolisi || a.noLambung }})</option>
      </select>
    </div>

    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Alat Berat</th>
              <th>Operator</th>
              <th>Jam Kerja</th>
              <th>Jam Efektif</th>
              <th>Solar (L)</th>
              <th>Keterangan / Trouble</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="8" style="text-align:center;padding:2rem"><div class="loading-spinner" style="margin:auto"></div></td></tr>
            <tr v-else-if="filtered.length === 0"><td colspan="8"><div class="empty-state"><ClipboardList :size="40" /> Belum ada data operasional</div></td></tr>
            <tr v-for="item in filtered" :key="item.id">
              <td>{{ item.tanggal }}</td>
              <td><div class="font-medium">{{ item.alatBerat?.nama }}</div></td>
              <td>{{ item.operator }}</td>
              <td>{{ item.jamMulaiKerja.substring(0,5) }} - {{ item.jamSelesaiKerja.substring(0,5) }}</td>
              <td><span class="badge badge-success">{{ item.jamEfektif }} Jam</span></td>
              <td>{{ item.solarLiter }} L</td>
              <td class="text-sm">
                <div v-if="item.alasanTrouble" class="text-danger truncate" style="max-width:150px" :title="item.alasanTrouble">
                  Trouble: {{ item.alasanTrouble }}
                </div>
                <div v-else class="text-muted truncate" style="max-width:150px" :title="item.catatan">{{ item.catatan || '-' }}</div>
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
      <div class="modal modal-lg">
        <div class="modal-header">
          <div class="modal-title">{{ editing ? 'Edit' : 'Tambah' }} Operasional</div>
          <button class="btn btn-ghost btn-sm" @click="showModal = false"><X :size="16" /></button>
        </div>
        <form @submit.prevent="save" class="modal-body">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Tanggal *</label>
              <input type="date" v-model="form.tanggal" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Alat Berat *</label>
              <select v-model="form.alatBeratId" class="form-control" required>
                <option v-for="a in alatList" :key="a.id" :value="a.id">{{ a.nama }} ({{ a.noPolisi || a.noLambung }})</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Operator *</label>
              <input v-model="form.operator" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Pengisian Solar (Liter)</label>
              <input v-model.number="form.solarLiter" type="number" step="0.1" class="form-control" placeholder="0" />
            </div>
          </div>
          
          <h4 style="margin-top:0.5rem;margin-bottom:-0.5rem;color:var(--primary)">Jam Kerja</h4>
          <div class="grid-4">
            <div class="form-group">
              <label class="form-label">Mulai Kerja *</label>
              <input type="time" v-model="form.jamMulaiKerja" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Selesai Kerja *</label>
              <input type="time" v-model="form.jamSelesaiKerja" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Mulai Istirahat</label>
              <input type="time" v-model="form.jamIstirahatMulai" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Selesai Istirahat</label>
              <input type="time" v-model="form.jamIstirahatSelesai" class="form-control" />
            </div>
          </div>
          
          <h4 style="margin-top:0.5rem;margin-bottom:-0.5rem;color:var(--danger)">Trouble (Jika ada)</h4>
          <div class="grid-4">
            <div class="form-group">
              <label class="form-label">Mulai Trouble</label>
              <input type="time" v-model="form.jamTroubleMulai" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Selesai Trouble</label>
              <input type="time" v-model="form.jamTroubleSelesai" class="form-control" />
            </div>
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label">Alasan Trouble</label>
              <input v-model="form.alasanTrouble" class="form-control" placeholder="Jelaskan kendala..." />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Catatan Tambahan</label>
            <textarea v-model="form.catatan" class="form-control" rows="2"></textarea>
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
import { operasionalApi, alatBeratApi } from '@/api'
import { useProjectStore } from '@/stores/project'
import { useToast } from 'vue-toastification'
import { Plus, Pencil, Trash2, X, ClipboardList } from '@lucide/vue'

const projectStore = useProjectStore()
const toast = useToast()

const items = ref<any[]>([])
const alatList = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const editing = ref<any>(null)

const filter = ref({
  tanggalFrom: '',
  tanggalTo: '',
  alatBeratId: ''
})

const defaultForm = () => ({ 
  tanggal: new Date().toISOString().split('T')[0], 
  alatBeratId: '', operator: '', 
  jamMulaiKerja: '07:00', jamSelesaiKerja: '17:00', 
  jamIstirahatMulai: '12:00', jamIstirahatSelesai: '13:00', 
  jamTroubleMulai: '', jamTroubleSelesai: '', alasanTrouble: '', 
  solarLiter: null, catatan: '' 
})
const form = ref(defaultForm())

const filtered = computed(() => {
  return items.value
})

async function loadData() {
  if (!projectStore.currentProject) return
  loading.value = true
  try {
    const [opsRes, alatRes] = await Promise.all([
      operasionalApi.list({ 
        projectId: projectStore.currentProject.id,
        tanggalFrom: filter.value.tanggalFrom,
        tanggalTo: filter.value.tanggalTo,
        alatBeratId: filter.value.alatBeratId
      }),
      alatBeratApi.list({ projectId: projectStore.currentProject.id })
    ])
    items.value = opsRes.data.data
    alatList.value = alatRes.data.data
  } finally { loading.value = false }
}

function openModal(item?: any) {
  editing.value = item || null
  if (item) {
    form.value = { ...item }
    // format time string HH:MM:SS to HH:MM for input type="time"
    if(form.value.jamMulaiKerja) form.value.jamMulaiKerja = form.value.jamMulaiKerja.substring(0,5)
    if(form.value.jamSelesaiKerja) form.value.jamSelesaiKerja = form.value.jamSelesaiKerja.substring(0,5)
    if(form.value.jamIstirahatMulai) form.value.jamIstirahatMulai = form.value.jamIstirahatMulai.substring(0,5)
    if(form.value.jamIstirahatSelesai) form.value.jamIstirahatSelesai = form.value.jamIstirahatSelesai.substring(0,5)
    if(form.value.jamTroubleMulai) form.value.jamTroubleMulai = form.value.jamTroubleMulai.substring(0,5)
    if(form.value.jamTroubleSelesai) form.value.jamTroubleSelesai = form.value.jamTroubleSelesai.substring(0,5)
  } else {
    form.value = defaultForm()
  }
  showModal.value = true
}

async function save() {
  saving.value = true
  try {
    const payload: any = { ...form.value, projectId: projectStore.currentProject?.id }
    
    // Clean up empty strings for optional fields
    if (payload.alatBeratId === '') delete payload.alatBeratId;
    if (payload.jamTroubleMulai === '') delete payload.jamTroubleMulai;
    if (payload.jamTroubleSelesai === '') delete payload.jamTroubleSelesai;
    if (payload.solarLiter === null || payload.solarLiter === '') delete payload.solarLiter;

    if (editing.value) {
      await operasionalApi.update(editing.value.id, payload)
      toast.success('Data operasional diperbarui')
    } else {
      await operasionalApi.create(payload)
      toast.success('Data operasional ditambahkan')
    }
    showModal.value = false
    loadData()
  } catch { toast.error('Gagal menyimpan') } finally { saving.value = false }
}

async function hapus(id: number) {
  if (!confirm('Hapus data operasional ini?')) return
  try { await operasionalApi.delete(id); toast.success('Data dihapus'); loadData() }
  catch { toast.error('Gagal menghapus') }
}

watch(() => projectStore.currentProject, loadData)
watch(filter, loadData, { deep: true })
onMounted(loadData)
</script>
