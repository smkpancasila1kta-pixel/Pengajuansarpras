import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ProcurementItem, 
  SortState, 
  ProcurementStatus,
  ProcurementPriority,
  ProcurementType
} from '../types/procurement';
import { formatRupiah, formatNumber, formatDateIndo, getExcelColumnLetter } from '../utils/formatters';
import { 
  AVAILABLE_UNITS, 
  AVAILABLE_CATEGORIES, 
  AVAILABLE_UNITS_MEASURE 
} from '../data/initialData';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  Check, 
  X,
  ChevronDown,
  Plus,
  Trash2
} from 'lucide-react';

interface ColumnDef {
  key: keyof ProcurementItem;
  label: string;
  width: number;
  align?: 'left' | 'center' | 'right';
  type: 'text' | 'number' | 'currency' | 'date' | 'select' | 'status' | 'priority' | 'type';
  options?: string[];
  readOnly?: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: 'date', label: 'Tanggal', width: 115, align: 'center', type: 'date' },
  { key: 'unit', label: 'Divisi Pemohon', width: 180, align: 'left', type: 'select', options: AVAILABLE_UNITS },
  { key: 'type', label: 'Jenis', width: 100, align: 'center', type: 'type', options: ['Barang', 'Jasa'] },
  { key: 'category', label: 'Kategori Belanja', width: 160, align: 'left', type: 'select', options: AVAILABLE_CATEGORIES },
  { key: 'itemName', label: 'Nama Barang / Jasa', width: 250, align: 'left', type: 'text' },
  { key: 'spec', label: 'Spesifikasi & Uraian', width: 260, align: 'left', type: 'text' },
  { key: 'quantity', label: 'Volume', width: 85, align: 'right', type: 'number' },
  { key: 'unitMeasure', label: 'Satuan', width: 95, align: 'center', type: 'select', options: AVAILABLE_UNITS_MEASURE },
  { key: 'unitPrice', label: 'Harga Satuan (Rp)', width: 145, align: 'right', type: 'currency' },
  { key: 'totalPrice', label: 'Total Estimasi (Rp)', width: 160, align: 'right', type: 'currency', readOnly: true },
  { key: 'priority', label: 'Prioritas', width: 110, align: 'center', type: 'priority', options: ['Tinggi', 'Sedang', 'Rendah'] },
  { key: 'status', label: 'Status', width: 130, align: 'center', type: 'status', options: ['Draft', 'Diajukan', 'Disetujui', 'Proses Beli', 'Selesai', 'Ditolak'] },
  { key: 'vendor', label: 'Rekomendasi Toko/Vendor', width: 190, align: 'left', type: 'text' },
  { key: 'notes', label: 'Catatan / Alasan', width: 220, align: 'left', type: 'text' },
];

interface ExcelGridProps {
  items: ProcurementItem[];
  selectedIds: Set<string>;
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
  onUpdateItem: (id: string, updates: Partial<ProcurementItem>) => void;
  onAddNewRow: () => void;
  sortState: SortState | null;
  onSortChange: (key: keyof ProcurementItem) => void;
  activeCell: { rowIdx: number; colIdx: number } | null;
  setActiveCell: (cell: { rowIdx: number; colIdx: number } | null) => void;
  columnFilters: Record<string, string[]>;
  onColumnFilterChange: (colKey: string, selectedValues: string[]) => void;
  onDeleteSingleRow?: (id: string) => void;
}

export const ExcelGrid: React.FC<ExcelGridProps> = ({
  items,
  selectedIds,
  onToggleSelectRow,
  onToggleSelectAll,
  onUpdateItem,
  onAddNewRow,
  sortState,
  onSortChange,
  activeCell,
  setActiveCell,
  columnFilters,
  onColumnFilterChange,
  onDeleteSingleRow,
}) => {
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colIdx: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current && typeof inputRef.current.select === 'function') {
        inputRef.current.select();
      }
    }
  }, [editingCell]);

  // Handle cell navigation with keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeCell) return;

    const { rowIdx, colIdx } = activeCell;
    const maxRow = items.length - 1;
    const maxCol = COLUMNS.length - 1;

    // If currently editing
    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
        // Move to row below if possible
        if (rowIdx < maxRow) {
          setActiveCell({ rowIdx: rowIdx + 1, colIdx });
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setEditingCell(null);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        if (e.shiftKey) {
          if (colIdx > 0) setActiveCell({ rowIdx, colIdx: colIdx - 1 });
        } else {
          if (colIdx < maxCol) setActiveCell({ rowIdx, colIdx: colIdx + 1 });
        }
      }
      return;
    }

    // Navigation mode
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (rowIdx > 0) setActiveCell({ rowIdx: rowIdx - 1, colIdx });
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (rowIdx < maxRow) setActiveCell({ rowIdx: rowIdx + 1, colIdx });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (colIdx > 0) setActiveCell({ rowIdx, colIdx: colIdx - 1 });
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (colIdx < maxCol) setActiveCell({ rowIdx, colIdx: colIdx + 1 });
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (colIdx > 0) setActiveCell({ rowIdx, colIdx: colIdx - 1 });
          else if (rowIdx > 0) setActiveCell({ rowIdx: rowIdx - 1, colIdx: maxCol });
        } else {
          if (colIdx < maxCol) setActiveCell({ rowIdx, colIdx: colIdx + 1 });
          else if (rowIdx < maxRow) setActiveCell({ rowIdx: rowIdx + 1, colIdx: 0 });
        }
        break;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        startEditing(rowIdx, colIdx);
        break;
      case 'Delete':
      case 'Backspace':
        // Don't delete computed column
        if (COLUMNS[colIdx].readOnly) return;
        const currentItem = items[rowIdx];
        if (currentItem) {
          const colDef = COLUMNS[colIdx];
          const emptyVal = colDef.type === 'number' || colDef.type === 'currency' ? 0 : '';
          onUpdateItem(currentItem.id, { [colDef.key]: emptyVal });
        }
        break;
      default:
        // If printable character key pressed, start typing immediately
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          if (!COLUMNS[colIdx].readOnly) {
            startEditing(rowIdx, colIdx, e.key);
          }
        }
        break;
    }
  };

  const startEditing = (rowIdx: number, colIdx: number, initialChar?: string) => {
    const colDef = COLUMNS[colIdx];
    if (colDef.readOnly) return;

    const item = items[rowIdx];
    if (!item) return;

    const currentVal = item[colDef.key];
    setEditingCell({ rowIdx, colIdx });
    setEditValue(initialChar !== undefined ? initialChar : (currentVal !== undefined && currentVal !== null ? String(currentVal) : ''));
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const { rowIdx, colIdx } = editingCell;
    const colDef = COLUMNS[colIdx];
    const item = items[rowIdx];

    if (item && !colDef.readOnly) {
      let finalVal: any = editValue;

      if (colDef.type === 'number' || colDef.type === 'currency') {
        const cleaned = editValue.replace(/[^0-9.-]+/g, '');
        finalVal = cleaned ? parseFloat(cleaned) || 0 : 0;
      }

      const updates: Partial<ProcurementItem> = {
        [colDef.key]: finalVal,
      };

      // Auto compute total price if quantity or unitPrice changed
      if (colDef.key === 'quantity') {
        const qty = typeof finalVal === 'number' ? finalVal : parseFloat(finalVal) || 0;
        updates.totalPrice = Math.round(qty * (item.unitPrice || 0));
      } else if (colDef.key === 'unitPrice') {
        const price = typeof finalVal === 'number' ? finalVal : parseFloat(finalVal) || 0;
        updates.totalPrice = Math.round((item.quantity || 0) * price);
      }

      onUpdateItem(item.id, updates);
    }

    setEditingCell(null);
  };

  // Distinct values for column filter menu
  const getDistinctValues = (colKey: keyof ProcurementItem): string[] => {
    const set = new Set<string>();
    items.forEach(i => {
      const val = i[colKey];
      if (val !== undefined && val !== null) {
        set.add(String(val));
      }
    });
    return Array.from(set).sort();
  };

  // Status badge styling
  const renderStatusBadge = (status: ProcurementStatus) => {
    const styles: Record<ProcurementStatus, string> = {
      'Draft': 'bg-slate-100 text-slate-700 border-slate-300',
      'Diajukan': 'bg-amber-100 text-amber-800 border-amber-300',
      'Disetujui': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'Proses Beli': 'bg-blue-100 text-blue-800 border-blue-300',
      'Selesai': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'Ditolak': 'bg-rose-100 text-rose-800 border-rose-300',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${styles[status] || styles['Draft']}`}>
        {status}
      </span>
    );
  };

  // Priority badge styling
  const renderPriorityBadge = (priority: ProcurementPriority) => {
    const styles: Record<ProcurementPriority, string> = {
      'Tinggi': 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
      'Sedang': 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
      'Rendah': 'bg-slate-100 text-slate-600 border-slate-200 font-normal',
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-[11px] border ${styles[priority] || ''}`}>
        {priority}
      </span>
    );
  };

  // Grand summary totals
  const totalVolume = useMemo(() => items.reduce((sum, item) => sum + (item.quantity || 0), 0), [items]);
  const totalAnggaran = useMemo(() => items.reduce((sum, item) => sum + (item.totalPrice || 0), 0), [items]);

  return (
    <div 
      className="flex-1 flex flex-col bg-slate-100 overflow-hidden outline-none select-none"
      ref={gridContainerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Scrollable Spreadsheet Table */}
      <div className="flex-1 overflow-auto bg-white relative">
        <table className="w-full border-collapse border-spacing-0 text-xs">
          {/* Column Header Group */}
          <thead className="sticky top-0 z-20 bg-slate-100 shadow-xs">
            {/* Row 1: Excel Column Letters (A, B, C...) */}
            <tr className="border-b border-slate-300 bg-slate-200/90 text-slate-500 font-mono text-[11px] h-5">
              {/* Top-left corner box */}
              <th className="w-10 min-w-10 max-w-10 sticky left-0 z-30 bg-slate-200 border-r border-slate-300 text-center font-normal">
                ◢
              </th>
              {/* Row check box header */}
              <th className="w-9 min-w-9 max-w-9 sticky left-10 z-30 bg-slate-200 border-r border-slate-300 text-center">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selectedIds.size === items.length}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  title="Pilih Semua Baris"
                />
              </th>
              {/* Letters A through O */}
              {COLUMNS.map((col, idx) => (
                <th
                  key={`letter-${col.key}`}
                  style={{ width: col.width, minWidth: col.width }}
                  className="border-r border-slate-300 px-1 font-semibold text-center uppercase"
                >
                  {getExcelColumnLetter(idx)}
                </th>
              ))}
            </tr>

            {/* Row 2: Column Titles & Filter/Sort Controls */}
            <tr className="border-b border-slate-300 bg-slate-100 text-slate-700 font-semibold h-8 text-[12px]">
              {/* Row Index corner */}
              <th className="sticky left-0 z-30 bg-slate-100 border-r border-slate-300 text-slate-400 text-center font-normal">
                #
              </th>
              {/* Selection Column Header */}
              <th className="sticky left-10 z-30 bg-slate-100 border-r border-slate-300 text-slate-400 text-center font-normal">
                ✓
              </th>
              {/* Column Headers */}
              {COLUMNS.map((col) => {
                const isSorted = sortState?.key === col.key;
                const isFiltered = !!columnFilters[col.key] && columnFilters[col.key].length > 0;

                return (
                  <th
                    key={`header-${col.key}`}
                    style={{ width: col.width, minWidth: col.width }}
                    className="border-r border-slate-300 px-2 text-left font-semibold relative group hover:bg-slate-200 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      {/* Clickable Header Label for Quick Sort */}
                      <span
                        onClick={() => onSortChange(col.key)}
                        className="truncate cursor-pointer hover:text-emerald-700 select-none flex-1"
                        title={`Urutkan berdasarkan ${col.label}`}
                      >
                        {col.label}
                      </span>

                      {/* Controls: Sort indicator & Filter button */}
                      <div className="flex items-center gap-0.5">
                        {isSorted && (
                          <button
                            onClick={() => onSortChange(col.key)}
                            className="text-emerald-700 p-0.5 hover:bg-emerald-100 rounded cursor-pointer"
                          >
                            {sortState.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {/* Excel Filter Dropdown Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenFilterCol(openFilterCol === col.key ? null : col.key);
                            setFilterSearch('');
                          }}
                          className={`p-0.5 rounded cursor-pointer transition-colors ${
                            isFiltered
                              ? 'bg-amber-200 text-amber-900'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200 opacity-60 group-hover:opacity-100'
                          }`}
                          title={`Filter kolom ${col.label}`}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Popover Filter Menu (Excel-like) */}
                    {openFilterCol === col.key && (
                      <div
                        className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-300 shadow-xl rounded-md z-50 text-slate-800 font-normal p-2 animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-[11px] font-bold text-slate-700 pb-1.5 border-b border-slate-200 mb-2 flex items-center justify-between">
                          <span>Filter: {col.label}</span>
                          <button
                            onClick={() => setOpenFilterCol(null)}
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Quick Sort Options */}
                        <div className="space-y-1 mb-2 pb-2 border-b border-slate-100 text-xs">
                          <button
                            onClick={() => {
                              if (sortState?.key !== col.key || sortState?.direction !== 'asc') {
                                onSortChange(col.key);
                              }
                              setOpenFilterCol(null);
                            }}
                            className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 flex items-center gap-1.5 text-slate-700"
                          >
                            <ArrowUp className="w-3 h-3 text-emerald-600" />
                            <span>Urutkan A ke Z (Menaik)</span>
                          </button>
                          <button
                            onClick={() => {
                              if (sortState?.key !== col.key || sortState?.direction !== 'desc') {
                                onSortChange(col.key);
                                if (sortState?.key !== col.key) onSortChange(col.key); // second toggle
                              }
                              setOpenFilterCol(null);
                            }}
                            className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 flex items-center gap-1.5 text-slate-700"
                          >
                            <ArrowDown className="w-3 h-3 text-emerald-600" />
                            <span>Urutkan Z ke A (Menurun)</span>
                          </button>
                        </div>

                        {/* Values Checklist Filter */}
                        <div>
                          <div className="text-[11px] font-semibold text-slate-600 mb-1">
                            Pilih Nilai:
                          </div>
                          <input
                            type="text"
                            placeholder="Cari..."
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded mb-1.5 outline-none focus:border-emerald-500"
                          />
                          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
                            {getDistinctValues(col.key)
                              .filter(v => v.toLowerCase().includes(filterSearch.toLowerCase()))
                              .map(val => {
                                const activeList = columnFilters[col.key] || [];
                                const isChecked = activeList.includes(val);
                                return (
                                  <label
                                    key={val}
                                    className="flex items-center gap-2 px-1 py-0.5 hover:bg-slate-50 rounded cursor-pointer text-slate-700"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        const next = isChecked
                                          ? activeList.filter(x => x !== val)
                                          : [...activeList, val];
                                        onColumnFilterChange(col.key, next);
                                      }}
                                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="truncate">{val || '(Kosong)'}</span>
                                  </label>
                                );
                              })}
                          </div>
                        </div>

                        {/* Clear column filter */}
                        {isFiltered && (
                          <div className="mt-2 pt-1.5 border-t border-slate-200">
                            <button
                              onClick={() => {
                                onColumnFilterChange(col.key, []);
                                setOpenFilterCol(null);
                              }}
                              className="text-xs text-rose-600 hover:text-rose-800 font-medium w-full text-left px-1"
                            >
                              Hapus filter kolom ini
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Grid Rows */}
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 2} className="py-12 text-center text-slate-400 bg-white">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <Filter className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">Tidak ada data yang sesuai filter</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci atau reset filter Anda.</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, rowIdx) => {
                const isRowSelected = selectedIds.has(item.id);

                return (
                  <tr
                    key={item.id}
                    className={`h-7 border-b border-slate-200 transition-colors ${
                      isRowSelected ? 'bg-emerald-50/70' : rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    } hover:bg-slate-100/70`}
                  >
                    {/* Row Index Number (Sticky Left Column) */}
                    <td className="sticky left-0 z-10 bg-slate-100 border-r border-slate-300 text-center font-mono text-[11px] text-slate-500 select-none">
                      {rowIdx + 1}
                    </td>

                    {/* Row Checkbox Selector */}
                    <td className="sticky left-10 z-10 bg-inherit border-r border-slate-300 text-center group/row">
                      <div className="flex items-center justify-center relative">
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            onToggleSelectRow(item.id);
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        {onDeleteSingleRow && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSingleRow(item.id);
                            }}
                            className="hidden group-hover/row:flex absolute -left-6 bg-white hover:bg-rose-100 text-rose-600 border border-rose-300 rounded p-0.5 shadow-xs cursor-pointer z-20"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Data Cells */}
                    {COLUMNS.map((col, colIdx) => {
                      const isActive = activeCell?.rowIdx === rowIdx && activeCell?.colIdx === colIdx;
                      const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.colIdx === colIdx;
                      const rawValue = item[col.key];

                      return (
                        <td
                          key={`${item.id}-${col.key}`}
                          onClick={() => {
                            setActiveCell({ rowIdx, colIdx });
                          }}
                          onDoubleClick={() => {
                            startEditing(rowIdx, colIdx);
                          }}
                          className={`border-r border-slate-200 px-2 py-0.5 relative text-slate-800 truncate select-none ${
                            col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                          } ${
                            isActive
                              ? 'outline-2 outline-emerald-600 z-10 bg-white ring-1 ring-emerald-500'
                              : ''
                          } ${col.readOnly ? 'bg-slate-50/70' : ''}`}
                          style={{ maxWidth: col.width }}
                        >
                          {/* Active Cell Excel Handle Dot in bottom-right corner */}
                          {isActive && !isEditing && (
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-emerald-700 z-20 cursor-crosshair border border-white" />
                          )}

                          {/* Cell Content or Inline Editor */}
                          {isEditing ? (
                            col.type === 'select' || col.type === 'status' || col.type === 'priority' || col.type === 'type' ? (
                              <select
                                ref={inputRef as any}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitEdit();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-full h-6 px-1 text-xs bg-white border-none outline-none font-sans"
                              >
                                {col.options?.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                ref={inputRef as any}
                                type={col.type === 'number' || col.type === 'currency' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                className="w-full h-6 px-1 text-xs bg-white border-none outline-none font-sans"
                              />
                            )
                          ) : (
                            // Read-only / Display Formatter
                            col.type === 'currency' ? (
                              <span className={`font-mono ${col.key === 'totalPrice' ? 'font-semibold text-slate-900' : ''}`}>
                                {formatRupiah(rawValue as number)}
                              </span>
                            ) : col.type === 'number' ? (
                              <span className="font-mono">{formatNumber(rawValue as number)}</span>
                            ) : col.type === 'date' ? (
                              <span>{formatDateIndo(rawValue as string)}</span>
                            ) : col.type === 'status' ? (
                              renderStatusBadge(rawValue as ProcurementStatus)
                            ) : col.type === 'priority' ? (
                              renderPriorityBadge(rawValue as ProcurementPriority)
                            ) : col.type === 'type' ? (
                              <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                rawValue === 'Barang' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                              }`}>
                                {String(rawValue)}
                              </span>
                            ) : (
                              <span title={String(rawValue || '')}>
                                {String(rawValue || '')}
                              </span>
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}

            {/* Quick Add Row Button Inline at end of table */}
            <tr className="h-7 bg-slate-50/60 border-b border-slate-200">
              <td className="sticky left-0 bg-slate-100 border-r border-slate-300 text-center font-mono text-[11px] text-slate-400">
                +
              </td>
              <td className="sticky left-10 bg-inherit border-r border-slate-300 text-center"></td>
              <td colSpan={COLUMNS.length} className="px-2">
                <button
                  onClick={onAddNewRow}
                  className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-semibold py-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Baris Pengajuan Baru (Ctrl+N)</span>
                </button>
              </td>
            </tr>
          </tbody>

          {/* Frozen Grand Total Row at Bottom (MS Excel SUM style) */}
          <tfoot className="sticky bottom-0 z-20 bg-slate-100 font-bold border-t-2 border-slate-300 shadow-xs">
            <tr className="h-8 text-slate-800 text-[12px]">
              <td className="sticky left-0 bg-slate-200 border-r border-slate-300 text-center font-mono text-xs">
                Σ
              </td>
              <td className="sticky left-10 bg-slate-200 border-r border-slate-300 text-center"></td>
              <td className="border-r border-slate-300 px-2 uppercase text-slate-600 font-mono">
                TOTAL
              </td>
              <td className="border-r border-slate-300 px-2 text-center text-slate-500 font-normal">
                {items.length} Baris
              </td>
              <td colSpan={5} className="border-r border-slate-300 px-2 text-slate-500 italic text-right font-normal">
                =SUM(Volume & Total Anggaran):
              </td>
              {/* Total Qty (Volume) */}
              <td className="border-r border-slate-300 px-2 text-right font-mono text-emerald-800">
                {formatNumber(totalVolume)}
              </td>
              <td className="border-r border-slate-300 px-2 text-center text-slate-500 font-normal">
                Item/Unit
              </td>
              <td className="border-r border-slate-300 px-2 text-right text-slate-400 font-mono font-normal">
                -
              </td>
              {/* Total Estimasi Rp */}
              <td className="border-r border-slate-300 px-2 text-right font-mono text-emerald-800 bg-emerald-50/60 font-bold">
                {formatRupiah(totalAnggaran)}
              </td>
              <td colSpan={4} className="border-r border-slate-300 px-2 text-slate-400 font-normal"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Excel Bottom Status Bar */}
      <div className="h-6 bg-slate-200 border-t border-slate-300 px-3 flex items-center justify-between text-[11px] text-slate-600 font-mono select-none">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-emerald-800 uppercase">SIAP</span>
          <span className="text-slate-400">|</span>
          <span>BARIS: {items.length}</span>
          {selectedIds.size > 0 && (
            <>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-700 font-semibold">DIPILIH: {selectedIds.size}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span>SUM TOTAL: <strong className="text-slate-800">{formatRupiah(totalAnggaran)}</strong></span>
          <span className="text-slate-400">|</span>
          <span>RATA-RATA: <strong className="text-slate-800">{formatRupiah(items.length > 0 ? totalAnggaran / items.length : 0)}</strong></span>
          <span className="text-slate-400">|</span>
          <span>100% ZOOM</span>
        </div>
      </div>
    </div>
  );
};
export { COLUMNS };
