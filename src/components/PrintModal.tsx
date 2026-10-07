import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ProcurementItem } from '../types/procurement';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { 
  Printer, 
  X, 
  Download, 
  CheckSquare, 
  ListFilter, 
  AlertCircle, 
  FileText,
  CheckCircle2
} from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import { downloadProcurementPDF } from '../utils/pdfExport';
import { OfficialKopSurat } from './OfficialKopSurat';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ProcurementItem[];
  selectedIds?: Set<string>;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  items,
  selectedIds = new Set(),
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  
  // Selection mode: 'selected' or 'all'
  const [printScope, setPrintScope] = useState<'selected' | 'all'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('pbj_custom_school_logo');
    } catch {
      return null;
    }
  });

  // Name for Pemohon / Ketua Divisi / Ka. Konsen
  const [pemohonName, setPemohonName] = useState<string>(() => {
    try {
      return localStorage.getItem('pbj_custom_pemohon_name') || '';
    } catch {
      return '';
    }
  });

  // Fiscal Year state (defaults to 2027)
  const [fiscalYear, setFiscalYear] = useState<string>(() => {
    try {
      return localStorage.getItem('pbj_custom_fiscal_year') || '2027';
    } catch {
      return '2027';
    }
  });

  const handleFiscalYearChange = (year: string) => {
    setFiscalYear(year);
    try {
      localStorage.setItem('pbj_custom_fiscal_year', year);
    } catch (err) {
      console.warn('Could not save fiscal year:', err);
    }
  };

  const handlePemohonNameChange = (val: string) => {
    setPemohonName(val);
    try {
      localStorage.setItem('pbj_custom_pemohon_name', val);
    } catch (err) {
      console.warn('Could not save pemohon name:', err);
    }
  };

  // Whenever modal opens, auto-select 'selected' if user has checked items
  useEffect(() => {
    if (isOpen) {
      if (selectedIds.size > 0) {
        setPrintScope('selected');
      } else {
        setPrintScope('all');
      }
      setSuccessFeedback(null);
    }
  }, [isOpen, selectedIds]);

  // Filter items based on printScope
  const itemsToPrint = useMemo(() => {
    if (printScope === 'selected' && selectedIds.size > 0) {
      return items.filter(item => selectedIds.has(item.id));
    }
    return items;
  }, [items, printScope, selectedIds]);

  if (!isOpen) return null;

  const scopeLabel = printScope === 'selected' 
    ? `Item Pilihan yang Dicentang (${itemsToPrint.length} Item)` 
    : `Seluruh Rekapitulasi (${itemsToPrint.length} Item)`;

  const grandTotal = itemsToPrint.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const totalQty = itemsToPrint.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Action: Print Directly & Download PDF Backup
  const handlePrint = () => {
    if (itemsToPrint.length === 0) return;
    setIsProcessing(true);

    try {
      // 1. Always download the official A4 PDF so the user gets the document even if window.print is blocked by iframe sandbox
      downloadProcurementPDF(itemsToPrint, scopeLabel, currentLogo, pemohonName, fiscalYear);
      setSuccessFeedback('Dokumen PDF resmi berhasil diunduh! Menjalankan perintah cetak...');

      // 2. Attempt browser native print
      setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          console.warn('Native window.print was blocked by sandbox:', e);
        }
        setIsProcessing(false);
      }, 400);
    } catch (err) {
      console.error('Error generating document:', err);
      // Fallback
      window.print();
      setIsProcessing(false);
    }
  };

  // Action: Download PDF Only
  const handleDownloadPDF = () => {
    if (itemsToPrint.length === 0) return;
    try {
      downloadProcurementPDF(itemsToPrint, scopeLabel, currentLogo, pemohonName, fiscalYear);
      setSuccessFeedback('Berkas PDF resmi Formulir PBJ berhasil diunduh (siap dicetak pada kertas A4).');
      setTimeout(() => setSuccessFeedback(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Actions (Excluded in @media print) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-800 text-white print:hidden flex-wrap gap-2">
          {/* Title & Scope Selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-sm">Pratinjau Cetak Lembar Pengajuan</h3>
            </div>

            {/* Print Scope Switcher */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-md text-xs border border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium px-1.5 hidden sm:inline">
                Cetak:
              </span>
              <button
                type="button"
                onClick={() => setPrintScope('selected')}
                disabled={selectedIds.size === 0}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  printScope === 'selected'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : selectedIds.size === 0
                    ? 'text-slate-500 cursor-not-allowed opacity-50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={selectedIds.size === 0 ? 'Centang item di tabel untuk mengaktifkan opsi ini' : 'Cetak hanya item yang dicentang'}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Yang Dicentang ({selectedIds.size})</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintScope('all')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  printScope === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Cetak seluruh item pengajuan pada tabel"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Semua Baris ({items.length})</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={itemsToPrint.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              title="Unduh format PDF A4 Resmi siap cetak"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Unduh PDF (A4)</span>
            </button>

            {/* Export Excel Button */}
            <button
              onClick={() => exportToExcel(itemsToPrint)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              title="Download item yang tampil ke Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Simpan Excel</span>
            </button>

            {/* Main Cetak Sekarang Button */}
            <button
              onClick={handlePrint}
              disabled={itemsToPrint.length === 0 || isProcessing}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold shadow-xs cursor-pointer transition-colors ${
                itemsToPrint.length > 0 && !isProcessing
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-600 text-slate-300 cursor-not-allowed'
              }`}
              title="Cetak formulir pengajuan dan unduh dokumen resmi"
            >
              <Printer className={`w-3.5 h-3.5 ${isProcessing ? 'animate-bounce' : ''}`} />
              <span>{isProcessing ? 'Memproses Cetak...' : 'Cetak Sekarang (Print)'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Feedback Banner */}
        {successFeedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 text-xs text-emerald-800 flex items-center gap-2 print:hidden animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successFeedback}</span>
          </div>
        )}

        {/* Notice if selected mode is active with no items */}
        {printScope === 'selected' && selectedIds.size === 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-xs text-amber-800 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Belum ada item yang dicentang di tabel. Silakan kembali ke lembar kerja dan centang baris yang ingin dicetak, atau pilih &quot;Semua Baris&quot;.</span>
            </div>
            <button
              onClick={() => setPrintScope('all')}
              className="text-xs font-bold text-amber-900 underline ml-2 cursor-pointer"
            >
              Tampilkan Semua Baris
            </button>
          </div>
        )}

        {/* Printable Sheet View */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 print:bg-white print:p-0">
          <div
            id="spb-printable-sheet"
            ref={printRef}
            className="bg-white p-8 border border-slate-200 shadow-sm rounded-sm mx-auto max-w-[210mm] print:border-none print:shadow-none print:p-0"
          >
            {/* Kop Surat Resmi SMK PANCASILA 1 KUTOARJO */}
            <OfficialKopSurat
              onLogoChange={setCurrentLogo}
              fiscalYear={fiscalYear}
              onFiscalYearChange={handleFiscalYearChange}
            />

            {/* Meta Information */}
            <div className="grid grid-cols-2 text-xs text-slate-700 mb-4 gap-2">
              <div>
                <p><span className="font-semibold text-slate-900">Tanggal Dokumen:</span> {todayFormatted}</p>
                <p>
                  <span className="font-semibold text-slate-900">Total Item Pengajuan:</span>{' '}
                  <span className="font-bold text-slate-800">{itemsToPrint.length}</span> Barang / Jasa
                </p>
              </div>
              <div className="text-right">
                <p>
                  <span className="font-semibold text-slate-900">Cakupan Cetak:</span>{' '}
                  <span className={`font-semibold ${printScope === 'selected' ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {scopeLabel}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Total Estimasi Anggaran:</span>{' '}
                  <strong className="text-emerald-800 text-sm font-mono">{formatRupiah(grandTotal)}</strong>
                </p>
              </div>
            </div>

            {/* Official Procurement Table */}
            <div className="overflow-x-auto mb-6">
              {itemsToPrint.length === 0 ? (
                <div className="text-center py-12 text-slate-400 border border-dashed border-slate-300 rounded">
                  <p className="text-sm font-semibold">Tidak ada baris data untuk dicetak.</p>
                  <p className="text-xs mt-1">Pilih &quot;Semua Baris&quot; atau centang baris di tabel spreadsheet.</p>
                </div>
              ) : (
                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-semibold text-center border-b border-slate-300">
                      <th className="border border-slate-300 p-1.5 w-7">No</th>
                      <th className="border border-slate-300 p-1.5">Divisi Pemohon</th>
                      <th className="border border-slate-300 p-1.5">Nama Barang / Jasa & Spesifikasi</th>
                      <th className="border border-slate-300 p-1.5 w-12">Qty</th>
                      <th className="border border-slate-300 p-1.5 w-14">Satuan</th>
                      <th className="border border-slate-300 p-1.5 w-24">Harga Satuan</th>
                      <th className="border border-slate-300 p-1.5 w-28">Total Biaya</th>
                      <th className="border border-slate-300 p-1.5 w-16">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsToPrint.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-200">
                        <td className="border border-slate-300 p-1.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="border border-slate-300 p-1.5 font-medium text-slate-800">{item.unit}</td>
                        <td className="border border-slate-300 p-1.5">
                          <div className="font-semibold text-slate-900">{item.itemName}</div>
                          {item.spec && <div className="text-[10px] text-slate-500 italic mt-0.5">{item.spec}</div>}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono">{formatNumber(item.quantity)}</td>
                        <td className="border border-slate-300 p-1.5 text-center text-slate-600">{item.unitMeasure}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">{formatRupiah(item.unitPrice)}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono font-semibold text-slate-900">{formatRupiah(item.totalPrice)}</td>
                        <td className="border border-slate-300 p-1.5 text-center">
                          <span className="text-[10px] font-semibold text-slate-700">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                      <td colSpan={3} className="border border-slate-300 p-2 text-right uppercase">
                        GRAND TOTAL ESTIMASI KEBUTUHAN:
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-mono">
                        {formatNumber(totalQty)}
                      </td>
                      <td className="border border-slate-300 p-2 text-center text-slate-500 font-normal">
                        Item
                      </td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2 text-right font-mono text-emerald-900 text-xs font-bold">
                        {formatRupiah(grandTotal)}
                      </td>
                      <td className="border border-slate-300 p-2"></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Approval Signature Block */}
            <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs text-slate-800 break-inside-avoid">
              <div className="flex flex-col items-center">
                <p className="font-medium text-slate-600">Pemohon / Penanggung Jawab,</p>
                <div className="h-16" />

                {/* Editable / Typed Name Container */}
                <div className="w-full max-w-[210px] flex flex-col items-center">
                  {/* On paper print (@media print): show clean underlined text or dotted line */}
                  <div className="hidden print:block font-bold underline text-slate-900 text-xs">
                    {pemohonName.trim() ? pemohonName : '( ..................................... )'}
                  </div>

                  {/* On screen preview: interactive inline typing field */}
                  <div className="print:hidden w-full relative">
                    <input
                      type="text"
                      value={pemohonName}
                      onChange={(e) => handlePemohonNameChange(e.target.value)}
                      placeholder="( Klik untuk ketik nama... )"
                      className="w-full text-center font-bold text-slate-900 border-b border-dashed border-slate-400 hover:border-emerald-600 focus:border-emerald-700 focus:bg-emerald-50/50 rounded-none px-1 py-0.5 text-xs outline-none transition-colors placeholder:text-slate-400 placeholder:font-normal"
                      title="Klik untuk mengetik nama Pemohon / Ketua Divisi / Ka. Konsen"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 mt-1">Ketua Divisi / Ka. Konsen</p>
              </div>

              <div>
                <p className="font-medium text-slate-600">Verifikasi Sarpras & Pengadaan,</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">Brian Wicaksono, M.Pd.</p>
                <p className="text-[10px] text-slate-500">Wakasek Sarana & Prasarana</p>
              </div>

              <div>
                <p className="font-medium text-slate-600">Menyetujui,</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">Septi Endah Parwati, M.Pd.</p>
                <p className="text-[10px] text-slate-500">Kepala Sekolah</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
