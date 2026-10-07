import React from 'react';
import { ProcurementItem } from '../types/procurement';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Package, 
  Wrench, 
  Layers
} from 'lucide-react';

interface SummaryCardsProps {
  items: ProcurementItem[];
  filteredItems: ProcurementItem[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ items, filteredItems }) => {
  // Aggregate stats from filtered items
  const totalBudget = filteredItems.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
  const totalQuantity = filteredItems.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  
  const approvedItems = filteredItems.filter(i => i.status === 'Disetujui' || i.status === 'Proses Beli' || i.status === 'Selesai');
  const approvedBudget = approvedItems.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

  const pendingItems = filteredItems.filter(i => i.status === 'Diajukan' || i.status === 'Draft');
  const pendingBudget = pendingItems.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

  const rejectedItems = filteredItems.filter(i => i.status === 'Ditolak');
  const rejectedBudget = rejectedItems.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

  const barangCount = filteredItems.filter(i => i.type === 'Barang').length;
  const jasaCount = filteredItems.filter(i => i.type === 'Jasa').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3 bg-slate-50 border-b border-slate-200">
      {/* Total Anggaran */}
      <div className="bg-white p-3 rounded-md border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Estimasi</span>
          <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-base font-bold text-slate-800 truncate" title={formatRupiah(totalBudget)}>
            {formatRupiah(totalBudget)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <span className="font-medium text-slate-700">{filteredItems.length}</span> pengajuan ({formatNumber(totalQuantity)} unit/vol)
          </div>
        </div>
      </div>

      {/* Disetujui / Realisasi */}
      <div className="bg-white p-3 rounded-md border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Disetujui / Jalan</span>
          <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-base font-bold text-emerald-700 truncate" title={formatRupiah(approvedBudget)}>
            {formatRupiah(approvedBudget)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            <span className="font-semibold text-emerald-600">{approvedItems.length}</span> item disetujui
          </div>
        </div>
      </div>

      {/* Menunggu Persetujuan */}
      <div className="bg-white p-3 rounded-md border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Menunggu / Draft</span>
          <div className="w-7 h-7 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-base font-bold text-amber-700 truncate" title={formatRupiah(pendingBudget)}>
            {formatRupiah(pendingBudget)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            <span className="font-semibold text-amber-600">{pendingItems.length}</span> item dalam antrean
          </div>
        </div>
      </div>

      {/* Ditolak */}
      <div className="bg-white p-3 rounded-md border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Ditolak</span>
          <div className="w-7 h-7 rounded bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-base font-bold text-rose-700 truncate" title={formatRupiah(rejectedBudget)}>
            {formatRupiah(rejectedBudget)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            <span className="font-semibold text-rose-600">{rejectedItems.length}</span> item tidak disetujui
          </div>
        </div>
      </div>

      {/* Komposisi Barang vs Jasa */}
      <div className="bg-white p-3 rounded-md border border-slate-200 shadow-xs col-span-2 md:col-span-4 lg:col-span-1 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Komposisi Pengadaan</span>
          <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs bg-slate-100 px-2.5 py-1 rounded">
            <Package className="w-3.5 h-3.5 text-blue-600" />
            <span>Barang: <b className="text-slate-800">{barangCount}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-slate-100 px-2.5 py-1 rounded">
            <Wrench className="w-3.5 h-3.5 text-purple-600" />
            <span>Jasa: <b className="text-slate-800">{jasaCount}</b></span>
          </div>
        </div>
      </div>
    </div>
  );
};
