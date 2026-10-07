import React, { useEffect, useState } from 'react';

interface ExcelFormulaBarProps {
  cellRefText: string;
  activeValue: string | number | undefined | null;
  isFormula: boolean;
  formulaString?: string;
  onCommitValue: (val: string) => void;
  readOnly?: boolean;
}

export const ExcelFormulaBar: React.FC<ExcelFormulaBarProps> = ({
  cellRefText,
  activeValue,
  isFormula,
  formulaString,
  onCommitValue,
  readOnly = false,
}) => {
  const [val, setVal] = useState('');

  useEffect(() => {
    if (isFormula && formulaString) {
      setVal(formulaString);
    } else {
      setVal(activeValue !== undefined && activeValue !== null ? String(activeValue) : '');
    }
  }, [cellRefText, activeValue, isFormula, formulaString]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onCommitValue(val);
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center bg-white border-b border-slate-200 text-xs px-2 py-1 gap-2 select-none">
      {/* Name Box (Cell Address, e.g. "A1", "K4") */}
      <div 
        className="w-16 h-6 px-1.5 flex items-center justify-center font-mono font-medium text-slate-700 bg-slate-50 border border-slate-300 rounded text-center truncate"
        title="Koordinat Sel Aktif"
      >
        {cellRefText || 'A1'}
      </div>

      {/* Function fx Icon */}
      <div className="flex items-center justify-center text-slate-500 font-serif italic font-bold px-1 select-none">
        fx
      </div>

      {/* Formula & Value Input Bar */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onCommitValue(val)}
          readOnly={readOnly}
          placeholder="Pilih sel untuk melihat atau mengedit nilai/formula..."
          className={`w-full h-6 px-2 text-xs font-mono border rounded outline-none transition-colors ${
            readOnly 
              ? 'bg-slate-50 text-slate-600 border-slate-200 cursor-default' 
              : 'bg-white text-slate-800 border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500'
          }`}
        />
        {isFormula && (
          <span className="absolute right-2 top-1 text-[10px] text-emerald-600 font-sans font-semibold bg-emerald-50 px-1 rounded">
            Formula Auto
          </span>
        )}
      </div>
    </div>
  );
};
