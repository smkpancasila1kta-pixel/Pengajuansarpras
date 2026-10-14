import React, { useState } from 'react';
import { 
  Smartphone, 
  Laptop, 
  Check, 
  Copy, 
  RefreshCw, 
  X, 
  Cloud, 
  ShieldCheck, 
  ArrowRight,
  Share2
} from 'lucide-react';
import { DEFAULT_SYNC_CODE } from '../services/procurementSync';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSyncEnabled: boolean;
  syncCode: string;
  onToggleSync: (enabled: boolean) => void;
  onUpdateSyncCode: (newCode: string) => void;
  onForceSyncNow: () => void;
  isSyncing: boolean;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  isSyncEnabled,
  syncCode,
  onToggleSync,
  onUpdateSyncCode,
  onForceSyncNow,
  isSyncing,
}) => {
  const [inputCode, setInputCode] = useState(syncCode || DEFAULT_SYNC_CODE);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!isOpen) return null;

  const handleSaveCode = () => {
    const formatted = inputCode.trim().toUpperCase() || DEFAULT_SYNC_CODE;
    setInputCode(formatted);
    onUpdateSyncCode(formatted);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inputCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('sync', inputCode);
    navigator.clipboard.writeText(url.toString());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 text-slate-800 text-xs">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center text-emerald-200">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide">
                Sinkronisasi 2 Perangkat (Real-time Cloud)
              </h2>
              <p className="text-[11px] text-emerald-200/90 font-light">
                Hubungkan Laptop & HP agar data pengadaan selalu otomatis terupdate
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-emerald-700/80 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Main Activation Toggle */}
          <div className={`p-4 rounded-lg border transition-all ${
            isSyncEnabled 
              ? 'bg-emerald-50/70 border-emerald-300' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm flex items-center gap-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                    isSyncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`} />
                  <span>
                    Status Sinkronisasi: {isSyncEnabled ? 'AKTIF (Terhubung Cloud)' : 'NONAKTIF'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isSyncEnabled 
                    ? 'Data otomatis diperbarui saat Anda menambah, mengedit, atau menghapus permanen.' 
                    : 'Aktifkan agar data tersinkronisasi antar perangkat secara otomatis.'}
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => onToggleSync(!isSyncEnabled)}
                className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isSyncEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isSyncEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sync Code Section */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2.5">
            <label className="block font-semibold text-slate-700">
              Kode Sinkronisasi (Pairing Room Code):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                onBlur={handleSaveCode}
                placeholder="Contoh: SMK-PBJ-2027"
                className="flex-1 font-mono uppercase font-bold text-slate-900 bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded transition-colors cursor-pointer"
                title="Salin Kode Sinkronisasi"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Gunakan kode yang sama pada kedua perangkat untuk menghubungkan data yang sama.
            </p>
          </div>

          {/* Quick Connect Guide (2 Devices) */}
          <div className="border border-emerald-200 bg-emerald-50/50 p-4 rounded-lg space-y-2">
            <h3 className="font-bold text-emerald-950 flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-emerald-700" />
              <span>Cara Menghubungkan di Perangkat Kedua (HP / Laptop):</span>
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed text-[11px]">
              <li>
                Buka tautan aplikasi ini di HP atau Laptop kedua Anda.
              </li>
              <li>
                Klik tombol <span className="font-semibold text-emerald-900 bg-emerald-200/80 px-1 py-0.5 rounded">Sinkron 2 Device</span> di sudut kanan atas.
              </li>
              <li>
                Pastikan tombol diaktifkan dan Kode Sinkronisasi sama dengan: <strong className="font-mono text-emerald-900 bg-white px-1.5 py-0.5 rounded border border-emerald-300">{inputCode}</strong>.
              </li>
              <li>
                <strong>Selesai!</strong> Perubahan data (tambah, edit nilai sel, dan hapus permanen) akan otomatis tersinkronisasi secara langsung di kedua perangkat.
              </li>
            </ol>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 text-[11px] bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-medium px-3 py-1.5 rounded transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{linkCopied ? '✓ Tautan Otomatis Tersalin!' : 'Salin Tautan Cepat untuk Dibuka di HP'}</span>
              </button>
            </div>
          </div>

          {/* Manual Force Sync Button */}
          {isSyncEnabled && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Koneksi Firebase Firestore Aktif
              </span>
              <button
                type="button"
                onClick={onForceSyncNow}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Kirim / Perbarui Sekarang'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded text-xs transition-colors cursor-pointer shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
