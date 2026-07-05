<template>
  <div class="audit-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div>
          <h1 class="page-title">Audit Log</h1>
          <p class="page-subtitle">Riwayat seluruh aktivitas pengadaan barang secara terstruktur</p>
        </div>
      </div>
      <div class="header-stats">
        <div class="stat-pill">
          <span class="stat-dot"></span>
          <span>{{ store.pagination?.total ?? 0 }} total entri</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-card">
      <div class="filter-grid">
        <div class="filter-group">
          <label class="filter-label">Modul</label>
          <select v-model="filters.module" class="filter-select" @change="applyFilters">
            <option value="">Semua Modul</option>
            <option value="vessel_request">Vessel Request</option>
            <option value="moc">MOC (Perbandingan Vendor)</option>
            <option value="purchase_order">Purchase Order</option>
            <option value="good_receipt">Berita Acara Penerimaan</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Aksi</label>
          <select v-model="filters.action" class="filter-select" @change="applyFilters">
            <option value="">Semua Aksi</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="REVIEW">REVIEW</option>
            <option value="SAW_SCORE">SAW_SCORE</option>
            <option value="SAW_WEIGHT_REQUEST">SAW_WEIGHT_REQUEST</option>
            <option value="SAW_WEIGHT_REVIEW">SAW_WEIGHT_REVIEW</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Dari Tanggal</label>
          <input type="date" v-model="filters.from" class="filter-input" @change="applyFilters" />
        </div>

        <div class="filter-group">
          <label class="filter-label">Sampai Tanggal</label>
          <input type="date" v-model="filters.to" class="filter-input" @change="applyFilters" />
        </div>

        <div class="filter-actions">
          <button class="btn-reset" @click="resetFilters">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-card">
      <!-- Loading -->
      <div v-if="store.loading" class="state-loading">
        <div class="spinner"></div>
        <span>Memuat data audit log…</span>
      </div>

      <!-- Empty -->
      <div v-else-if="store.logs.length === 0" class="state-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p>Tidak ada data audit log ditemukan</p>
      </div>

      <!-- Data Table -->
      <template v-else>
        <div class="table-wrapper">
          <table class="audit-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Pelaku</th>
                <th>Modul</th>
                <th>Aksi</th>
                <th>Kode Entitas</th>
                <th>Deskripsi</th>
                <th>IP Address</th>
                <th class="col-action">Detail</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="log in store.logs"
                :key="log.id"
                class="table-row"
                @click="openDetail(log)"
              >
                <td class="col-time">
                  <span class="time-date">{{ formatDate(log.createdAt) }}</span>
                  <span class="time-hour">{{ formatTime(log.createdAt) }}</span>
                </td>
                <td class="col-user">
                  <div class="user-cell">
                    <div class="user-avatar" :style="{ background: avatarColor(log.user?.fullName) }">
                      {{ initials(log.user?.fullName) }}
                    </div>
                    <div>
                      <div class="user-name">{{ log.user?.fullName ?? '-' }}</div>
                      <div class="user-role">{{ log.user?.type ?? '' }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge-module" :class="moduleClass(log.module)">
                    {{ moduleLabel(log.module) }}
                  </span>
                </td>
                <td>
                  <span class="badge-action" :class="actionClass(log.action)">
                    {{ log.action }}
                  </span>
                </td>
                <td class="col-code">
                  <code class="entity-code">{{ log.entityCode ?? `#${log.entityId}` }}</code>
                </td>
                <td class="col-desc">{{ truncate(log.description, 80) }}</td>
                <td class="col-ip">{{ log.ipAddress ?? '-' }}</td>
                <td class="col-action">
                  <button class="btn-detail" @click.stop="openDetail(log)" title="Lihat detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="store.pagination && store.pagination.totalPages > 1">
          <button
            class="page-btn"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <path d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span class="page-info">Halaman {{ currentPage }} dari {{ store.pagination.totalPages }}</span>
          <button
            class="page-btn"
            :disabled="currentPage >= store.pagination.totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <path d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </template>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="detailLog" class="modal-overlay" @click.self="closeDetail">
          <div class="modal-box">
            <div class="modal-header">
              <div class="modal-title-group">
                <span class="badge-action" :class="actionClass(detailLog.action)">{{ detailLog.action }}</span>
                <h2 class="modal-title">{{ detailLog.entityCode ?? `Entitas #${detailLog.entityId}` }}</h2>
              </div>
              <button class="modal-close" @click="closeDetail">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <!-- Meta Info -->
              <div class="meta-grid">
                <div class="meta-item">
                  <span class="meta-label">Waktu</span>
                  <span class="meta-value">{{ formatDate(detailLog.createdAt) }} {{ formatTime(detailLog.createdAt) }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Pelaku</span>
                  <span class="meta-value">{{ detailLog.user?.fullName ?? '-' }} ({{ detailLog.user?.type }})</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Modul</span>
                  <span class="badge-module" :class="moduleClass(detailLog.module)">{{ moduleLabel(detailLog.module) }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">IP Address</span>
                  <span class="meta-value mono">{{ detailLog.ipAddress ?? '-' }}</span>
                </div>
              </div>

              <div class="desc-block">
                <span class="meta-label">Deskripsi</span>
                <p class="desc-text">{{ detailLog.description }}</p>
              </div>

              <!-- Before / After Data -->
              <div class="diff-grid">
                <div class="diff-panel" v-if="detailLog.beforeData">
                  <div class="diff-header before">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M20 12H4"/>
                    </svg>
                    Data Sebelum
                  </div>
                  <pre class="diff-code">{{ JSON.stringify(detailLog.beforeData, null, 2) }}</pre>
                </div>
                <div class="diff-panel no-data" v-else>
                  <span class="meta-label">Data Sebelum</span>
                  <p class="no-data-text">— Tidak ada data sebelumnya</p>
                </div>

                <div class="diff-panel" v-if="detailLog.afterData">
                  <div class="diff-header after">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M12 4v16m8-8H4"/>
                    </svg>
                    Data Sesudah
                  </div>
                  <pre class="diff-code">{{ JSON.stringify(detailLog.afterData, null, 2) }}</pre>
                </div>
                <div class="diff-panel no-data" v-else>
                  <span class="meta-label">Data Sesudah</span>
                  <p class="no-data-text">— Tidak ada data sesudah</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuditLogStore } from '../store.js'

const store = useAuditLogStore()
const currentPage = ref(1)
const detailLog = ref(null)

const filters = ref({
  module: '',
  action: '',
  from: '',
  to: '',
})

onMounted(() => {
  store.fetchLogs(1)
})

function applyFilters() {
  store.setFilters(filters.value)
  currentPage.value = 1
  store.fetchLogs(1)
}

function resetFilters() {
  filters.value = { module: '', action: '', from: '', to: '' }
  store.resetFilters()
  currentPage.value = 1
  store.fetchLogs(1)
}

function goToPage(page) {
  currentPage.value = page
  store.fetchLogs(page)
}

function openDetail(log) {
  detailLog.value = log
}

function closeDetail() {
  detailLog.value = null
}

// ── Formatters ──────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function truncate(str, max) {
  if (!str) return '-'
  return str.length > max ? str.slice(0, max) + '…' : str
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const avatarPalette = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444']
function avatarColor(name) {
  if (!name) return '#6b7280'
  const idx = name.charCodeAt(0) % avatarPalette.length
  return avatarPalette[idx]
}

function moduleLabel(mod) {
  const map = {
    vessel_request: 'Vessel Request',
    moc: 'MOC',
    purchase_order: 'Purchase Order',
    good_receipt: 'Penerimaan Barang',
  }
  return map[mod] ?? mod
}

function moduleClass(mod) {
  const map = {
    vessel_request: 'mod-vr',
    moc: 'mod-moc',
    purchase_order: 'mod-po',
    good_receipt: 'mod-gr',
  }
  return map[mod] ?? ''
}

function actionClass(action) {
  const map = {
    CREATE: 'act-create',
    UPDATE: 'act-update',
    DELETE: 'act-delete',
    APPROVE: 'act-approve',
    REJECT: 'act-reject',
    REVIEW: 'act-review',
    SAW_SCORE: 'act-saw',
    SAW_WEIGHT_REQUEST: 'act-saw',
    SAW_WEIGHT_REVIEW: 'act-review',
  }
  return map[action] ?? ''
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* { font-family: 'Inter', sans-serif; box-sizing: border-box; }

.audit-page {
  padding: 28px;
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Header ─────────────────────────────────────── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%);
  border-radius: 16px;
  padding: 28px 32px;
  color: white;
  box-shadow: 0 8px 32px rgba(79, 70, 229, 0.25);
}

.header-content { display: flex; align-items: center; gap: 16px; }
.header-icon {
  width: 52px; height: 52px;
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.header-icon svg { width: 26px; height: 26px; color: white; }
.page-title { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
.page-subtitle { margin: 0; font-size: 13px; color: rgba(255,255,255,0.7); }

.stat-pill {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2);
  padding: 8px 16px;
  border-radius: 50px;
  font-size: 13px; font-weight: 500;
  backdrop-filter: blur(8px);
}
.stat-dot { width: 8px; height: 8px; border-radius: 50%; background: #34d399; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

/* ── Filter Card ─────────────────────────────────── */
.filter-card {
  background: white;
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  border: 1px solid #e2e8f0;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr auto;
  gap: 14px;
  align-items: end;
}

.filter-label { display: block; font-size: 11.5px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }

.filter-select, .filter-input {
  width: 100%; padding: 9px 12px; font-size: 13.5px;
  border: 1.5px solid #e2e8f0; border-radius: 9px;
  background: #f8fafc; color: #1e293b;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none; appearance: none;
}
.filter-select:focus, .filter-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}

.btn-reset {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 16px; border-radius: 9px; border: 1.5px solid #e2e8f0;
  background: white; color: #64748b; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.btn-reset:hover { border-color: #6366f1; color: #6366f1; background: #f0f0ff; }

/* ── Table Card ──────────────────────────────────── */
.table-card {
  background: white;
  border-radius: 14px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.table-wrapper { overflow-x: auto; }

.audit-table {
  width: 100%; border-collapse: collapse;
  font-size: 13.5px;
}

.audit-table th {
  padding: 12px 16px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: #64748b;
  background: #f8fafc; border-bottom: 1px solid #e2e8f0;
}

.table-row {
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer; transition: background 0.15s;
}
.table-row:hover { background: #f8fafc; }
.table-row:last-child { border-bottom: none; }
.audit-table td { padding: 13px 16px; vertical-align: middle; }

.col-time { min-width: 120px; }
.time-date { display: block; font-weight: 600; color: #1e293b; font-size: 12.5px; }
.time-hour { display: block; color: #94a3b8; font-size: 11.5px; font-variant-numeric: tabular-nums; }

.col-user { min-width: 160px; }
.user-cell { display: flex; align-items: center; gap: 10px; }
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 11px; font-weight: 700; flex-shrink: 0;
}
.user-name { font-weight: 600; color: #1e293b; font-size: 13px; }
.user-role { font-size: 11px; color: #94a3b8; }

.col-code { font-size: 12.5px; }
.entity-code {
  background: #f1f5f9; color: #4f46e5;
  padding: 3px 8px; border-radius: 5px;
  font-family: 'Fira Code', monospace; font-size: 12px;
}

.col-desc { max-width: 260px; color: #475569; font-size: 13px; line-height: 1.5; }
.col-ip { color: #94a3b8; font-size: 12px; font-family: monospace; }
.col-action { text-align: center; width: 60px; }

.btn-detail {
  width: 30px; height: 30px;
  border: none; border-radius: 7px;
  background: #f1f5f9; color: #6366f1;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.btn-detail:hover { background: #e0e7ff; color: #4338ca; transform: scale(1.05); }

/* ── Badges ──────────────────────────────────────── */
.badge-module, .badge-action {
  display: inline-block;
  padding: 3px 10px; border-radius: 50px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.03em;
  text-transform: uppercase;
}

/* module */
.mod-vr  { background: #dbeafe; color: #1d4ed8; }
.mod-moc { background: #ede9fe; color: #6d28d9; }
.mod-po  { background: #dcfce7; color: #15803d; }
.mod-gr  { background: #fff7ed; color: #c2410c; }

/* action */
.act-create  { background: #d1fae5; color: #065f46; }
.act-update  { background: #dbeafe; color: #1e40af; }
.act-delete  { background: #fee2e2; color: #991b1b; }
.act-approve { background: #d1fae5; color: #065f46; }
.act-reject  { background: #fee2e2; color: #991b1b; }
.act-review  { background: #fef3c7; color: #92400e; }
.act-saw     { background: #ede9fe; color: #5b21b6; }

/* ── Pagination ───────────────────────────────────── */
.pagination {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 16px;
  border-top: 1px solid #f1f5f9;
}
.page-btn {
  width: 34px; height: 34px; border-radius: 8px;
  border: 1.5px solid #e2e8f0; background: white; color: #475569;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.page-btn:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { font-size: 13px; color: #64748b; font-weight: 500; }

/* ── States ───────────────────────────────────────── */
.state-loading, .state-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 64px;
  color: #94a3b8; font-size: 14px;
}
.spinner {
  width: 36px; height: 36px; border-radius: 50%;
  border: 3px solid #e2e8f0; border-top-color: #6366f1;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Modal ─────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}

.modal-box {
  background: white;
  border-radius: 18px;
  width: 100%; max-width: 820px;
  max-height: 88vh; overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f1f5f9;
  position: sticky; top: 0; background: white; z-index: 1;
  border-radius: 18px 18px 0 0;
}
.modal-title-group { display: flex; align-items: center; gap: 12px; }
.modal-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }

.modal-close {
  width: 32px; height: 32px; border-radius: 8px; border: none;
  background: #f1f5f9; color: #475569;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.modal-close:hover { background: #fee2e2; color: #ef4444; }

.modal-body { padding: 20px 24px 28px; display: flex; flex-direction: column; gap: 20px; }

.meta-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  background: #f8fafc; border-radius: 10px; padding: 16px;
}
.meta-item { display: flex; flex-direction: column; gap: 4px; }
.meta-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
.meta-value { font-size: 13.5px; font-weight: 500; color: #1e293b; }
.meta-value.mono { font-family: monospace; }

.desc-block { display: flex; flex-direction: column; gap: 6px; }
.desc-text { margin: 0; font-size: 13.5px; color: #475569; line-height: 1.6; }

.diff-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.diff-panel {
  border-radius: 10px; overflow: hidden;
  border: 1.5px solid #e2e8f0;
}
.diff-panel.no-data {
  background: #f8fafc; padding: 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.no-data-text { font-size: 13px; color: #94a3b8; margin: 0; }

.diff-header {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 14px; font-size: 11.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.diff-header.before { background: #fef3c7; color: #92400e; }
.diff-header.after  { background: #d1fae5; color: #065f46; }

.diff-code {
  margin: 0; padding: 14px;
  font-size: 12px; line-height: 1.6;
  background: #1e293b; color: #e2e8f0;
  overflow-x: auto; font-family: 'Fira Code', 'Courier New', monospace;
  max-height: 280px; overflow-y: auto;
}

/* ── Transitions ──────────────────────────────────── */
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: scale(0.95) translateY(8px); }

@media (max-width: 768px) {
  .audit-page { padding: 16px; }
  .page-header { flex-direction: column; gap: 14px; align-items: flex-start; }
  .filter-grid { grid-template-columns: 1fr 1fr; }
  .diff-grid { grid-template-columns: 1fr; }
  .meta-grid { grid-template-columns: 1fr; }
}
</style>
