<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Pembelian Barang</div>
        <div class="page-subtitle">Catat semua pembelian material, peralatan, dll</div>
      </div>
      <button class="btn btn-primary" @click="openModal()" id="btn-tambah-pembelian">
        <Plus :size="16" /> Tambah Pembelian
      </button>
    </div>

    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>No PO</th>
              <th>Supplier</th>
              <th>Total Item</th>
              <th>Total Harga</th>
              <th>Keterangan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="7" style="text-align:center;padding:2rem"><div class="loading-spinner" style="margin:auto"></div></td></tr>
            <tr v-else-if="items.length === 0"><td colspan="7"><div class="empty-state"><ShoppingCart :size="40" /> Belum ada data pembelian</div></td></tr>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.tanggal }}</td>
              <td>{{ item.noPo || '-' }}</td>
              <td>{{ item.supplier?.nama || '-' }}</td>
              <td>{{ item.items?.length || 0 }} item</td>
              <td class="font-bold">{{ formatRupiah(item.totalHarga) }}</td>
              <td class="text-sm text-muted truncate" style="max-width:150px">{{ item.keterangan || '-' }}</td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-sm" @click="viewDetail(item)"><Eye :size="14" /></button>
                  <button class="btn btn-danger btn-sm" @click="hapus(item.id)"><Trash2 :size="14" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <div class="modal-title">Catat Pembelian Baru</div>
          <button class="btn btn-ghost btn-sm" @click="showModal = false"><X :size="16" /></button>
        </div>
        <form @submit.prevent="save" class="modal-body">
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Tanggal *</label>
              <input type="date" v-model="form.tanggal" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Supplier *</label>
              <select v-model="form.supplierId" class="form-control" required>
                <option value="">Pilih Supplier...</option>
                <option v-for="s in supplierList" :key="s.id" :value="s.id">{{ s.nama }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">No PO</label>
              <input v-model="form.noPo" class="form-control" placeholder="Opsional" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Keterangan</label>
            <input v-model="form.keterangan" class="form-control" />
          </div>

          <!-- Items list -->
          <div class="mt-4">
            <div class="flex justify-between items-center mb-2">
              <h4 style="margin:0;color:var(--primary)">Daftar Barang</h4>
              <button type="button" class="btn btn-ghost btn-sm" @click="addItem">
                <Plus :size="14"/> Tambah Item
              </button>
            </div>
            
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Barang *</th>
                    <th width="100">Jumlah *</th>
                    <th width="150">Harga Satuan *</th>
                    <th width="80">PPN (%)</th>
                    <th width="150">Total</th>
                    <th width="50"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in form.items" :key="idx">
                    <td>
                      <select v-model="item.barangId" class="form-control" required>
                        <option value="">Pilih...</option>
                        <option v-for="b in barangList" :key="b.id" :value="b.id">{{ b.nama }}</option>
                      </select>
                    </td>
                    <td><input type="number" step="any" v-model.number="item.jumlah" class="form-control" required min="0.1"/></td>
                    <td><input type="number" step="any" v-model.number="item.hargaSatuan" class="form-control" required min="0"/></td>
                    <td><input type="number" step="any" v-model.number="item.ppn" class="form-control" min="0"/></td>
                    <td class="font-bold">{{ formatRupiah(calcTotal(item)) }}</td>
                    <td>
                      <button type="button" class="btn btn-danger btn-sm" @click="removeItem(idx)" :disabled="form.items.length === 1">
                        <X :size="14" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="flex justify-between items-center mt-4">
              <div class="text-sm text-muted">* Stok akan otomatis bertambah setelah disimpan.</div>
              <div class="text-lg font-bold">Grand Total: <span class="text-primary">{{ formatRupiah(grandTotal) }}</span></div>
            </div>
          </div>

          <div class="modal-footer" style="padding:0;border:none;margin-top:1rem">
            <button type="button" class="btn btn-ghost" @click="showModal = false">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving || form.items.length === 0">
              Simpan Pembelian
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal-overlay" v-if="showDetailModal" @click.self="showDetailModal = false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <div class="modal-title">Detail Pembelian</div>
          <button class="btn btn-ghost btn-sm" @click="showDetailModal = false"><X :size="16" /></button>
        </div>
        <div class="modal-body" v-if="detailItem">
          <div class="grid-3 mb-4">
            <div><div class="text-muted text-sm">Tanggal</div><div class="font-medium">{{ detailItem.tanggal }}</div></div>
            <div><div class="text-muted text-sm">Supplier</div><div class="font-medium">{{ detailItem.supplier?.nama || '-' }}</div></div>
            <div><div class="text-muted text-sm">No PO</div><div class="font-medium">{{ detailItem.noPo || '-' }}</div></div>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Barang</th>
                  <th>Kategori</th>
                  <th>Jumlah</th>
                  <th>Harga Satuan</th>
                  <th>PPN</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="i in detailItem.items" :key="i.id">
                  <td>{{ i.barang?.nama }}</td>
                  <td><span class="badge badge-muted">{{ i.barang?.kategori }}</span></td>
                  <td>{{ i.jumlah }} {{ i.barang?.satuan }}</td>
                  <td>{{ formatRupiah(i.hargaSatuan) }}</td>
                  <td>{{ i.ppn }}%</td>
                  <td class="font-bold">{{ formatRupiah(i.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex justify-end mt-4">
            <div class="text-lg font-bold">Grand Total: <span class="text-primary">{{ formatRupiah(detailItem.totalHarga) }}</span></div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { pembelianApi, supplierApi, barangApi } from '@/api'
import { useProjectStore } from '@/stores/project'
import { useToast } from 'vue-toastification'
import { Plus, Eye, Trash2, X, ShoppingCart } from '@lucide/vue'

const projectStore = useProjectStore()
const toast = useToast()

const items = ref<any[]>([])
const supplierList = ref<any[]>([])
const barangList = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const showDetailModal = ref(false)
const detailItem = ref<any>(null)

const defaultItem = () => ({ barangId: '', jumlah: null, hargaSatuan: null, ppn: 0 })
const form = ref({
  tanggal: new Date().toISOString().split('T')[0],
  supplierId: '', noPo: '', keterangan: '',
  items: [defaultItem()]
})

const formatRupiah = (val: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val) || 0)

const calcTotal = (item: any) => {
  const sub = Number(item.jumlah || 0) * Number(item.hargaSatuan || 0)
  const tax = sub * (Number(item.ppn || 0) / 100)
  return sub + tax
}

const grandTotal = computed(() => form.value.items.reduce((sum, item) => sum + calcTotal(item), 0))

async function loadData() {
  if (!projectStore.currentProject) return
  loading.value = true
  try {
    const pid = projectStore.currentProject.id
    const [beliRes, supRes, brgRes] = await Promise.all([
      pembelianApi.list({ projectId: pid }),
      supplierApi.list(),
      barangApi.list({ projectId: pid })
    ])
    items.value = beliRes.data.data
    supplierList.value = supRes.data.data
    barangList.value = brgRes.data.data
  } finally { loading.value = false }
}

function openModal() {
  form.value = {
    tanggal: new Date().toISOString().split('T')[0],
    supplierId: '', noPo: '', keterangan: '',
    items: [defaultItem()]
  }
  showModal.value = true
}

function addItem() { form.value.items.push(defaultItem()) }
function removeItem(idx: number) { form.value.items.splice(idx, 1) }

function viewDetail(item: any) {
  detailItem.value = item
  showDetailModal.value = true
}

async function save() {
  saving.value = true
  try {
    const payload: any = { ...form.value, projectId: projectStore.currentProject?.id }
    
    // Clean up empty strings for optional fields
    if (payload.supplierId === '') delete payload.supplierId;
    if (payload.noPo === '') delete payload.noPo;
    if (payload.keterangan === '') delete payload.keterangan;

    await pembelianApi.create(payload)
    toast.success('Pembelian berhasil disimpan')
    showModal.value = false
    loadData()
  } catch { toast.error('Gagal menyimpan') } finally { saving.value = false }
}

async function hapus(id: number) {
  if (!confirm('Hapus pembelian ini? Stok barang akan ikut berkurang.')) return
  try { await pembelianApi.delete(id); toast.success('Data dihapus'); loadData() }
  catch { toast.error('Gagal menghapus') }
}

watch(() => projectStore.currentProject, loadData)
onMounted(loadData)
</script>
