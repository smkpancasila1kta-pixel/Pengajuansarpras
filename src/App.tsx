import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ProcurementItem, 
  FilterState, 
  SortState, 
  ProcurementStatus 
} from './types/procurement';
import { INITIAL_PROCUREMENT_DATA } from './data/initialData';
import { HeaderBar } from './components/HeaderBar';
import { SummaryCards } from './components/SummaryCards';
import { ExcelToolbar } from './components/ExcelToolbar';
import { ExcelFormulaBar } from './components/ExcelFormulaBar';
import { ExcelGrid, COLUMNS } from './components/ExcelGrid';
import { ImportModal } from './components/ImportModal';
import { PrintModal } from './components/PrintModal';
import { NewRowModal } from './components/NewRowModal';
import { ConfirmModal } from './components/ConfirmModal';
import { exportToExcel, exportToCSV, downloadTemplateExcel } from './utils/excelExport';
import { getExcelColumnLetter } from './utils/formatters';

const STORAGE_KEY = 'pbj_spreadsheet_procurement_items_v1';

const UNIT_MAP: Record<string, string> = {
  'Laboratorium Komputer': 'Ka Konsen TKJ',
  'Bagian Tata Usaha': 'Tata Usaha',
  'Sarana & Prasarana': 'Sarana dan Prasarana',
  'Jurusan Teknik Otomotif': 'Kakonsen TKR',
  'Jurusan TKJ': 'Ka Konsen TKJ',
  'Kurikulum & Pengajaran': 'Kakonsen TP',
  'Kesiswaan & OSIS': 'Ekstra Kurikuler',
  'Perpustakaan': 'Tata Usaha',
  'Bimbingan Konseling (BK)': 'Tata Usaha',
  'Keamanan & Kebersihan': 'Sarana dan Prasarana',
};

export default function App() {
  // Persistent data state
  const [items, setItems] = useState<ProcurementItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => ({
            ...item,
            unit: UNIT_MAP[item.unit] || item.unit || 'Kakonsen TKR',
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load saved items from localStorage:', e);
    }
    return INITIAL_PROCUREMENT_DATA;
  });

  // Filter state
  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    type: 'all',
    status: 'all',
    unit: 'all',
    category: 'all',
    priority: 'all',
  });

  // Column specific filters (Excel checklist)
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});

  // Sort state (default sort by date descending)
  const [sortState, setSortState] = useState<SortState | null>({
    key: 'date',
    direction: 'desc',
  });

  // Selected row IDs for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Active focused cell: { rowIdx, colIdx }
  const [activeCell, setActiveCell] = useState<{ rowIdx: number; colIdx: number } | null>({
    rowIdx: 0,
    colIdx: 4, // Default active on Nama Barang
  });

  // UI Drawer & Modal toggles
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isPrintOpen, setIsPrintOpen] = useState<boolean>(false);

  // Custom in-app Confirmation Dialog state (replaces window.confirm)
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    iconType?: 'trash' | 'reset' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [items]);

  // Handle Ctrl+N keyboard shortcut to add new row
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleAddNewRow();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [items]);

  // Filtered and Sorted items calculation
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Global Search filter
    if (filterState.search.trim()) {
      const q = filterState.search.toLowerCase().trim();
      result = result.filter(item => {
        return (
          item.itemName.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.spec && item.spec.toLowerCase().includes(q)) ||
          item.unit.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.vendor && item.vendor.toLowerCase().includes(q)) ||
          (item.notes && item.notes.toLowerCase().includes(q))
        );
      });
    }

    // Dropdown filters
    if (filterState.type !== 'all') {
      result = result.filter(item => item.type === filterState.type);
    }
    if (filterState.status !== 'all') {
      result = result.filter(item => item.status === filterState.status);
    }
    if (filterState.unit !== 'all') {
      result = result.filter(item => item.unit === filterState.unit);
    }
    if (filterState.category !== 'all') {
      result = result.filter(item => item.category === filterState.category);
    }
    if (filterState.priority !== 'all') {
      result = result.filter(item => item.priority === filterState.priority);
    }

    // Column-specific checklist filters
    for (const [key, selectedVals] of Object.entries(columnFilters)) {
      if (selectedVals && selectedVals.length > 0) {
        result = result.filter(item => {
          const val = String((item as any)[key] ?? '');
          return selectedVals.includes(val);
        });
      }
    }

    // Sorting
    if (sortState) {
      const { key, direction } = sortState;
      result.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return direction === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA ?? '').toLowerCase();
        const strB = String(valB ?? '').toLowerCase();

        if (direction === 'asc') {
          return strA.localeCompare(strB, 'id');
        } else {
          return strB.localeCompare(strA, 'id');
        }
      });
    }

    return result;
  }, [items, filterState, columnFilters, sortState]);

  // Toggle selection for individual row
  const handleToggleSelectRow = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select all or deselect all visible rows
  const handleToggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredAndSortedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedItems.map(i => i.id)));
    }
  }, [selectedIds, filteredAndSortedItems]);

  // Update a single item
  const handleUpdateItem = useCallback((id: string, updates: Partial<ProcurementItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
          const q = updates.quantity !== undefined ? updates.quantity : item.quantity;
          const p = updates.unitPrice !== undefined ? updates.unitPrice : item.unitPrice;
          updated.totalPrice = Math.round((q || 0) * (p || 0));
        }
        return updated;
      }
      return item;
    }));
  }, []);

  // Generate next automatic code (e.g. PBJ-2027-013)
  const getNextCode = useCallback(() => {
    const existingNumbers = items.map(item => {
      const match = item.code.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `PBJ-2027-${String(maxNum + 1).padStart(3, '0')}`;
  }, [items]);

  // Add new blank row inline
  const handleAddNewRow = useCallback(() => {
    const newCode = getNextCode();
    const today = new Date().toISOString().split('T')[0];
    const newItem: ProcurementItem = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code: newCode,
      date: today,
      unit: 'Kakonsen TKR',
      type: 'Barang',
      category: 'ATK & Percetakan',
      itemName: 'Nama Barang Baru',
      spec: '',
      quantity: 1,
      unitMeasure: 'Unit',
      unitPrice: 0,
      totalPrice: 0,
      priority: 'Sedang',
      status: 'Draft',
      notes: '',
      vendor: '',
    };

    setItems(prev => [...prev, newItem]);
    // Move active cell to the new row
    setActiveCell({
      rowIdx: filteredAndSortedItems.length,
      colIdx: 4, // itemName column
    });
  }, [getNextCode, filteredAndSortedItems.length]);

  // Add item from Modal form
  const handleAddItemFromModal = (newItem: ProcurementItem) => {
    setItems(prev => [newItem, ...prev]);
    setActiveCell({ rowIdx: 0, colIdx: 4 });
  };

  // Delete selected rows (uses in-app confirm dialog, safe for iframes)
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    setConfirmConfig({
      isOpen: true,
      title: `Hapus ${count} Baris Pengajuan`,
      message: `Apakah Anda yakin ingin menghapus ${count} baris pengajuan belanja yang dicentang? Data yang dihapus akan dihilangkan dari lembar kerja.`,
      confirmText: `Hapus (${count} Baris)`,
      confirmVariant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
        setSelectedIds(new Set());
        showToast(`Berhasil menghapus ${count} baris pengajuan.`);
      },
    });
  }, [selectedIds, showToast]);

  // Delete single row directly
  const handleDeleteSingleRow = useCallback((id: string) => {
    const itemToDelete = items.find(i => i.id === id);
    const itemName = itemToDelete ? itemToDelete.itemName : 'baris ini';
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Baris Pengajuan',
      message: `Apakah Anda yakin ingin menghapus pengajuan "${itemName}" dari lembar kerja?`,
      confirmText: 'Hapus Baris',
      confirmVariant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        setItems(prev => prev.filter(i => i.id !== id));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        showToast(`Berhasil menghapus 1 baris pengajuan.`);
      },
    });
  }, [items, showToast]);

  // Duplicate selected rows
  const handleDuplicateSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const duplicatedItems: ProcurementItem[] = [];

    items.forEach(item => {
      if (selectedIds.has(item.id)) {
        duplicatedItems.push({
          ...item,
          id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          code: `${item.code}-COPY`,
          itemName: `${item.itemName} (Salinan)`,
          status: 'Draft',
        });
      }
    });

    setItems(prev => [...prev, ...duplicatedItems]);
    const dupCount = selectedIds.size;
    setSelectedIds(new Set());
    showToast(`Berhasil menduplikasi ${dupCount} baris pengajuan.`);
  }, [items, selectedIds, showToast]);

  // Batch status change
  const handleBatchStatusChange = useCallback((status: ProcurementStatus) => {
    if (selectedIds.size === 0) return;
    setItems(prev => prev.map(item => {
      if (selectedIds.has(item.id)) {
        return { ...item, status };
      }
      return item;
    }));
    showToast(`Status ${selectedIds.size} baris diubah menjadi "${status}".`);
  }, [selectedIds, showToast]);

  // Sort header click
  const handleSortChange = useCallback((key: keyof ProcurementItem) => {
    setSortState(prev => {
      if (!prev || prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null; // Return to default
    });
  }, []);

  // Column filter change
  const handleColumnFilterChange = useCallback((colKey: string, values: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [colKey]: values,
    }));
  }, []);

  // Reset all filters
  const handleResetFilter = useCallback(() => {
    setFilterState({
      search: '',
      type: 'all',
      status: 'all',
      unit: 'all',
      category: 'all',
      priority: 'all',
    });
    setColumnFilters({});
  }, []);

  // Reset to initial sample data
  const handleResetData = useCallback(() => {
    setConfirmConfig({
      isOpen: true,
      title: 'Muat Ulang Contoh Data Awal',
      message: 'Apakah Anda ingin memuat ulang contoh data pengadaan awal? Seluruh perubahan pada tabel saat ini akan digantikan dengan data contoh sekolah/kantor.',
      confirmText: 'Muat Ulang Data',
      confirmVariant: 'warning',
      iconType: 'reset',
      onConfirm: () => {
        setItems(INITIAL_PROCUREMENT_DATA);
        setSelectedIds(new Set());
        handleResetFilter();
        showToast('Data berhasil dimuat ulang ke contoh awal.');
      },
    });
  }, [handleResetFilter, showToast]);

  // Import data handler
  const handleImportData = (importedItems: ProcurementItem[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setItems(importedItems);
    } else {
      setItems(prev => [...prev, ...importedItems]);
    }
    setSelectedIds(new Set());
  };

  // Information for active cell in formula bar
  const activeCellInfo = useMemo(() => {
    if (!activeCell || !filteredAndSortedItems[activeCell.rowIdx]) {
      return {
        refText: 'A1',
        value: '',
        isFormula: false,
        formulaString: '',
        readOnly: false,
      };
    }

    const { rowIdx, colIdx } = activeCell;
    const colDef = COLUMNS[colIdx];
    const item = filteredAndSortedItems[rowIdx];
    const letter = getExcelColumnLetter(colIdx);
    const refText = `${letter}${rowIdx + 1}`;

    const isFormula = colDef.key === 'totalPrice';
    // Col G is index 6 (quantity), Col I is index 8 (unitPrice)
    const formulaString = isFormula ? `=G${rowIdx + 1}*I${rowIdx + 1}` : '';

    return {
      refText,
      value: item[colDef.key],
      isFormula,
      formulaString,
      readOnly: !!colDef.readOnly,
    };
  }, [activeCell, filteredAndSortedItems]);

  // Commit edit from Formula Bar
  const handleFormulaBarCommit = (newVal: string) => {
    if (!activeCell) return;
    const { rowIdx, colIdx } = activeCell;
    const item = filteredAndSortedItems[rowIdx];
    const colDef = COLUMNS[colIdx];

    if (item && !colDef.readOnly) {
      let finalVal: any = newVal;
      if (colDef.type === 'number' || colDef.type === 'currency') {
        const cleaned = newVal.replace(/[^0-9.-]+/g, '');
        finalVal = cleaned ? parseFloat(cleaned) || 0 : 0;
      }
      handleUpdateItem(item.id, { [colDef.key]: finalVal });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* 1. Top Header Bar */}
      <HeaderBar
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onExportExcel={() => exportToExcel(filteredAndSortedItems)}
        onOpenPrint={() => setIsPrintOpen(true)}
        hasUnsavedChanges={false}
        itemCount={items.length}
      />

      {/* 2. Procurement Summary Cards (KPIs) */}
      <SummaryCards
        items={items}
        filteredItems={filteredAndSortedItems}
      />

      {/* 3. Excel Ribbon & Filter Toolbar */}
      <ExcelToolbar
        onAddRow={handleAddNewRow}
        onDeleteSelected={handleDeleteSelected}
        onDuplicateSelected={handleDuplicateSelected}
        onBatchStatusChange={handleBatchStatusChange}
        onExportExcel={() => exportToExcel(filteredAndSortedItems)}
        onExportCSV={() => exportToCSV(filteredAndSortedItems)}
        onOpenImport={() => setIsImportOpen(true)}
        onDownloadTemplate={downloadTemplateExcel}
        onPrint={() => setIsPrintOpen(true)}
        onResetData={handleResetData}
        selectedCount={selectedIds.size}
        totalCount={items.length}
        filteredCount={filteredAndSortedItems.length}
        filterState={filterState}
        onFilterChange={(newFilters) => setFilterState(prev => ({ ...prev, ...newFilters }))}
        onResetFilter={handleResetFilter}
        isFilterExpanded={isFilterExpanded}
        setIsFilterExpanded={setIsFilterExpanded}
      />

      {/* 4. MS Excel Formula Bar */}
      <ExcelFormulaBar
        cellRefText={activeCellInfo.refText}
        activeValue={activeCellInfo.value ?? ''}
        isFormula={activeCellInfo.isFormula}
        formulaString={activeCellInfo.formulaString}
        readOnly={activeCellInfo.readOnly}
        onCommitValue={handleFormulaBarCommit}
      />

      {/* 5. Core Excel Grid with Table, Sort, Inline Edit, Filter Popovers & Bottom SUM */}
      <ExcelGrid
        items={filteredAndSortedItems}
        selectedIds={selectedIds}
        onToggleSelectRow={handleToggleSelectRow}
        onToggleSelectAll={handleToggleSelectAll}
        onUpdateItem={handleUpdateItem}
        onAddNewRow={handleAddNewRow}
        sortState={sortState}
        onSortChange={handleSortChange}
        activeCell={activeCell}
        setActiveCell={setActiveCell}
        columnFilters={columnFilters}
        onColumnFilterChange={handleColumnFilterChange}
        onDeleteSingleRow={handleDeleteSingleRow}
      />

      {/* 6. Modals */}
      <NewRowModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onAdd={handleAddItemFromModal}
        nextCode={getNextCode()}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportData={handleImportData}
      />

      <PrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        items={filteredAndSortedItems}
        selectedIds={selectedIds}
      />

      {/* 7. Custom In-App Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        confirmVariant={confirmConfig.confirmVariant}
        iconType={confirmConfig.iconType}
      />

      {/* 8. Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
