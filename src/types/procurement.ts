export type ProcurementType = 'Barang' | 'Jasa';

export type ProcurementPriority = 'Tinggi' | 'Sedang' | 'Rendah';

export type ProcurementStatus = 
  | 'Draft' 
  | 'Diajukan' 
  | 'Disetujui' 
  | 'Proses Beli' 
  | 'Selesai' 
  | 'Ditolak';

export interface ProcurementItem {
  id: string;
  code: string;               // e.g. PBJ-2026-001
  date: string;               // YYYY-MM-DD
  unit: string;               // Unit / Divisi Pemohon
  type: ProcurementType;      // Barang / Jasa
  category: string;           // Kategori Belanja
  itemName: string;           // Nama Barang / Jasa
  spec: string;               // Spesifikasi & Deskripsi
  quantity: number;           // Volume
  unitMeasure: string;        // Satuan (Pcs, Rim, Unit, etc)
  unitPrice: number;          // Harga Satuan (Rp)
  totalPrice: number;         // Total Estimasi (Rp)
  priority: ProcurementPriority; // Skala Prioritas
  status: ProcurementStatus;  // Status Pengajuan
  notes: string;              // Catatan tambahan / Alasan
  vendor?: string;            // Rekomendasi Rekanan / Toko
}

export type GridColumnKey = keyof ProcurementItem | '_select' | '_rowNum';

export interface ColumnDefinition {
  key: keyof ProcurementItem;
  excelCol: string; // A, B, C...
  label: string;
  width: number;
  type: 'text' | 'number' | 'currency' | 'date' | 'select' | 'status' | 'priority' | 'computed';
  options?: string[];
  readOnly?: boolean;
}

export interface FilterState {
  search: string;
  type: string;        // 'all' | 'Barang' | 'Jasa'
  status: string;      // 'all' | ProcurementStatus
  unit: string;        // 'all' | string
  category: string;    // 'all' | string
  priority: string;    // 'all' | ProcurementPriority
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface SortState {
  key: keyof ProcurementItem;
  direction: 'asc' | 'desc';
}
