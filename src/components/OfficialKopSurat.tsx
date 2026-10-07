import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Upload } from 'lucide-react';

const LOGO_STORAGE_KEY = 'pbj_custom_school_logo';
const NPSN_STORAGE_KEY = 'pbj_custom_npsn';
const FISCAL_YEAR_STORAGE_KEY = 'pbj_custom_fiscal_year';

export const SmkPancasilaLogo: React.FC<{ className?: string }> = ({ className = 'w-24 h-28' }) => {
  return (
    <div className="flex flex-col items-center justify-center shrink-0">
      <svg
        viewBox="0 0 200 230"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Pentagon Shield with Red Border */}
        <path
          d="M100 8 L192 72 L157 206 L43 206 L8 72 Z"
          fill="#38bdf8"
          stroke="#dc2626"
          strokeWidth="10"
          strokeLinejoin="round"
        />

        {/* Inner Border Line */}
        <path
          d="M100 18 L182 76 L150 196 L50 196 L18 76 Z"
          fill="#0284c7"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Text ribbon arcs / borders */}
        <text
          x="100"
          y="42"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="13"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
          letterSpacing="1"
        >
          SMK
        </text>

        {/* Golden Rice Stalk (Left) */}
        <path
          d="M60 85 Q45 125 60 165 Q70 145 68 120 Z"
          fill="#fbbf24"
          stroke="#b45309"
          strokeWidth="1"
        />

        {/* Cotton / Chain (Right) */}
        <path
          d="M140 85 Q155 125 140 165 Q130 145 132 120 Z"
          fill="#ffffff"
          stroke="#475569"
          strokeWidth="1"
        />

        {/* Center Cogwheel (Black gear) */}
        <circle cx="100" cy="125" r="32" fill="#1e293b" />
        <circle cx="100" cy="125" r="22" fill="#0284c7" />

        {/* Gear teeth */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <rect
            key={i}
            x="96"
            y="87"
            width="8"
            height="10"
            fill="#1e293b"
            transform={`rotate(${angle} 100 125)`}
          />
        ))}

        {/* Inner Red Core with Car/Vehicle Symbol */}
        <circle cx="100" cy="125" r="14" fill="#dc2626" />
        <path
          d="M93 124 L95 120 L105 120 L107 124 L108 127 L92 127 Z"
          fill="#ffffff"
        />
        <circle cx="95" cy="127" r="1.5" fill="#1e293b" />
        <circle cx="105" cy="127" r="1.5" fill="#1e293b" />

        {/* Torch & Flame (Obor Api) */}
        <path
          d="M100 68 Q106 78 100 92 Q94 78 100 68 Z"
          fill="#ef4444"
          stroke="#fbbf24"
          strokeWidth="2"
        />
        {/* Lightning Bolts */}
        <path d="M82 78 L90 88 L85 90 L93 100" stroke="#facc15" strokeWidth="2.5" fill="none" />
        <path d="M118 78 L110 88 L115 90 L107 100" stroke="#facc15" strokeWidth="2.5" fill="none" />

        {/* White Ribbon: BINA TANI */}
        <path
          d="M62 172 Q100 180 138 172 L142 186 Q100 194 58 186 Z"
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth="1.5"
        />
        <text
          x="100"
          y="183"
          textAnchor="middle"
          fill="#0f172a"
          fontSize="9.5"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
          letterSpacing="0.8"
        >
          BINA TANI
        </text>

        {/* Sub text PURWOREJO */}
        <text
          x="100"
          y="201"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          KAB. PURWOREJO
        </text>
      </svg>
      {/* NPSN Number */}
      <span className="font-mono font-black text-slate-950 text-xs tracking-wider mt-0.5">
        20306060
      </span>
    </div>
  );
};

interface OfficialKopSuratProps {
  onLogoChange?: (logoDataUrl: string | null) => void;
  fiscalYear?: string;
  onFiscalYearChange?: (year: string) => void;
}

export const OfficialKopSurat: React.FC<OfficialKopSuratProps> = ({
  onLogoChange,
  fiscalYear: propFiscalYear,
  onFiscalYearChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingYear, setIsEditingYear] = useState(false);
  
  // Custom logo from localStorage or null (defaults to SVG)
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOGO_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [npsnText] = useState<string>(() => {
    try {
      return localStorage.getItem(NPSN_STORAGE_KEY) || '20306060';
    } catch {
      return '20306060';
    }
  });

  // Fiscal year state (defaults to 2027)
  const [internalFiscalYear, setInternalFiscalYear] = useState<string>(() => {
    try {
      return localStorage.getItem(FISCAL_YEAR_STORAGE_KEY) || '2027';
    } catch {
      return '2027';
    }
  });

  const activeFiscalYear = propFiscalYear !== undefined ? propFiscalYear : internalFiscalYear;

  const handleUpdateYear = (newYear: string) => {
    setInternalFiscalYear(newYear);
    try {
      localStorage.setItem(FISCAL_YEAR_STORAGE_KEY, newYear);
    } catch (err) {
      console.warn('Could not save fiscal year:', err);
    }
    if (onFiscalYearChange) {
      onFiscalYearChange(newYear);
    }
  };

  // Notify parent of initial custom logo
  useEffect(() => {
    if (onLogoChange) {
      onLogoChange(customLogo);
    }
  }, [customLogo, onLogoChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar (JPG, PNG, atau SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomLogo(result);
        try {
          localStorage.setItem(LOGO_STORAGE_KEY, result);
        } catch (err) {
          console.warn('Could not save logo to localStorage:', err);
        }
        if (onLogoChange) {
          onLogoChange(result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomLogo(null);
    try {
      localStorage.removeItem(LOGO_STORAGE_KEY);
    } catch (err) {
      console.warn('Could not remove logo from localStorage:', err);
    }
    if (onLogoChange) {
      onLogoChange(null);
    }
  };

  return (
    <div className="w-full mb-4 select-none">
      {/* Hidden File Input for Logo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Main Kop Layout */}
      <div className="flex items-center gap-4">
        {/* Logo Shield & NPSN Container with Interactive Upload */}
        <div className="relative group flex flex-col items-center justify-center shrink-0">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer relative rounded-md p-1 transition-all hover:ring-2 hover:ring-emerald-500 hover:bg-slate-50 flex flex-col items-center justify-center"
            title="Klik untuk mengunggah / mengganti logo sekolah"
          >
            {customLogo ? (
              <div className="flex flex-col items-center justify-center">
                <img
                  src={customLogo}
                  alt="Logo Sekolah"
                  className="w-20 h-24 object-contain"
                />
                <span className="font-mono font-black text-slate-950 text-xs tracking-wider mt-0.5">
                  {npsnText}
                </span>
              </div>
            ) : (
              <SmkPancasilaLogo className="w-20 h-24" />
            )}

            {/* Hover overlay hint (hidden in print) */}
            <div className="absolute inset-0 bg-black/40 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 print:hidden pointer-events-none">
              <Camera className="w-5 h-5 text-emerald-300" />
              <span className="text-[9px] font-bold bg-emerald-700/90 px-1.5 py-0.5 rounded shadow-xs">
                Upload Logo
              </span>
            </div>
          </div>

          {/* Action buttons below logo (hidden in print) */}
          <div className="flex items-center gap-1 mt-1 print:hidden">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium rounded border border-slate-300 transition-colors cursor-pointer"
              title="Upload logo dari komputer"
            >
              <Upload className="w-2.5 h-2.5 text-slate-500" />
              <span>Ganti Logo</span>
            </button>

            {customLogo && (
              <button
                type="button"
                onClick={handleResetLogo}
                className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-medium rounded border border-rose-200 transition-colors cursor-pointer"
                title="Kembalikan ke logo bawaan"
              >
                <RefreshCw className="w-2.5 h-2.5 text-rose-500" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Header Content with Geometric Background Styling */}
        <div className="flex-1 text-center">
          {/* Top Banner Tag */}
          <div className="inline-block bg-slate-200/90 text-slate-900 font-bold text-xs uppercase px-5 py-0.5 rounded-sm tracking-wide mb-1">
            Yayasan Bina Tani Bagelen Purworejo
          </div>

          {/* School Name */}
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-[0.22em] leading-tight font-serif">
            SMK PANCASILA 1 KUTOARJO
          </h1>

          {/* Accreditation */}
          <p className="text-xs font-bold text-slate-800 tracking-wider my-0.5">
            Status Akreditasi : Terakreditasi B
          </p>

          {/* Concentration of Studies */}
          <div className="text-[10.5px] font-semibold text-slate-800 leading-snug">
            <p>
              Konsentrasi Keahlian : • Teknik Kendaraan Ringan • Teknik Pemesinan • Teknik Komputer Jaringan
            </p>
            <p>
              • Teknik Pengelasan • Teknik Sepeda Motor • Asisten Keperawatan dan Caregiver
            </p>
          </div>

          {/* Address & Contact Box */}
          <div className="bg-slate-200/80 rounded-sm py-1 px-2 mt-1.5 text-[9.5px] text-slate-800 leading-tight">
            <p className="font-medium">
              Jl. Mayjend. S. Parman, Kel. Bandung, Kec. Kutoarjo, Kab. Purworejo, Jawa Tengah, 54211, Telp/Fax 0275- 641516
            </p>
            <p className="font-medium">
              Website :http://www.smkpansa.sch.id; E-mail : smkpancasila1kta@gmail.com
            </p>
          </div>
        </div>
      </div>

      {/* Official Indonesian Double Divider Line */}
      <div className="mt-2.5">
        <div className="h-[2.5px] bg-slate-950 w-full" />
        <div className="h-[0.8px] bg-slate-950 w-full mt-[2px]" />
      </div>

      {/* Document Title Header */}
      <div className="pt-3 pb-1 text-center">
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-950">
          FORMULIR REKAPITULASI PENGAJUAN BELANJA
        </h2>
        <h3 className="text-xs font-bold uppercase text-emerald-800 tracking-wide mt-0.5">
          PENGADAAN BARANG DAN JASA (PBJ)
        </h3>
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
          <span>Tahun Anggaran</span>
          {isEditingYear ? (
            <input
              type="text"
              value={activeFiscalYear}
              onChange={(e) => handleUpdateYear(e.target.value)}
              onBlur={() => setIsEditingYear(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingYear(false)}
              autoFocus
              className="w-16 px-1 py-0 text-center font-bold text-slate-900 border border-emerald-500 rounded text-[10px] bg-emerald-50 focus:outline-none"
            />
          ) : (
            <span
              onClick={() => setIsEditingYear(true)}
              className="font-bold text-slate-800 hover:text-emerald-700 underline decoration-dotted underline-offset-2 cursor-pointer hover:bg-emerald-50 px-1 rounded transition-colors"
              title="Klik untuk mengubah Tahun Anggaran"
            >
              {activeFiscalYear}
            </span>
          )}
          <span>• Dokumen Verifikasi Keuangan & Sarana Prasarana</span>
        </div>
      </div>
    </div>
  );
};
