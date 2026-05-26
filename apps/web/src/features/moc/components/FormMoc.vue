<template>
  <FormDialog
    :is-open="isOpen"
    :title="isEditMode ? 'Edit Matrix of Comparison' : 'Create Matrix of Comparison'"
    :loading="isSaving"
    size="2xl"
    @close="handleClose"
  >
    <template #default>
      <!-- ─── Step Indicator ──────────────────────────────────────── -->
      <div class="mb-8 border-b border-gray-100 pb-4">
        <div class="flex items-center justify-center gap-2">
          <!-- Step 1 -->
          <div v-if="!isEditMode" class="flex items-center gap-2">
            <span
              class="flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all duration-200"
              :class="currentStep === 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : currentStep > 1 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'"
            >
              <Check v-if="currentStep > 1" :size="14" />
              <span v-else>1</span>
            </span>
            <span class="text-sm font-medium" :class="currentStep === 1 ? 'text-indigo-600 font-semibold' : 'text-gray-400'">
              Select Item
            </span>
          </div>
          <div v-if="!isEditMode" class="w-10 h-px bg-gray-200"></div>

          <!-- Step 2 -->
          <div class="flex items-center gap-2">
            <span
              class="flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all duration-200"
              :class="currentStep === 2 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : currentStep > 2 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'"
            >
              <Check v-if="currentStep > 2" :size="14" />
              <span v-else>{{ isEditMode ? 1 : 2 }}</span>
            </span>
            <span class="text-sm font-medium" :class="currentStep === 2 ? 'text-indigo-600 font-semibold' : currentStep > 2 ? 'text-emerald-600' : 'text-gray-400'">
              Vendor Matrix
            </span>
          </div>
          <div class="w-10 h-px bg-gray-200"></div>

          <!-- Step 3 -->
          <div class="flex items-center gap-2">
            <span
              class="flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all duration-200"
              :class="currentStep === 3 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-gray-100 text-gray-500'"
            >
              {{ isEditMode ? 2 : 3 }}
            </span>
            <span class="text-sm font-medium" :class="currentStep === 3 ? 'text-indigo-600 font-semibold' : 'text-gray-400'">
              SAW Scoring
            </span>
          </div>
        </div>
      </div>

      <!-- ─── Step 1: Select Request & Item ──────────────────────── -->
      <div v-if="currentStep === 1 && !isEditMode" class="space-y-6">
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700">Choose Approved Request *</label>
          <select
            v-model="wizardData.vesselRequestId"
            class="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
            @change="handleRequestChange"
          >
            <option :value="null" disabled>Select an approved request</option>
            <option v-for="req in approvedRequests.filter(r => r.availableForMocCount > 0)" :key="req.id" :value="req.id">
              {{ req.requestCode }} - {{ req.vessel?.name }} (Requested by: {{ req.user?.fullName }})
            </option>
          </select>
        </div>

        <div v-if="selectedRequestDetail" class="space-y-3">
          <label class="block text-sm font-semibold text-gray-700">Select Item to Compare *</label>
          <div v-if="approvedItems.length === 0" class="text-sm text-amber-600 bg-amber-50 p-4 rounded-lg border border-amber-200">
            No approved items found in this request.
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="item in approvedItems" :key="item.id"
              @click="selectRequestItem(item)"
              class="flex flex-col justify-between p-4 border rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition-all duration-150"
              :class="wizardData.vesselRequestItemId === item.id ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500' : 'border-gray-200 bg-white'"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h5 class="font-semibold text-gray-900">{{ item.item?.name || 'Unknown Item' }}</h5>
                  <p class="text-xs text-gray-400 mt-0.5">Code: {{ item.item?.itemCode || '-' }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">Approved</span>
                  <CheckCircle v-if="wizardData.vesselRequestItemId === item.id" class="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div class="flex justify-between items-center mt-4 border-t border-gray-100 pt-3">
                <span class="text-xs text-gray-500">Qty Approved:</span>
                <span class="text-sm font-bold text-gray-800">{{ item.qtyApproved }} {{ item.unit }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Step 2: Vendor Comparison Matrix ───────────────────── -->
      <div v-if="currentStep === 2" class="space-y-6">
        <!-- Summary Header -->
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-700">
          <div><span class="text-slate-400">Request:</span> <strong class="ml-1 text-slate-900">{{ summaryRequestCode }}</strong></div>
          <div><span class="text-slate-400">Vessel:</span> <strong class="ml-1 text-slate-900">{{ summaryVesselName }}</strong></div>
          <div><span class="text-slate-400">Item:</span> <strong class="ml-1 text-slate-900">{{ summaryItemName }}</strong></div>
          <div><span class="text-slate-400">Approved Qty:</span> <strong class="ml-1 text-slate-900">{{ summaryApprovedQty }}</strong></div>
        </div>

        <div class="flex justify-between items-center">
          <h4 class="text-md font-bold text-gray-900 flex items-center gap-1.5">
            <Scale :size="18" class="text-indigo-600" />
            Vendor Matrix List
            <span class="text-xs font-normal text-gray-400">(Minimum 3 vendors required)</span>
          </h4>
          <button
            v-if="!isCompleted"
            @click="addVendorToMatrix"
            type="button"
            class="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-300 bg-indigo-50/50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus :size="14" />
            Add Vendor
          </button>
        </div>

        <!-- Vendor Cards Grid -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div
            v-for="(matrix, idx) in wizardData.vendors" :key="idx"
            class="flex flex-col bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-200"
            :class="matrix.isSelected ? 'border-emerald-500 shadow-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-gray-200 hover:border-gray-300'"
          >
            <!-- Card Header -->
            <div class="flex justify-between items-center px-4 py-3 bg-slate-50 border-b border-gray-100">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor #{{ idx + 1 }}</span>
              <button
                v-if="!isCompleted"
                @click="removeVendorFromMatrix(idx)"
                type="button"
                :disabled="wizardData.vendors.length <= 3"
                class="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Remove this vendor"
              >
                <Trash2 :size="14" />
              </button>
            </div>

            <!-- Card Body -->
            <div class="p-4 space-y-3.5 flex-1">
              <!-- Vendor Selection -->
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Select Vendor *</label>
                <select
                  v-model="matrix.vendorId"
                  :disabled="isCompleted"
                  class="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option :value="null" disabled>Choose vendor</option>
                  <option v-for="v in masterVendors" :key="v.id" :value="v.id">{{ v.name }}</option>
                </select>
              </div>

              <!-- Unit Price -->
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Unit Price (IDR) *</label>
                <input
                  v-model.number="matrix.unitPrice"
                  type="number" min="0"
                  :disabled="isCompleted"
                  class="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter unit price"
                />
                <span v-if="matrix.unitPrice" class="text-[10px] text-gray-400 mt-0.5 block">
                  Rp {{ formatNumber(matrix.unitPrice) }}
                </span>
              </div>

              <!-- Available Qty -->
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Ketersediaan Qty *</label>
                <input
                  v-model.number="matrix.availableQty"
                  type="number" min="0"
                  :disabled="isCompleted"
                  class="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Available stock qty"
                />
              </div>

              <!-- Warranty -->
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Garansi (bulan)</label>
                <input
                  v-model.number="matrix.warranty"
                  type="number" min="0"
                  :disabled="isCompleted"
                  class="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="e.g. 12"
                />
              </div>

              <!-- Discount -->
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Diskon (%)</label>
                <div class="relative">
                  <input
                    v-model.number="matrix.discount"
                    type="number" min="0" max="100"
                    :disabled="isCompleted"
                    class="w-full px-3 py-2 pr-8 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="0"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                </div>
              </div>

              <!-- Remarks -->
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Remarks</label>
                <textarea
                  v-model="matrix.remarks"
                  rows="2"
                  :disabled="isCompleted"
                  class="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Notes, terms, etc."
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Step 3: SAW Scoring Results ────────────────────────── -->
      <div v-if="currentStep === 3" class="space-y-6">
        <!-- Summary Header (same pattern as step 2) -->
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-700">
          <div><span class="text-slate-400">Request:</span> <strong class="ml-1 text-slate-900">{{ summaryRequestCode }}</strong></div>
          <div><span class="text-slate-400">Vessel:</span> <strong class="ml-1 text-slate-900">{{ summaryVesselName }}</strong></div>
          <div><span class="text-slate-400">Item:</span> <strong class="ml-1 text-slate-900">{{ summaryItemName }}</strong></div>
          <div><span class="text-slate-400">Approved Qty:</span> <strong class="ml-1 text-slate-900">{{ summaryApprovedQty }}</strong></div>
        </div>

        <!-- Section Title -->
        <div class="flex items-center gap-2">
          <h4 class="text-md font-bold text-gray-900 flex items-center gap-1.5">
            <BarChart2 :size="18" class="text-indigo-600" />
            Hasil Scoring SAW
          </h4>
          <div class="flex gap-2 ml-auto flex-wrap">
            <span v-for="w in sawWeightLabels" :key="w.label"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
              :class="w.cls"
            >{{ w.label }} {{ w.pct }}</span>
          </div>
        </div>

        <!-- Scoring Cards (same grid as step 2) -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div
            v-for="v in sawResults" :key="v.vendorId"
            class="flex flex-col bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-200"
            :class="v.rank === 1 ? 'border-emerald-500 shadow-emerald-100 ring-2 ring-emerald-500/20' : 'border-gray-200'"
          >
            <!-- Card Header (same pattern as vendor cards) -->
            <div
              class="flex justify-between items-center px-4 py-3 border-b border-gray-100"
              :class="v.rank === 1 ? 'bg-emerald-50' : 'bg-slate-50'"
            >
              <div class="flex items-center gap-2">
                <span class="text-base">{{ medalOf(v.rank) }}</span>
                <span class="text-xs font-bold uppercase tracking-wider" :class="v.rank === 1 ? 'text-emerald-700' : 'text-gray-400'">
                  Rank #{{ v.rank }}
                </span>
              </div>
              <span v-if="v.rank === 1"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white"
              >
                <Trophy :size="10" /> WINNER
              </span>
            </div>

            <!-- Card Body -->
            <div class="p-4 space-y-3 flex-1">
              <!-- Vendor Name -->
              <div class="text-sm font-bold text-gray-900">{{ v.vendorName }}</div>

              <!-- SAW Score Bar -->
              <div class="space-y-1">
                <div class="flex justify-between items-center">
                  <span class="text-xs text-gray-500">SAW Score</span>
                  <span class="text-lg font-black" :class="v.rank === 1 ? 'text-emerald-600' : 'text-indigo-700'">
                    {{ (v.sawScore * 100).toFixed(2) }}%
                  </span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all duration-700"
                    :class="v.rank === 1 ? 'bg-emerald-500' : 'bg-indigo-400'"
                    :style="{ width: `${(v.sawScore * 100).toFixed(1)}%` }"
                  />
                </div>
              </div>

              <!-- Criterion Breakdown -->
              <div class="space-y-2 pt-1 border-t border-gray-100">
                <!-- Price -->
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
                    <span class="text-gray-500">Harga</span>
                    <span class="text-gray-400">(Rp {{ formatNumber(v.unitPrice) }})</span>
                  </div>
                  <div class="text-right">
                    <span class="text-rose-600 font-bold">{{ v.normalized.rPrice.toFixed(4) }}</span>
                    <span class="text-gray-400 ml-1">→ {{ (v.weighted.wPrice * 100).toFixed(2) }}%</span>
                  </div>
                </div>
                <!-- Qty -->
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                    <span class="text-gray-500">Qty</span>
                    <span class="text-gray-400">({{ v.availableQty }} unit)</span>
                  </div>
                  <div class="text-right">
                    <span class="text-blue-600 font-bold">{{ v.normalized.rQty.toFixed(4) }}</span>
                    <span class="text-gray-400 ml-1">→ {{ (v.weighted.wQty * 100).toFixed(2) }}%</span>
                  </div>
                </div>
                <!-- Warranty -->
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                    <span class="text-gray-500">Garansi</span>
                    <span class="text-gray-400">({{ v.warranty }} bln)</span>
                  </div>
                  <div class="text-right">
                    <span class="text-emerald-600 font-bold">{{ v.normalized.rWar.toFixed(4) }}</span>
                    <span class="text-gray-400 ml-1">→ {{ (v.weighted.wWar * 100).toFixed(2) }}%</span>
                  </div>
                </div>
                <!-- Discount -->
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-violet-400 shrink-0"></span>
                    <span class="text-gray-500">Diskon</span>
                    <span class="text-gray-400">({{ v.discount }}%)</span>
                  </div>
                  <div class="text-right">
                    <span class="text-violet-600 font-bold">{{ v.normalized.rDis.toFixed(4) }}</span>
                    <span class="text-gray-400 ml-1">→ {{ (v.weighted.wDis * 100).toFixed(2) }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card Footer: raw total -->
            <div class="px-4 py-2.5 border-t border-gray-100 bg-slate-50/50 flex justify-between items-center">
              <span class="text-[10px] text-gray-400">Σ weighted score</span>
              <span class="text-xs font-bold" :class="v.rank === 1 ? 'text-emerald-600' : 'text-gray-600'">
                {{ v.sawScore.toFixed(4) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Formula note (same card style) -->
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 space-y-1">
          <p class="font-semibold text-slate-700 flex items-center gap-1.5"><Info :size="13" /> Formula SAW</p>
          <p>• <b>Cost</b> (Harga): r = nilai_min ÷ nilai_vendor &nbsp;|&nbsp; <b>Benefit</b> (Qty, Garansi, Diskon): r = nilai_vendor ÷ nilai_max</p>
          <p>• <b>S</b> = (r_harga × 40%) + (r_qty × 25%) + (r_garansi × 20%) + (r_diskon × 15%)</p>
        </div>

        <!-- ─── Vendor Picker ──────────────────────────────── -->
        <div class="border-t border-slate-100 pt-4">
          <h4 class="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <UserCheck :size="16" class="text-indigo-500" />
            Pilih Vendor Final
            <span class="text-xs font-normal text-gray-400">
              (SAW winner dipilih otomatis, {{ isVendorSelectionReadOnly ? 'pilihan ini hanya untuk dilihat' : 'Anda dapat mengubahnya' }})
            </span>
          </h4>

          <!-- SAW-mismatch warning -->
          <div
            v-if="selectedVendorId && sawWinner && selectedVendorId !== sawWinner.vendorId"
            class="mb-3 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4"
          >
            <AlertTriangle :size="18" class="text-amber-500 shrink-0 mt-0.5" />
            <p class="text-sm text-amber-800">
              <strong>Perhatian:</strong> Vendor yang Anda pilih berbeda dari rekomendasi SAW (<em>{{ sawWinner.vendorName }}</em>).
              Pastikan ada alasan yang valid untuk keputusan ini.
            </p>
          </div>

          <div class="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <div
              v-for="v in sawResults" :key="v.vendorId"
              @click="selectVendorCard(v.vendorId)"
              class="relative flex flex-col gap-2 p-4 rounded-xl border-2 transition-all duration-150"
              :class="[
                isVendorSelectionReadOnly ? 'pointer-events-none cursor-default' : 'cursor-pointer',
                selectedVendorId === v.vendorId
                  ? 'border-indigo-500 bg-indigo-50/60 shadow-sm ring-2 ring-indigo-500/20'
                  : 'border-gray-200 bg-white hover:border-gray-300',
              ]"
            >
              <!-- SAW rank badge -->
              <div class="flex items-center justify-between">
                <span class="text-base">{{ medalOf(v.rank) }}</span>
                <span
                  v-if="v.rank === 1"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white"
                >SAW Winner</span>
                <span
                  v-if="selectedVendorId === v.vendorId"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white"
                >✓ Dipilih</span>
              </div>
              <p class="text-sm font-bold text-gray-900">{{ v.vendorName }}</p>
              <p class="text-xs text-indigo-700 font-semibold">SAW: {{ (v.sawScore * 100).toFixed(2) }}%</p>
              <p class="text-xs text-gray-500">Rp {{ formatNumber(v.unitPrice) }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ─── Footer ─────────────────────────────────────────────── -->
    <template #footer>
      <div class="flex items-center justify-between w-full">
        <!-- Left: Back button -->
        <div>
          <button
            v-if="currentStep > 1"
            @click="goBack"
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
        </div>

        <!-- Right: action buttons -->
        <div class="flex items-center gap-2">
          <button
            @click="handleClose"
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {{ isCompleted ? 'Tutup' : 'Cancel' }}
          </button>

          <!-- Step 1: Next -->
          <button
            v-if="currentStep === 1"
            @click="goToStep2"
            type="button"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Next →
          </button>

          <!-- Step 2: Save Draft + Lanjut Scoring -->
          <template v-if="currentStep === 2">
            <template v-if="!isCompleted">
              <button
                @click="saveDraft"
                type="button"
                :disabled="isSaving"
                class="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
              >
                <span v-if="isSaving && savingMode === 'draft'" class="flex items-center gap-2">
                  <span class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                  Saving...
                </span>
                <span v-else>Simpan Draft</span>
              </button>
            </template>
            <button
              @click="goToScoring"
              type="button"
              :disabled="isSaving"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <BarChart2 :size="14" />
              <span>{{ isCompleted ? 'Lihat Scoring →' : 'Lanjut Scoring →' }}</span>
            </button>
          </template>

          <!-- Step 3: Simpan Draft + Pilih Vendor & Lanjutkan PO -->
          <template v-if="currentStep === 3 && !isCompleted">
            <button
              @click="saveDraft"
              type="button"
              :disabled="isSaving"
              class="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
            >
              <span v-if="isSaving && savingMode === 'draft'" class="flex items-center gap-2">
                <span class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </span>
              <span v-else>Simpan Draft</span>
            </button>
            <button
              @click="completeWithVendorAndPO"
              type="button"
              :disabled="isSaving || !selectedVendorId"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <span v-if="isSaving && savingMode === 'complete'" class="flex items-center gap-2">
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </span>
              <span v-else class="flex items-center gap-2">
                <ShoppingCart :size="14" />
                Pilih Vendor &amp; Lanjutkan PO
              </span>
            </button>
          </template>
        </div>
      </div>
    </template>
  </FormDialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Trash2, CheckCircle, Scale, BarChart2, Trophy, Check, Info, UserCheck, AlertTriangle, ShoppingCart } from 'lucide-vue-next'
import FormDialog from '@/components/base/form/Form.vue'
import { useMocStore } from '../store.js'
import { useRequestStore } from '../../request/store.js'
import { useVendorStore } from '../../master-data/vendors/store.js'
import { showSuccess, showError } from '@/services/notification.js'
import { createPurchaseOrder } from '../../purchase-order/api.js'
import Swal from 'sweetalert2'

const router = useRouter()

const props = defineProps({
  isOpen:     { type: Boolean, default: false },
  isEditMode: { type: Boolean, default: false },
  mocId:      { type: [Number, String], default: null },
})

const emit = defineEmits(['close', 'saved', 'go-to-po'])

const mocStore    = useMocStore()
const requestStore = useRequestStore()
const vendorStore  = useVendorStore()

// ── State ────────────────────────────────────────────────────────
const currentStep   = ref(1)
const isSaving      = ref(false)
const savingMode    = ref(null)   // 'draft' | 'complete'

const approvedRequests    = ref([])
const selectedRequestDetail = ref(null)
const approvedItems       = ref([])

// SAW results (computed in goToScoring)
const sawResults = ref([])
const selectedVendorId = ref(null)

// Computed winner from SAW
const sawWinner = computed(() => sawResults.value.find((v) => v.rank === 1) || null)
const isVendorSelectionReadOnly = computed(() => isCompleted.value)

const makeEmptyVendor = () => ({
  vendorId: null, unitPrice: 0, availableQty: 0,
  warranty: 0, discount: 0, remarks: '', isSelected: false, sawScore: null,
})

const wizardData = ref({
  vesselRequestId: null,
  vesselRequestItemId: null,
  status: 'Draft',
  vendors: [makeEmptyVendor(), makeEmptyVendor(), makeEmptyVendor()],
})

// ── Computed ──────────────────────────────────────────────────────
const masterVendors = computed(() => vendorStore.vendors || [])

const summaryRequestCode = computed(() => {
  if (props.isEditMode && mocStore.currentMoc) return mocStore.currentMoc.vesselRequest?.requestCode || '-'
  return selectedRequestDetail.value?.requestCode || '-'
})
const summaryVesselName = computed(() => {
  if (props.isEditMode && mocStore.currentMoc) return mocStore.currentMoc.vesselRequest?.vessel?.name || '-'
  return selectedRequestDetail.value?.vessel?.name || '-'
})
const summaryItemName = computed(() => {
  if (props.isEditMode && mocStore.currentMoc) return mocStore.currentMoc.vesselRequestItem?.item?.name || '-'
  const item = approvedItems.value.find(i => i.id === wizardData.value.vesselRequestItemId)
  return item?.item?.name || '-'
})
const summaryApprovedQty = computed(() => {
  if (props.isEditMode && mocStore.currentMoc) {
    const ri = mocStore.currentMoc.vesselRequestItem
    return `${ri?.qtyApproved || ri?.qtyRequested} ${ri?.unit || ''}`
  }
  const item = approvedItems.value.find(i => i.id === wizardData.value.vesselRequestItemId)
  return item ? `${item.qtyApproved || item.qtyRequested} ${item.unit}` : '-'
})

const isCompleted = computed(() => wizardData.value.status === 'Completed')

const sawWeightLabels = [
  { label: 'Harga',  pct: '40%', cls: 'bg-rose-50 border-rose-200 text-rose-700'     },
  { label: 'Qty',    pct: '25%', cls: 'bg-blue-50 border-blue-200 text-blue-700'     },
  { label: 'Garansi',pct: '20%', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { label: 'Diskon', pct: '15%', cls: 'bg-violet-50 border-violet-200 text-violet-700' },
]

// ── Helpers ───────────────────────────────────────────────────────
const formatNumber = (num) => {
  if (!num) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const medalOf = (rank) => ({ 1: '🥇', 2: '🥈', 3: '🥉' }[rank] ?? `#${rank}`)

/** Client-side SAW calculation from current wizardData.vendors */
const computeSAW = () => {
  const active = wizardData.value.vendors.filter(v => v.vendorId !== null && Number(v.unitPrice) > 0)
  if (active.length < 2) return []

  const minPrice = Math.min(...active.map(v => Number(v.unitPrice) || 1))
  const maxQty   = Math.max(...active.map(v => Number(v.availableQty) || 0))
  const maxWar   = Math.max(...active.map(v => Number(v.warranty) || 0))
  const maxDis   = Math.max(...active.map(v => Number(v.discount) || 0))

  const scored = active.map(v => {
    const rPrice = minPrice / (Number(v.unitPrice) || 1)
    const rQty   = maxQty > 0 ? (Number(v.availableQty) || 0) / maxQty : 0
    const rWar   = maxWar > 0 ? (Number(v.warranty)     || 0) / maxWar : 0
    const rDis   = maxDis > 0 ? (Number(v.discount)     || 0) / maxDis : 0

    const wPrice = 0.40 * rPrice
    const wQty   = 0.25 * rQty
    const wWar   = 0.20 * rWar
    const wDis   = 0.15 * rDis

    const sawScore = parseFloat((wPrice + wQty + wWar + wDis).toFixed(4))
    const vendor   = masterVendors.value.find(mv => mv.id === v.vendorId)

    return {
      ...v,
      vendorName: vendor?.name || 'Unknown Vendor',
      normalized: {
        rPrice: parseFloat(rPrice.toFixed(4)),
        rQty:   parseFloat(rQty.toFixed(4)),
        rWar:   parseFloat(rWar.toFixed(4)),
        rDis:   parseFloat(rDis.toFixed(4)),
      },
      weighted: {
        wPrice: parseFloat(wPrice.toFixed(4)),
        wQty:   parseFloat(wQty.toFixed(4)),
        wWar:   parseFloat(wWar.toFixed(4)),
        wDis:   parseFloat(wDis.toFixed(4)),
      },
      sawScore,
    }
  })

  const sorted   = [...scored].sort((a, b) => b.sawScore - a.sawScore)
  const maxScore = sorted[0]?.sawScore ?? 0

  return scored
    .map(v => ({ ...v, rank: sorted.findIndex(s => s.vendorId === v.vendorId) + 1, isWinner: v.sawScore === maxScore }))
    .sort((a, b) => a.rank - b.rank)
}

// ── Navigation ────────────────────────────────────────────────────
const goBack = () => {
  if (currentStep.value > (props.isEditMode ? 2 : 1)) {
    currentStep.value -= 1
  }
}

const selectVendorCard = (vendorId) => {
  if (isVendorSelectionReadOnly.value) return
  selectedVendorId.value = vendorId
}

const goToStep2 = () => {
  if (!wizardData.value.vesselRequestId) {
    showError('Please choose an approved crew request first.')
    return
  }
  if (!wizardData.value.vesselRequestItemId) {
    showError('Please select one item to compare.')
    return
  }
  currentStep.value = 2
}

const goToScoring = () => {
  if (!validateVendorData(false)) return
  sawResults.value = computeSAW()
  if (sawResults.value.length < 2) {
    showError('Minimal 2 vendor dengan harga > 0 untuk melakukan scoring.')
    return
  }
  // Pre-select SAW winner
  const winner = sawResults.value.find((v) => v.rank === 1)
  if (winner) selectedVendorId.value = winner.vendorId
  currentStep.value = 3
}

// ── Data manipulation ─────────────────────────────────────────────
const addVendorToMatrix = () => {
  wizardData.value.vendors.push(makeEmptyVendor())
}

const removeVendorFromMatrix = (idx) => {
  if (wizardData.value.vendors.length > 3) {
    wizardData.value.vendors.splice(idx, 1)
  }
}

const handleClose = () => emit('close')

// ── Data loading ──────────────────────────────────────────────────
const fetchApprovedRequestsList = async () => {
  try {
    await mocStore.fetchApprovedRequests(1, 100, '')
    approvedRequests.value = mocStore.requests || []
  } catch {
    showError('Failed to fetch approved requests.')
  }
}

const handleRequestChange = async () => {
  selectedRequestDetail.value = null
  approvedItems.value = []
  wizardData.value.vesselRequestItemId = null
  if (!wizardData.value.vesselRequestId) return
  try {
    const full = await requestStore.fetchRequestById(wizardData.value.vesselRequestId)
    if (full) {
      selectedRequestDetail.value = full
      approvedItems.value = full.vesselRequestItems?.filter(i => 
        (i.status === 'Approved' || i.status === 'Approved by system' || i.qtyApproved > 0) &&
        (!i.mocs || i.mocs.length === 0)
      ) || []
      if (approvedItems.value.length === 1) {
        wizardData.value.vesselRequestItemId = approvedItems.value[0].id
      }
    }
  } catch {
    showError('Failed to load request item details')
  }
}

const selectRequestItem = (item) => {
  wizardData.value.vesselRequestItemId = item.id
}

// ── Form init ─────────────────────────────────────────────────────
const initForm = async () => {
  sawResults.value = []
  selectedVendorId.value = null
  if (props.isEditMode && props.mocId) {
    currentStep.value = 2
    try {
      await mocStore.fetchMocById(props.mocId)
      const current = mocStore.currentMoc
      if (current) {
        const loaded = current.mocVendors?.map(v => ({
          vendorId: v.vendorId,
          unitPrice: v.unitPrice,
          availableQty: v.availableQty ?? 0,
          warranty: v.warranty ?? 0,
          discount: v.discount ?? 0,
          remarks: v.remarks || '',
          isSelected: !!v.isSelected,
          sawScore: v.sawScore ?? null,
        })) || []
        while (loaded.length < 3) loaded.push(makeEmptyVendor())
        wizardData.value = {
          vesselRequestId: current.vesselRequestId,
          vesselRequestItemId: current.vesselRequestItemId,
          status: current.status,
          vendors: loaded,
        }
        selectedVendorId.value = current.selectedVendorId || loaded.find(v => v.isSelected)?.vendorId || null
      }
    } catch {
      showError('Failed to fetch MOC details.')
    }
  } else {
    currentStep.value = 1
    selectedRequestDetail.value = null
    approvedItems.value = []
    wizardData.value = {
      vesselRequestId: null,
      vesselRequestItemId: null,
      status: 'Draft',
      vendors: [makeEmptyVendor(), makeEmptyVendor(), makeEmptyVendor()],
    }
    await fetchApprovedRequestsList()
  }
}

watch(() => props.isOpen, (open) => { if (open) initForm() })

// ── Validation ────────────────────────────────────────────────────
const validateVendorData = (requireAllFilled = true) => {
  const vendors = wizardData.value.vendors
  const active  = vendors.filter(v => v.vendorId !== null)

  if (active.length < 1) {
    showError('Please choose at least one vendor.')
    return false
  }

  const ids = active.map(v => v.vendorId)
  if (new Set(ids).size !== ids.length) {
    showError('Duplicate vendors found. Each vendor must be unique.')
    return false
  }

  if (requireAllFilled) {
    if (vendors.length < 3) {
      showError('Minimum 3 vendors required.')
      return false
    }
    if (ids.length < vendors.length) {
      showError('Please select a vendor for all entries.')
      return false
    }
    if (vendors.some(v => !v.unitPrice || v.unitPrice <= 0)) {
      showError('Please enter a valid price (> 0) for all vendors.')
      return false
    }
    if (vendors.some(v => !v.availableQty || v.availableQty <= 0)) {
      showError('Please enter available qty (> 0) for all vendors.')
      return false
    }
  }

  return true
}

// ── Save actions ──────────────────────────────────────────────────
const buildPayload = (status) => {
  const isDraft   = status === 'Draft'
  const allVendors = wizardData.value.vendors
  const toSend    = isDraft
    ? allVendors.filter(v => v.vendorId !== null)
    : allVendors

  return {
    vesselRequestId:     Number(wizardData.value.vesselRequestId),
    vesselRequestItemId: Number(wizardData.value.vesselRequestItemId),
    status,
    vendors: toSend.map(v => ({
      vendorId:     Number(v.vendorId),
      unitPrice:    Number(v.unitPrice)     || 0,
      availableQty: Number(v.availableQty)  || 0,
      warranty:     Number(v.warranty)      || 0,
      discount:     Number(v.discount)      || 0,
      remarks:      v.remarks || '',
      isSelected:   false,  // backend SAW will decide on Completed
    })),
  }
}

const saveDraft = async () => {
  if (!validateVendorData(false)) return
  isSaving.value   = true
  savingMode.value  = 'draft'
  mocStore.clearError()
  try {
    const payload = buildPayload('Draft')
    if (props.isEditMode) {
      await mocStore.updateMoc(props.mocId, payload)
      showSuccess('MOC draft updated successfully.')
    } else {
      await mocStore.createMoc(payload)
      showSuccess('MOC draft saved successfully.')
    }
    emit('saved')
  } catch (err) {
    console.error('[MOC] Save draft failed:', err)
    showError(mocStore.error || err?.message || 'Failed to save MOC draft.')
  } finally {
    isSaving.value  = false
    savingMode.value = null
  }
}

const completeWithVendorAndPO = async () => {
  if (!selectedVendorId.value) {
    showError('Pilih vendor terlebih dahulu sebelum membuat PO.')
    return
  }
  if (!validateVendorData(true)) return

  // If vendor differs from SAW winner, show confirmation
  if (sawWinner.value && selectedVendorId.value !== sawWinner.value.vendorId) {
    const result = await Swal.fire({
      title: 'Konfirmasi Pilihan Vendor',
      html: `Vendor yang Anda pilih berbeda dari rekomendasi SAW.<br>Apakah Anda yakin ingin melanjutkan?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, lanjutkan',
      cancelButtonText: 'Batal',
    })
    if (!result.isConfirmed) return
  }

  isSaving.value = true
  savingMode.value = 'complete'
  mocStore.clearError()
  try {
    // 1. Save MOC as Completed with selected vendor
    const payload = buildPayload('Completed')
    payload.selectedVendorId = selectedVendorId.value

    let savedMoc
    if (props.isEditMode) {
      savedMoc = await mocStore.updateMoc(props.mocId, payload)
    } else {
      savedMoc = await mocStore.createMoc(payload)
    }

    const mocId = savedMoc?.id ?? (props.isEditMode ? props.mocId : null)

    if (!mocId) {
      throw new Error('MOC ID tidak ditemukan setelah disimpan. Coba lagi.')
    }

    // 2. Find the selected vendor's data from the matrix
    const selectedVendorData = wizardData.value.vendors.find(
      (v) => Number(v.vendorId) === Number(selectedVendorId.value)
    )

    // 3. Get vesselRequestItemId from saved MOC or wizard
    const vesselRequestItemId = savedMoc?.vesselRequestItemId || wizardData.value.vesselRequestItemId

    if (!vesselRequestItemId) {
      throw new Error('Request item tidak ditemukan. Coba lagi.')
    }

    // 4. Auto-create PO immediately
    if (selectedVendorData) {
      await createPurchaseOrder({
        mocId,
        vendorId: Number(selectedVendorId.value),
        vesselRequestItemId: Number(vesselRequestItemId),
        unitPrice: Number(selectedVendorData.unitPrice) || 0,
        qty: Number(selectedVendorData.availableQty) || 1,
        notes: null,
      })
      showSuccess('MOC selesai dan Purchase Order berhasil dibuat!')
    } else {
      showSuccess('MOC selesai! Melanjutkan ke Purchase Order...')
    }

    emit('saved')
    emit('go-to-po', mocId)
  } catch (err) {
    console.error('[MOC] Complete with PO failed:', err)
    showError(mocStore.error || err?.message || 'Gagal menyelesaikan MOC.')
  } finally {
    isSaving.value = false
    savingMode.value = null
  }
}
</script>

<style scoped>
select:focus, input:focus, textarea:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
}
</style>