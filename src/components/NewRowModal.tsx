import React, { useState } from 'react';
import { ProcurementItem, ProcurementType, ProcurementPriority, ProcurementStatus } from '../types/procurement';
import { AVAILABLE_UNITS, AVAILABLE_CATEGORIES, AVAILABLE_UNITS_MEASURE } from '../data/initialData';
import { formatRupiah } from '../utils/formatters';
import { PlusCircle, X } from 'lucide-react';

interface NewRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: ProcurementItem) => void;
  nextCode: string;
}

export const NewRowModal: React.FC<NewRowModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  nextCode,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    code: nextCode,
    date: today,
    unit: AVAILABLE_UNITS[0] || 'Kakonsen TKR',
    type: 'Barang' as ProcurementType,
    category: AVAILABLE_CATEGORIES[0] || 'ATK & Percetakan',
    itemName: '',
    spec: '',
    quantity: 1,
    unitMeasure: 'Unit',
    unitPrice: 0,
    priority: 'Sedang' as ProcurementPriority,
    status: 'Diajukan' as ProcurementStatus,
    notes: '',
    vendor: '',
  });

  if (!isOpen) return null;

  const totalCalculated = formData.quantity * formData.unitPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName.trim()) return;

    const newItem: ProcurementItem = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code: formData.code || nextCode,
      date: formData.date || today,
      unit: formData.unit,
      type: formData.type,
      category: formData.category,
      itemName: formData.itemName.trim(),
      spec: formData.spec.trim(),
      quantity: Number(formData.quantity) || 1,
      unitMeasure: formData.unitMeasure,
      unitPrice: Number(formData.unitPrice) || 0,
      totalPrice: totalCalculated,
      priority: formData.priority,
      status: formData.status,
      notes: formData.notes.trim(),
      vendor: formData.vendor.trim(),
    };

    onAdd(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-emerald-800 text-white">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-300" />
            <h3 className="font-semibold text-sm">Tambah Pengajuan Belanja Barang & Jasa</h3>
          </div>
          <button onClick={onClose} className="text-emerald-100 hover:text-white p-1 rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Pengajuan</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jenis Pengadaan</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ProcurementType })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800"
              >
                <option value="Barang">Barang</option>
                <option value="Jasa">Jasa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Divisi Pemohon</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800"
              >
                {AVAILABLE_UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori Belanja</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800"
              >
                {AVAILABLE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Barang / Jasa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Kertas HVS A4 75gr PaperOne, Jasa Servis AC"
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Spesifikasi & Uraian Teknis</label>
            <textarea
              rows={2}
              placeholder="Spesifikasi detail, merek, tipe, atau cakupan pekerjaan..."
              value={formData.spec}
              onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Volume (Qty)</label>
              <input
                type="number"
                min="1"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
              <select
                value={formData.unitMeasure}
                onChange={(e) => setFormData({ ...formData, unitMeasure: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800"
              >
                {AVAILABLE_UNITS_MEASURE.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Harga Satuan (Rp)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 font-mono"
                required
              />
            </div>

            <div className="md:col-span-3 pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="font-semibold text-slate-600">Total Estimasi Otomatis (Qty x Harga):</span>
              <span className="text-sm font-bold text-emerald-800 font-mono">{formatRupiah(totalCalculated)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prioritas</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as ProcurementPriority })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800"
              >
                <option value="Tinggi">Tinggi / Mendesak</option>
                <option value="Sedang">Sedang</option>
                <option value="Rendah">Rendah</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Awal</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProcurementStatus })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800"
              >
                <option value="Draft">Draft</option>
                <option value="Diajukan">Diajukan</option>
                <option value="Disetujui">Disetujui</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rekomendasi Toko / Rekanan</label>
              <input
                type="text"
                placeholder="Nama toko, distributor, atau teknisi"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Catatan / Alasan Kebutuhan</label>
              <input
                type="text"
                placeholder="Misal: Persiapan ujian, darurat AC bocor"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold shadow-xs cursor-pointer"
            >
              Simpan ke Lembar Kerja
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
