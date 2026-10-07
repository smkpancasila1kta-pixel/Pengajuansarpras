import React from 'react';
import { 
  FileSpreadsheet, 
  FileDown, 
  Upload, 
  Plus, 
  Trash2, 
  Copy, 
  CheckCircle, 
  XCircle, 
  Filter, 
  RefreshCw, 
  Printer, 
  FileQuestion,
  Search,
  Sparkles,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { FilterState, ProcurementStatus } from '../types/procurement';
import { AVAILABLE_UNITS, AVAILABLE_CATEGORIES } from '../data/initialData';

interface ExcelToolbarProps {
  onAddRow: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onBatchStatusChange: (status: ProcurementStatus) => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onOpenImport: () => void;
  onDownloadTemplate: () => void;
  onPrint: () => void;
  onResetData: () => void;
  selectedCount: number;
  totalCount: number;
  filteredCount: number;
  filterState: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilter: () => void;
  isFilterExpanded: boolean;
  setIsFilterExpanded: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const ExcelToolbar: React.FC<ExcelToolbarProps> = ({
  onAddRow,
  onDeleteSelected,
  onDuplicateSelected,
  onBatchStatusChange,
  onExportExcel,
  onExportCSV,
  onOpenImport,
  onDownloadTemplate,
  onPrint,
  onResetData,
  selectedCount,
  totalCount,
  filteredCount,
  filterState,
  onFilterChange,
  onResetFilter,
  isFilterExpanded,
  setIsFilterExpanded,
}) => {
  const hasActiveFilters = 
    filterState.search !== '' ||
    filterState.type !== 'all' ||
    filterState.status !== 'all' ||
    filterState.unit !== 'all' ||
    filterState.category !== 'all' ||
    filterState.priority !== 'all';

  return (
    <div className="bg-white border-b border-slate-200">
      {/* Top Excel Ribbon Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-100/80 border-b border-slate-200">
        {/* Left Action Group: Row Management & Batch */}
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Add Row Button */}
          <button
            onClick={onAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Tambah Baris Baru ke Lembar Kerja (Ctrl+N)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Baris</span>
          </button>

          <div className="h-5 w-px bg-slate-300 mx-1" />

          {/* Action on selected rows */}
          <button
            onClick={onDuplicateSelected}
            disabled={selectedCount === 0}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors border ${
              selectedCount > 0 
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 cursor-pointer shadow-xs' 
                : 'bg-slate-100 text-slate-400 border-transparent cursor-not-allowed'
            }`}
            title="Duplikasi baris yang dicentang"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplikat {selectedCount > 0 && `(${selectedCount})`}</span>
          </button>

          <button
            onClick={onDeleteSelected}
            disabled={selectedCount === 0}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors border ${
              selectedCount > 0 
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 cursor-pointer shadow-xs active:scale-95' 
                : 'bg-slate-100 text-slate-400 border-transparent cursor-not-allowed'
            }`}
            title={selectedCount > 0 ? `Hapus ${selectedCount} baris yang dicentang` : 'Centang kotak pada baris untuk mengaktifkan tombol hapus'}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Hapus Baris {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
          </button>

          {/* Batch Status dropdown when selected */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-1 rounded border border-emerald-200 text-xs">
              <span className="font-medium">Ubah Status ({selectedCount}):</span>
              <button
                onClick={() => onBatchStatusChange('Disetujui')}
                className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium cursor-pointer"
              >
                Setujui
              </button>
              <button
                onClick={() => onBatchStatusChange('Proses Beli')}
                className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium cursor-pointer"
              >
                Proses
              </button>
              <button
                onClick={() => onBatchStatusChange('Ditolak')}
                className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium cursor-pointer"
              >
                Tolak
              </button>
            </div>
          )}

          <div className="h-5 w-px bg-slate-300 mx-1 hidden sm:block" />

          {/* Toggle Filter Panel Button */}
          <button
            onClick={() => setIsFilterExpanded(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
              hasActiveFilters 
                ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold' 
                : isFilterExpanded 
                  ? 'bg-slate-200 text-slate-800 border-slate-300' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-slate-600" />
            <span>Filter & Pencarian</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Right Action Group: Export, Import, Print */}
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Export to Excel (.xlsx) */}
          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Download spreadsheet Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel (.xlsx)</span>
          </button>

          {/* Export to CSV */}
          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs font-medium border border-slate-300 shadow-xs transition-colors cursor-pointer"
            title="Download format CSV"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          {/* Import File */}
          <button
            onClick={onOpenImport}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs font-medium border border-slate-300 shadow-xs transition-colors cursor-pointer"
            title="Unggah dan masukkan data dari file Excel / CSV"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Import File</span>
          </button>

          {/* Print / Lembar SPB */}
          <button
            onClick={onPrint}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border shadow-xs transition-colors cursor-pointer ${
              selectedCount > 0 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold hover:bg-emerald-100' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
            title={selectedCount > 0 ? `Cetak dokumen pengajuan untuk ${selectedCount} baris yang dicentang` : 'Cetak Formulir / Lembar Pengajuan Resmi'}
          >
            <Printer className={`w-3.5 h-3.5 ${selectedCount > 0 ? 'text-emerald-700' : 'text-slate-600'}`} />
            <span>Cetak / SPB {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
          </button>

          {/* Template helper */}
          <button
            onClick={onDownloadTemplate}
            className="inline-flex items-center gap-1 p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
            title="Unduh Template Excel Kosong"
          >
            <FileQuestion className="w-4 h-4" />
          </button>

          {/* Reset sample data */}
          <button
            onClick={onResetData}
            className="inline-flex items-center gap-1 p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
            title="Muat Ulang Contoh Data Awal"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Filter Panel */}
      {isFilterExpanded && (
        <div className="p-3 bg-slate-50/90 border-b border-slate-200 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Pencarian Kata Kunci
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama barang, kode, spec, vendor..."
                  value={filterState.search}
                  onChange={(e) => onFilterChange({ search: e.target.value })}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>
            </div>

            {/* Filter Jenis: Barang / Jasa */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Jenis Pengadaan
              </label>
              <select
                value={filterState.type}
                onChange={(e) => onFilterChange({ type: e.target.value })}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              >
                <option value="all">Semua Jenis</option>
                <option value="Barang">Barang</option>
                <option value="Jasa">Jasa</option>
              </select>
            </div>

            {/* Filter Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Status Pengajuan
              </label>
              <select
                value={filterState.status}
                onChange={(e) => onFilterChange({ status: e.target.value })}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="Draft">Draft</option>
                <option value="Diajukan">Diajukan</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Proses Beli">Proses Beli</option>
                <option value="Selesai">Selesai</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>

            {/* Filter Unit Kerja */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Divisi Pemohon
              </label>
              <select
                value={filterState.unit}
                onChange={(e) => onFilterChange({ unit: e.target.value })}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              >
                <option value="all">Semua Divisi</option>
                {AVAILABLE_UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Filter Prioritas */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Prioritas
              </label>
              <select
                value={filterState.priority}
                onChange={(e) => onFilterChange({ priority: e.target.value })}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              >
                <option value="all">Semua Prioritas</option>
                <option value="Tinggi">Tinggi / Urgent</option>
                <option value="Sedang">Sedang</option>
                <option value="Rendah">Rendah</option>
              </select>
            </div>
          </div>

          {/* Filter Status summary and clear */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800">
                Menampilkan {filteredCount} dari {totalCount} baris
              </span>
              {hasActiveFilters && (
                <span className="text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                  Filter aktif
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={onResetFilter}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
