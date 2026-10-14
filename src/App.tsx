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
import { SyncModal } from './components/SyncModal';
import { exportToExcel, exportToCSV, downloadTemplateExcel } from './utils/excelExport';
import { getExcelColumnLetter } from './utils/formatters';
import { testConnection } from './firebase';
import { 
  DEFAULT_SYNC_CODE,
  SYNC_CODE_STORAGE_KEY,
  SYNC_ENABLED_STORAGE_KEY,
  subscribeToSyncCodeItems, 
  syncSaveItem, 
  syncDeleteItem, 
  syncDeleteMultipleItems, 
  syncUploadInitialItems 
} from './services/procurementSync';

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
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
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

  // 2-Device Synchronization State (Pairing Code based, seamless across Mobile & PC)
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('sync')) return true;
      const saved = localStorage.getItem(SYNC_ENABLED_STORAGE_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [syncCode, setSyncCode] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('sync');
      if (urlCode && urlCode.trim()) {
        const formatted = urlCode.trim().toUpperCase();
        localStorage.setItem(SYNC_CODE_STORAGE_KEY, formatted);
        localStorage.setItem(SYNC_ENABLED_STORAGE_KEY, 'true');
        return formatted;
      }
      return localStorage.getItem(SYNC_CODE_STORAGE_KEY) || DEFAULT_SYNC_CODE;
    } catch {
      return DEFAULT_SYNC_CODE;
    }
  });

  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Initialize Firebase connection test on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Toggle sync on / off
  const handleToggleSync = useCallback((enable: boolean) => {
    setIsSyncEnabled(enable);
    try {
      localStorage.setItem(SYNC_ENABLED_STORAGE_KEY, String(enable));
    } catch (e) {
      console.warn(e);
    }
    if (enable) {
      showToast(`✓ Sinkronisasi 2 Perangkat AKTIF! Terhubung ke Cloud (Kode: ${syncCode}).`);
    } else {
      showToast('Sinkronisasi cloud dinonaktifkan. Mode lokal aktif.');
    }
  }, [syncCode, showToast]);

  // Update pairing sync code
  const handleUpdateSyncCode = useCallback((newCode: string) => {
    const formatted = newCode.trim().toUpperCase() || DEFAULT_SYNC_CODE;
    setSyncCode(formatted);
    try {
      localStorage.setItem(SYNC_CODE_STORAGE_KEY, formatted);
    } catch (e) {
      console.warn(e);
    }
    showToast(`✓ Kode Sinkronisasi diperbarui: ${formatted}`);
  }, [showToast]);

  // Manually force upload local items to Firestore cloud
  const handleForceSyncNow = useCallback(async () => {
    try {
      setIsSyncing(true);
      await syncUploadInitialItems(items, syncCode);
      showToast(`✓ Seluruh ${items.length} data berhasil disinkronkan ke Cloud (Kode: ${syncCode}).`);
    } catch (e) {
      console.error(e);
      showToast('Gagal menyinkronkan data ke Cloud.');
    } finally {
      setIsSyncing(false);
    }
  }, [items, syncCode, showToast]);

  // Real-time bidirectional Firestore sync for this syncCode across all devices
  useEffect(() => {
    if (!isSyncEnabled) return;

    setIsSyncing(true);
    let isInitialLoad = true;

    const unsubscribe = subscribeToSyncCodeItems(
      syncCode,
      (remoteItems) => {
        setIsSyncing(false);
        if (isInitialLoad) {
          isInitialLoad = false;
          // If Firestore is completely empty for this syncCode, seed it with current local items
          if (remoteItems.length === 0 && items.length > 0) {
            syncUploadInitialItems(items, syncCode)
              .then(() => {
                showToast(`✓ Data lokal berhasil diunggah ke Cloud (Kode: ${syncCode}).`);
              })
              .catch(console.error);
            return;
          }
        }
        // Remote data received from Firestore (e.g. from Device 2 or initial load)
        if (remoteItems.length > 0) {
          setItems(remoteItems);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteItems));
          } catch (e) {
            console.error(e);
          }
        }
      },
      (err) => {
        setIsSyncing(false);
        console.error('Firestore subscription error:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isSyncEnabled, syncCode, showToast]);

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
    let updatedTargetItem: ProcurementItem | null = null;
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
          const q = updates.quantity !== undefined ? updates.quantity : item.quantity;
          const p = updates.unitPrice !== undefined ? updates.unitPrice : item.unitPrice;
          updated.totalPrice = Math.round((q || 0) * (p || 0));
        }
        updatedTargetItem = updated;
        return updated;
      }
      return item;
    }));

    if (isSyncEnabled && updatedTargetItem) {
      syncSaveItem(updatedTargetItem, syncCode).catch(err => {
        console.error('Failed to sync item update to Firestore:', err);
      });
    }
  }, [isSyncEnabled, syncCode]);

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
    if (isSyncEnabled) {
      syncSaveItem(newItem, syncCode).catch(err => {
        console.error('Failed to sync new item to Firestore:', err);
      });
    }

    // Move active cell to the new row
    setActiveCell({
      rowIdx: filteredAndSortedItems.length,
      colIdx: 4, // itemName column
    });
  }, [getNextCode, filteredAndSortedItems.length, isSyncEnabled, syncCode]);

  // Add item from Modal form
  const handleAddItemFromModal = (newItem: ProcurementItem) => {
    setItems(prev => [newItem, ...prev]);
    if (isSyncEnabled) {
      syncSaveItem(newItem, syncCode).catch(err => {
        console.error('Failed to sync modal item to Firestore:', err);
      });
    }
    setActiveCell({ rowIdx: 0, colIdx: 4 });
  };

  // Core permanent deletion executor that atomically updates state and localStorage
  const executePermanentDelete = useCallback((idsToDelete: string[], itemNamesDesc?: string) => {
    if (!idsToDelete || idsToDelete.length === 0) return;
    const idSet = new Set(idsToDelete);

    setItems(prev => {
      const nextItems = prev.filter(item => !idSet.has(item.id));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
      return nextItems;
    });

    setSelectedIds(prev => {
      const next = new Set(prev);
      idsToDelete.forEach(id => next.delete(id));
      return next;
    });

    // Delete permanently from Firestore so it deletes immediately across both devices
    if (isSyncEnabled) {
      syncDeleteMultipleItems(idsToDelete).catch(err => {
        console.error('Failed to sync delete to Firestore:', err);
      });
    }

    const desc = itemNamesDesc || (idsToDelete.length > 1 ? `${idsToDelete.length} baris pengajuan` : 'Item barang');
    showToast(`✓ Data ${desc} berhasil dihapus secara permanen dari sistem.`);
  }, [isSyncEnabled, showToast]);

  // Delete selected rows or currently active row permanently
  const handleDeleteSelected = useCallback(() => {
    let targetIds: string[] = [];
    let targetDesc = '';

    if (selectedIds.size > 0) {
      targetIds = Array.from(selectedIds);
      targetDesc = `${targetIds.length} baris pengajuan barang yang dicentang`;
    } else if (filteredAndSortedItems.length > 0) {
      const activeIdx = activeCell?.rowIdx ?? 0;
      const targetItem = filteredAndSortedItems[activeIdx] || filteredAndSortedItems[0];
      if (targetItem) {
        targetIds = [targetItem.id];
        targetDesc = targetItem.itemName ? `"${targetItem.itemName}"` : 'baris pengajuan aktif';
      }
    }

    if (targetIds.length === 0) {
      showToast('Pilih atau klik baris barang yang ingin dihapus terlebih dahulu.');
      return;
    }

    const count = targetIds.length;
    const idsSnapshot = [...targetIds];

    setConfirmConfig({
      isOpen: true,
      title: `Hapus Permanen ${count > 1 ? `${count} Baris Pengajuan` : 'Item Barang'}`,
      message: `Apakah Anda yakin ingin menghapus permanen ${targetDesc}? Data barang ini akan langsung dihapus dari sistem dan penyimpanan permanen sehingga tidak akan muncul kembali.`,
      confirmText: count > 1 ? `Hapus Permanen (${count} Baris)` : 'Hapus Permanen Sekarang',
      confirmVariant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        executePermanentDelete(idsSnapshot, targetDesc);
      },
    });
  }, [selectedIds, filteredAndSortedItems, activeCell, executePermanentDelete, showToast]);

  // Delete single row directly and permanently
  const handleDeleteSingleRow = useCallback((id: string) => {
    const itemToDelete = items.find(i => i.id === id);
    const itemName = itemToDelete?.itemName ? `"${itemToDelete.itemName}"` : 'item ini';
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Permanen Item Barang',
      message: `Apakah Anda yakin ingin menghapus permanen ${itemName}? Data barang ini akan langsung dihapus dari sistem dan penyimpanan permanen sehingga tidak akan muncul kembali.`,
      confirmText: 'Hapus Permanen Sekarang',
      confirmVariant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        executePermanentDelete([id], itemName);
      },
    });
  }, [items, executePermanentDelete]);

  // Duplicate selected rows
  const handleDuplicateSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const duplicatedItems: ProcurementItem[] = [];

    items.forEach(item => {
      if (selectedIds.has(item.id)) {
        const dup: ProcurementItem = {
          ...item,
          id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          code: `${item.code}-COPY`,
          itemName: `${item.itemName} (Salinan)`,
          status: 'Draft',
        };
        duplicatedItems.push(dup);
        if (isSyncEnabled) {
          syncSaveItem(dup, syncCode).catch(console.error);
        }
      }
    });

    setItems(prev => [...prev, ...duplicatedItems]);
    const dupCount = selectedIds.size;
    setSelectedIds(new Set());
    showToast(`Berhasil menduplikasi ${dupCount} baris pengajuan.`);
  }, [items, selectedIds, isSyncEnabled, syncCode, showToast]);

  // Batch status change
  const handleBatchStatusChange = useCallback((status: ProcurementStatus) => {
    if (selectedIds.size === 0) return;
    setItems(prev => prev.map(item => {
      if (selectedIds.has(item.id)) {
        const updated = { ...item, status };
        if (isSyncEnabled) {
          syncSaveItem(updated, syncCode).catch(console.error);
        }
        return updated;
      }
      return item;
    }));
    showToast(`Status ${selectedIds.size} baris diubah menjadi "${status}".`);
  }, [selectedIds, isSyncEnabled, syncCode, showToast]);

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
        if (isSyncEnabled) {
          syncUploadInitialItems(INITIAL_PROCUREMENT_DATA, syncCode).catch(console.error);
        }
        setSelectedIds(new Set());
        handleResetFilter();
        showToast('Data berhasil dimuat ulang ke contoh awal.');
      },
    });
  }, [handleResetFilter, isSyncEnabled, syncCode, showToast]);

  // Import data handler
  const handleImportData = (importedItems: ProcurementItem[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setItems(importedItems);
      if (isSyncEnabled) {
        syncUploadInitialItems(importedItems, syncCode).catch(console.error);
      }
    } else {
      setItems(prev => [...prev, ...importedItems]);
      if (isSyncEnabled) {
        importedItems.forEach(item => syncSaveItem(item, syncCode).catch(console.error));
      }
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
        isSyncEnabled={isSyncEnabled}
        syncCode={syncCode}
        isSyncing={isSyncing}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* 2-Device Real-time Sync Banner (when not enabled) */}
      {!isSyncEnabled && (
        <div className="bg-emerald-950 text-emerald-100 text-[11px] px-4 py-1.5 flex items-center justify-between border-b border-emerald-800/80 flex-wrap gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded text-[10px] tracking-wide">
              SINKRONISASI 2 DEVICE
            </span>
            <span>
              Ingin data otomatis saling terhubung dan selalu update saat dibuka di 2 perangkat (Laptop & HP)?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleToggleSync(true)}
              className="text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded cursor-pointer transition-colors shadow-xs"
            >
              Aktifkan Sekarang (1-Klik)
            </button>
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="text-[11px] bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 px-2.5 py-1 rounded cursor-pointer transition-colors border border-emerald-700/60"
            >
              Opsi / Kode
            </button>
          </div>
        </div>
      )}

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
        activeRowItemName={filteredAndSortedItems[activeCell?.rowIdx ?? 0]?.itemName}
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

      {/* 8. 2-Device Real-time Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        isSyncEnabled={isSyncEnabled}
        syncCode={syncCode}
        onToggleSync={handleToggleSync}
        onUpdateSyncCode={handleUpdateSyncCode}
        onForceSyncNow={handleForceSyncNow}
        isSyncing={isSyncing}
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
