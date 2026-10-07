import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  HelpCircle, 
  Check, 
  Sparkles, 
  Info, 
  Download,
  Plus,
  Printer
} from 'lucide-react';

interface HeaderBarProps {
  onOpenNewModal: () => void;
  onExportExcel: () => void;
  onOpenPrint?: () => void;
  hasUnsavedChanges: boolean;
  itemCount: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenNewModal,
  onExportExcel,
  onOpenPrint,
  hasUnsavedChanges,
  itemCount,
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <header className="bg-emerald-800 text-white border-b border-emerald-900 select-none">
      <div className="px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
        {/* App Title & Excel Icon */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-950/40 border border-emerald-600/50 flex items-center justify-center font-bold font-mono text-emerald-300 shadow-inner">
            X
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-wide">
                E-PENGADAAN SPREADSHEET
              </h1>
              <span className="text-[10px] bg-emerald-900/80 text-emerald-200 border border-emerald-600/50 px-1.5 py-0.2 rounded font-mono">
                v2.6 XLS Grid
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/90 font-light hidden sm:block">
              Aplikasi Pendataan Pengajuan Belanja Barang & Jasa • Mode Input Grid MS Excel
            </p>
          </div>
        </div>

        {/* Status indicator & Shortcuts */}
        <div className="flex items-center gap-2.5">
          {/* Auto-save indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-emerald-200 bg-emerald-900/60 px-2.5 py-1 rounded border border-emerald-700/50">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tersimpan otomatis</span>
          </div>

          {/* Shortcut guide button */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="flex items-center gap-1 text-[11px] bg-emerald-700/70 hover:bg-emerald-700 text-white px-2 py-1 rounded transition-colors cursor-pointer"
            title="Lihat Petunjuk Pintasan Keyboard"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">Pintasan Excel</span>
          </button>

          {/* Quick Add Form button */}
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1 text-xs bg-white text-emerald-900 hover:bg-emerald-50 font-semibold px-2.5 py-1 rounded shadow-xs transition-colors cursor-pointer"
            title="Buka Form Tambah Pengajuan"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-800" />
            <span>Form Input</span>
          </button>

          {/* Quick Print / SPB button */}
          {onOpenPrint && (
            <button
              onClick={onOpenPrint}
              className="flex items-center gap-1 text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-medium px-2.5 py-1 rounded shadow-xs transition-colors cursor-pointer border border-emerald-500/50"
              title="Cetak Formulir Pengajuan Belanja (SPB) / Unduh PDF"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-200" />
              <span>Cetak / SPB</span>
            </button>
          )}
        </div>
      </div>

      {/* Keyboard shortcuts popup modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white text-slate-800 rounded-lg shadow-xl max-w-md w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
              <h3 className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                Pintasan Navigasi Spreadsheet (MS Excel)
              </h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-slate-700">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="font-medium">Navigasi Antar Sel:</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                  ↑ ↓ ← →
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="font-medium">Sel Berikutnya / Sebelumnya:</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                  Tab / Shift + Tab
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="font-medium">Mulai Edit Sel / Selesai Edit:</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                  Enter atau Klik Ganda
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="font-medium">Batalkan Edit:</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                  Esc
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="font-medium">Hapus Isi Sel:</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                  Delete / Backspace
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="font-medium">Tambah Baris Baru:</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                  Ctrl + N
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="font-medium">Kalkulasi Otomatis Total:</span>
                <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  = Volume x Harga Satuan
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowShortcuts(false)}
                className="px-3 py-1.5 bg-emerald-800 text-white rounded font-semibold text-xs hover:bg-emerald-900 cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
