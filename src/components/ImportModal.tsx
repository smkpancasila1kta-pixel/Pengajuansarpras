import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { ProcurementItem } from '../types/procurement';
import { parseUploadedSpreadsheet, downloadTemplateExcel } from '../utils/excelExport';
import { formatRupiah } from '../utils/formatters';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (items: ProcurementItem[], mode: 'append' | 'replace') => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportData,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<ProcurementItem[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setLoading(true);

    try {
      const parsed = await parseUploadedSpreadsheet(selectedFile);
      setPreviewItems(parsed);
    } catch (err: any) {
      setError(err?.message || 'Gagal memproses file spreadsheet.');
      setPreviewItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    setFile(droppedFile);
    setError(null);
    setLoading(true);

    try {
      const parsed = await parseUploadedSpreadsheet(droppedFile);
      setPreviewItems(parsed);
    } catch (err: any) {
      setError(err?.message || 'Gagal membaca file spreadsheet.');
      setPreviewItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (previewItems.length === 0) return;
    onImportData(previewItems, importMode);
    onClose();
    // Reset state
    setFile(null);
    setPreviewItems([]);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-emerald-800 text-white">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            <h3 className="font-semibold text-base">Import Data dari File Excel / CSV</h3>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1 rounded hover:bg-emerald-700/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-lg p-6 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-emerald-50/30"
            onClick={() => document.getElementById('excel-file-input')?.click()}
          >
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">
              {file ? file.name : 'Klik atau seret file spreadsheet ke sini'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Mendukung format Microsoft Excel (.xlsx, .xls) dan CSV (.csv)
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadTemplateExcel();
                }}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-medium underline inline-flex items-center gap-1 cursor-pointer"
              >
                Unduh Template Excel Contoh
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-4 text-slate-600 text-sm">
              <div className="inline-block animate-spin w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full mb-1" />
              <p>Membaca dan memvalidasi file...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Format file belum sesuai</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Preview Extracted Data */}
          {previewItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Berhasil mengenali {previewItems.length} baris pengajuan</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-emerald-600"
                    />
                    <span>Tambahkan ke data saat ini</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-emerald-600"
                    />
                    <span className="text-rose-700 font-medium">Gantikan semua data</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded max-h-48 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-1.5">No</th>
                      <th className="p-1.5">Nama Barang / Jasa</th>
                      <th className="p-1.5">Divisi</th>
                      <th className="p-1.5">Qty</th>
                      <th className="p-1.5 text-right">Total (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewItems.slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-1.5 text-slate-400">{idx + 1}</td>
                        <td className="p-1.5 font-medium">{item.itemName}</td>
                        <td className="p-1.5 text-slate-600">{item.unit}</td>
                        <td className="p-1.5">{item.quantity} {item.unitMeasure}</td>
                        <td className="p-1.5 text-right font-mono">{formatRupiah(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewItems.length > 5 && (
                <p className="text-[11px] text-slate-500 text-right italic">
                  ...dan {previewItems.length - 5} baris lainnya
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-200 rounded font-medium cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={previewItems.length === 0}
            className={`px-4 py-1.5 text-xs rounded font-semibold text-white shadow-xs cursor-pointer ${
              previewItems.length > 0
                ? 'bg-emerald-700 hover:bg-emerald-800'
                : 'bg-slate-300 cursor-not-allowed text-slate-500'
            }`}
          >
            Impor ke Spreadsheet ({previewItems.length} Data)
          </button>
        </div>
      </div>
    </div>
  );
};
