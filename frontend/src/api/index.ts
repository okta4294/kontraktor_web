import api from './client'

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => 
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

export const projectsApi = {
  list: () => api.get('/projects'),
  get: (id: number) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: number, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
}

export const alatBeratApi = {
  list: (params?: any) => api.get('/alat-berat', { params }),
  get: (id: number) => api.get(`/alat-berat/${id}`),
  create: (data: any) => api.post('/alat-berat', data),
  update: (id: number, data: any) => api.put(`/alat-berat/${id}`, data),
  delete: (id: number) => api.delete(`/alat-berat/${id}`),
}

export const barangApi = {
  list: (params?: any) => api.get('/barang', { params }),
  get: (id: number) => api.get(`/barang/${id}`),
  create: (data: any) => api.post('/barang', data),
  update: (id: number, data: any) => api.put(`/barang/${id}`, data),
  delete: (id: number) => api.delete(`/barang/${id}`),
}

export const supplierApi = {
  list: () => api.get('/supplier'),
  get: (id: number) => api.get(`/supplier/${id}`),
  create: (data: any) => api.post('/supplier', data),
  update: (id: number, data: any) => api.put(`/supplier/${id}`, data),
  delete: (id: number) => api.delete(`/supplier/${id}`),
}

export const operasionalApi = {
  list: (params?: any) => api.get('/operasional', { params }),
  get: (id: number) => api.get(`/operasional/${id}`),
  create: (data: any) => api.post('/operasional', data),
  update: (id: number, data: any) => api.put(`/operasional/${id}`, data),
  delete: (id: number) => api.delete(`/operasional/${id}`),
}

export const solarApi = {
  getMasuk: (params?: any) => api.get('/solar/masuk', { params }),
  createMasuk: (data: any) => api.post('/solar/masuk', data),
  updateMasuk: (id: number, data: any) => api.put(`/solar/masuk/${id}`, data),
  deleteMasuk: (id: number) => api.delete(`/solar/masuk/${id}`),
  getKeluar: (params?: any) => api.get('/solar/keluar', { params }),
  createKeluar: (data: any) => api.post('/solar/keluar', data),
  deleteKeluar: (id: number) => api.delete(`/solar/keluar/${id}`),
  getStok: (projectId: number) => api.get('/solar/stok', { params: { projectId } }),
}

export const pembelianApi = {
  list: (params?: any) => api.get('/pembelian', { params }),
  get: (id: number) => api.get(`/pembelian/${id}`),
  create: (data: any) => api.post('/pembelian', data),
  delete: (id: number) => api.delete(`/pembelian/${id}`),
}

export const pemakaianApi = {
  list: (params?: any) => api.get('/pemakaian', { params }),
  create: (data: any) => api.post('/pemakaian', data),
  update: (id: number, data: any) => api.put(`/pemakaian/${id}`, data),
  delete: (id: number) => api.delete(`/pemakaian/${id}`),
}

export const stokApi = {
  list: (params?: any) => api.get('/stok', { params }),
}

export const dashboardApi = {
  get: (projectId: number) => api.get('/dashboard', { params: { projectId } }),
}

export const laporanApi = {
  operasional: (params?: any) => api.get('/laporan/operasional', { params }),
  solar: (params?: any) => api.get('/laporan/solar', { params }),
  pembelian: (params?: any) => api.get('/laporan/pembelian', { params }),
  material: (params?: any) => api.get('/laporan/material', { params }),
  peralatan: (params?: any) => api.get('/laporan/peralatan', { params }),
  // Excel exports
  downloadOperasional: (params?: any) =>
    api.get('/laporan/operasional', { params: { ...params, format: 'excel' }, responseType: 'blob' }),
  downloadSolar: (params?: any) =>
    api.get('/laporan/solar', { params: { ...params, format: 'excel' }, responseType: 'blob' }),
  downloadPembelian: (params?: any) =>
    api.get('/laporan/pembelian', { params: { ...params, format: 'excel' }, responseType: 'blob' }),
  downloadMaterial: (params?: any) =>
    api.get('/laporan/material', { params: { ...params, format: 'excel' }, responseType: 'blob' }),
  downloadPeralatan: (params?: any) =>
    api.get('/laporan/peralatan', { params: { ...params, format: 'excel' }, responseType: 'blob' }),
}

export const usersApi = {
  list: () => api.get('/users'),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
}
