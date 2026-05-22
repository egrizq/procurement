<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="$emit('close')" />

        <!-- Modal Panel -->
        <div class="relative w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <BarChart2 :size="18" class="text-white" />
              </div>
              <div>
                <h2 class="text-white font-bold text-lg leading-tight">Analisis Scoring SAW</h2>
                <p class="text-indigo-200 text-xs">Simple Additive Weighting — MOC #{{ mocId }}</p>
              </div>
            </div>
            <button
              @click="$emit('close')"
              class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X :size="16" />
            </button>
          </div>

          <!-- Scrollable body -->
          <div class="overflow-y-auto flex-1 p-6 space-y-6">

            <!-- Loading state -->
            <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-4">
              <div class="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p class="text-slate-500 text-sm font-medium">Menghitung scoring SAW...</p>
            </div>

            <!-- Error state -->
            <div v-else-if="errorMsg" class="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div class="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle :size="28" class="text-red-500" />
              </div>
              <p class="text-red-600 font-semibold">{{ errorMsg }}</p>
              <button
                @click="runScoring"
                class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>

            <!-- Results -->
            <template v-else-if="breakdown">

              <!-- MOC Info -->
              <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-700">
                <div><span class="text-slate-400">Request:</span> <strong>{{ moc?.vesselRequest?.requestCode || '-' }}</strong></div>
                <div><span class="text-slate-400">Vessel:</span> <strong>{{ moc?.vesselRequest?.vessel?.name || '-' }}</strong></div>
                <div><span class="text-slate-400">Item:</span> <strong>{{ moc?.vesselRequestItem?.item?.name || '-' }}</strong></div>
              </div>

              <!-- Weight Info Banner -->
              <div class="flex flex-wrap gap-3">
                <div
                  v-for="w in weightLabels" :key="w.key"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
                  :class="w.class"
                >
                  <component :is="w.icon" :size="12" />
                  {{ w.label }} · Bobot {{ (w.weight * 100).toFixed(0) }}%
                </div>
              </div>

              <!-- Podium Ranking (top 3) -->
              <div>
                <h3 class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Trophy :size="16" class="text-amber-500" />
                  Ranking Vendor
                </h3>
                <div class="flex flex-wrap gap-4">
                  <div
                    v-for="v in rankedVendors" :key="v.id"
                    class="flex-1 min-w-[160px] relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all"
                    :class="rankCardClass(v.rank)"
                  >
                    <!-- Medal -->
                    <span class="text-3xl">{{ medalOf(v.rank) }}</span>
                    <span class="font-bold text-slate-800 text-sm text-center">{{ v.vendor?.name || `Vendor ${v.rank}` }}</span>
                    <!-- SAW score bar -->
                    <div class="w-full bg-slate-100 rounded-full h-2">
                      <div
                        class="h-2 rounded-full transition-all duration-700"
                        :class="rankBarClass(v.rank)"
                        :style="{ width: `${(v.sawScore * 100).toFixed(1)}%` }"
                      />
                    </div>
                    <span class="text-xl font-black" :class="rankScoreClass(v.rank)">
                      {{ (v.sawScore * 100).toFixed(2) }}%
                    </span>
                    <span v-if="v.rank === 1" class="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow">
                      WINNER
                    </span>
                  </div>
                </div>
              </div>

              <!-- Breakdown Table -->
              <div>
                <h3 class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <TableIcon :size="16" class="text-indigo-500" />
                  Tabel Normalisasi & Bobot
                </h3>
                <div class="overflow-x-auto rounded-xl border border-slate-200">
                  <table class="w-full text-xs">
                    <thead>
                      <tr class="bg-slate-50 border-b border-slate-200">
                        <th class="px-4 py-3 text-left font-bold text-slate-600">Rank</th>
                        <th class="px-4 py-3 text-left font-bold text-slate-600">Vendor</th>
                        <!-- Price -->
                        <th class="px-4 py-3 text-center font-bold text-slate-600">
                          <div class="flex flex-col items-center gap-0.5">
                            <span class="text-rose-600">Harga (40%)</span>
                            <span class="text-slate-400 font-normal text-[10px]">cost — min terbaik</span>
                          </div>
                        </th>
                        <!-- Qty -->
                        <th class="px-4 py-3 text-center font-bold text-slate-600">
                          <div class="flex flex-col items-center gap-0.5">
                            <span class="text-blue-600">Qty (25%)</span>
                            <span class="text-slate-400 font-normal text-[10px]">benefit — max terbaik</span>
                          </div>
                        </th>
                        <!-- Warranty -->
                        <th class="px-4 py-3 text-center font-bold text-slate-600">
                          <div class="flex flex-col items-center gap-0.5">
                            <span class="text-emerald-600">Garansi (20%)</span>
                            <span class="text-slate-400 font-normal text-[10px]">benefit — max terbaik</span>
                          </div>
                        </th>
                        <!-- Discount -->
                        <th class="px-4 py-3 text-center font-bold text-slate-600">
                          <div class="flex flex-col items-center gap-0.5">
                            <span class="text-violet-600">Diskon (15%)</span>
                            <span class="text-slate-400 font-normal text-[10px]">benefit — max terbaik</span>
                          </div>
                        </th>
                        <th class="px-4 py-3 text-center font-bold text-indigo-700 bg-indigo-50/50">
                          Skor SAW
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="v in breakdown.vendors" :key="v.id"
                        class="border-b border-slate-100 last:border-0 transition-colors"
                        :class="v.rank === 1 ? 'bg-emerald-50/40' : 'hover:bg-slate-50'"
                      >
                        <!-- Rank -->
                        <td class="px-4 py-3 font-bold text-slate-500 text-center">
                          {{ medalOf(v.rank) }} {{ v.rank }}
                        </td>
                        <!-- Vendor name -->
                        <td class="px-4 py-3 font-semibold text-slate-800">
                          {{ v.vendor?.name || '-' }}
                        </td>
                        <!-- Price cell -->
                        <td class="px-4 py-3 text-center">
                          <div class="flex flex-col items-center gap-0.5">
                            <span class="text-slate-500">Rp {{ formatNumber(v.unitPrice) }}</span>
                            <div class="flex items-center gap-1">
                              <ScoreBar :value="v.normalized.rPrice" color="rose" />
                              <span class="font-bold text-rose-700">{{ (v.normalized.rPrice).toFixed(4) }}</span>
                            </div>
                            <span class="text-[10px] text-slate-400">×40% = <b class="text-rose-600">{{ (v.weighted.wPrice * 100).toFixed(2) }}%</b></span>
                          </div>
                        </td>
                        <!-- Qty cell -->
                        <td class="px-4 py-3 text-center">
                          <div class="flex flex-col items-center gap-0.5">
                            <span class="text-slate-500">{{ v.availableQty }} unit</span>
                            <div class="flex items-center gap-1">
                              <ScoreBar :value="v.normalized.rQty" color="blue" />
                              <span class="font-bold text-blue-700">{{ (v.normalized.rQty).toFixed(4) }}</span>
                            </div>
                            <span class="text-[10px] text-slate-400">×25% = <b class="text-blue-600">{{ (v.weighted.wQty * 100).toFixed(2) }}%</b></span>
                          </div>
                        </td>
                        <!-- Warranty cell -->
                        <td class="px-4 py-3 text-center">
                          <div class="flex flex-col items-center gap-0.5">
                            <span class="text-slate-500">{{ v.warranty }} bln</span>
                            <div class="flex items-center gap-1">
                              <ScoreBar :value="v.normalized.rWar" color="emerald" />
                              <span class="font-bold text-emerald-700">{{ (v.normalized.rWar).toFixed(4) }}</span>
                            </div>
                            <span class="text-[10px] text-slate-400">×20% = <b class="text-emerald-600">{{ (v.weighted.wWar * 100).toFixed(2) }}%</b></span>
                          </div>
                        </td>
                        <!-- Discount cell -->
                        <td class="px-4 py-3 text-center">
                          <div class="flex flex-col items-center gap-0.5">
                            <span class="text-slate-500">{{ v.discount }}%</span>
                            <div class="flex items-center gap-1">
                              <ScoreBar :value="v.normalized.rDis" color="violet" />
                              <span class="font-bold text-violet-700">{{ (v.normalized.rDis).toFixed(4) }}</span>
                            </div>
                            <span class="text-[10px] text-slate-400">×15% = <b class="text-violet-600">{{ (v.weighted.wDis * 100).toFixed(2) }}%</b></span>
                          </div>
                        </td>
                        <!-- SAW Score -->
                        <td class="px-4 py-3 text-center bg-indigo-50/30">
                          <div class="flex flex-col items-center gap-1">
                            <span
                              class="text-lg font-black"
                              :class="v.rank === 1 ? 'text-emerald-600' : 'text-indigo-700'"
                            >
                              {{ (v.sawScore * 100).toFixed(2) }}%
                            </span>
                            <div class="w-16 bg-slate-200 rounded-full h-1.5">
                              <div
                                class="h-1.5 rounded-full"
                                :class="v.rank === 1 ? 'bg-emerald-500' : 'bg-indigo-400'"
                                :style="{ width: `${(v.sawScore * 100).toFixed(1)}%` }"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Formula Note -->
              <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 space-y-1.5">
                <p class="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Info :size="13" />
                  Cara Perhitungan SAW
                </p>
                <p>• <b>Cost criteria</b> (Harga): r = nilai_minimum / nilai_vendor</p>
                <p>• <b>Benefit criteria</b> (Qty, Garansi, Diskon): r = nilai_vendor / nilai_maksimum</p>
                <p>• <b>Skor SAW</b> = (r_harga × 40%) + (r_qty × 25%) + (r_garansi × 20%) + (r_diskon × 15%)</p>
                <p>• Vendor dengan <b>skor tertinggi</b> ditetapkan sebagai pemenang.</p>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
            <span class="text-xs text-slate-400" v-if="breakdown">
              Scoring terakhir dihitung: {{ new Date().toLocaleString('id-ID') }}
            </span>
            <div class="flex gap-3 ml-auto">
              <button
                @click="runScoring"
                :disabled="isLoading"
                class="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors"
              >
                <RefreshCw :size="14" :class="isLoading ? 'animate-spin' : ''" />
                Hitung Ulang
              </button>
              <button
                @click="$emit('close')"
                class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import {
  BarChart2, X, Trophy, AlertCircle, RefreshCw, Info,
  DollarSign, Package, ShieldCheck, Tag, Table as TableIcon
} from 'lucide-vue-next'
import { useMocStore } from '../store.js'
import { showSuccess, showError } from '@/services/notification.js'

// ── Mini sub-component: horizontal score bar ──────────────────
const ScoreBar = {
  props: { value: Number, color: String },
  template: `
    <div class="w-10 h-1.5 bg-slate-200 rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="{
          'bg-rose-500'   : color === 'rose',
          'bg-blue-500'   : color === 'blue',
          'bg-emerald-500': color === 'emerald',
          'bg-violet-500' : color === 'violet',
        }"
        :style="{ width: \`\${Math.round(value * 100)}%\` }"
      />
    </div>
  `
}

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  mocId:  { type: [Number, String], default: null },
})

const emit = defineEmits(['close'])

const mocStore   = useMocStore()
const isLoading  = ref(false)
const errorMsg   = ref(null)
const breakdown  = ref(null)
const moc        = ref(null)

const weightLabels = [
  { key: 'unitPrice',    label: 'Harga',       weight: 0.40, icon: DollarSign,  class: 'bg-rose-50 border-rose-200 text-rose-700'     },
  { key: 'availableQty', label: 'Ketersediaan', weight: 0.25, icon: Package,     class: 'bg-blue-50 border-blue-200 text-blue-700'     },
  { key: 'warranty',     label: 'Garansi',      weight: 0.20, icon: ShieldCheck, class: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { key: 'discount',     label: 'Diskon',       weight: 0.15, icon: Tag,         class: 'bg-violet-50 border-violet-200 text-violet-700' },
]

const rankedVendors = computed(() =>
  breakdown.value
    ? [...breakdown.value.vendors].sort((a, b) => a.rank - b.rank).slice(0, 3)
    : []
)

const medalOf = (rank) => ({ 1: '🥇', 2: '🥈', 3: '🥉' }[rank] ?? `#${rank}`)

const rankCardClass = (rank) => ({
  1: 'border-amber-400 bg-gradient-to-b from-amber-50 to-white shadow-lg shadow-amber-100',
  2: 'border-slate-300 bg-gradient-to-b from-slate-50 to-white shadow-md',
  3: 'border-orange-300 bg-gradient-to-b from-orange-50 to-white shadow',
}[rank] ?? 'border-slate-200 bg-white')

const rankBarClass  = (rank) => ({ 1: 'bg-amber-400', 2: 'bg-slate-400', 3: 'bg-orange-400' }[rank] ?? 'bg-indigo-400')
const rankScoreClass = (rank) => ({ 1: 'text-amber-600', 2: 'text-slate-600', 3: 'text-orange-600' }[rank] ?? 'text-indigo-600')

const formatNumber = (num) => {
  if (!num) return '0'
  return Number(num).toLocaleString('id-ID')
}

const runScoring = async () => {
  if (!props.mocId) return
  isLoading.value = true
  errorMsg.value  = null
  try {
    const result = await mocStore.scoreMoc(props.mocId)
    breakdown.value = result.breakdown
    moc.value       = result.moc
    showSuccess('Scoring SAW berhasil dihitung.')
  } catch (err) {
    errorMsg.value = mocStore.error || err?.message || 'Gagal menghitung scoring SAW.'
    showError(errorMsg.value)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      breakdown.value = null
      errorMsg.value  = null
      moc.value       = null
      runScoring()
    }
  }
)
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
