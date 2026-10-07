import * as XLSX from 'xlsx';
import { ProcurementItem } from '../types/procurement';

/**
 * Export procurement proposals to genuine Excel (.xlsx) file
 */
export function exportToExcel(
  items: ProcurementItem[],
  customFilename?: string
): void {
  // Format items for spreadsheet row representation
  const header = [
    'No',
    'Tanggal',
    'Divisi Pemohon',
    'Jenis (Barang/Jasa)',
    'Kategori Belanja',
    'Nama Barang / Jasa',
    'Spesifikasi & Keterangan',
    'Volume (Qty)',
    'Satuan',
    'Harga Satuan (Rp)',
    'Total Estimasi (Rp)',
    'Prioritas',
    'Status Pengajuan',
    'Catatan / Alasan',
    'Rekomendasi Vendor / Toko',
  ];

  const dataRows = items.map((item, index) => [
    index + 1,
    item.date,
    item.unit,
    item.type,
    item.category,
    item.itemName,
    item.spec,
    item.quantity,
    item.unitMeasure,
    item.unitPrice,
    item.totalPrice,
    item.priority,
    item.status,
    item.notes,
    item.vendor || '',
  ]);

  // Compute Grand Total
  const grandTotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const totalRow = [
    '',
    'TOTAL KESELURUHAN',
    '',
    '',
    '',
    '',
    '',
    totalQty,
    'Item/Unit',
    '',
    grandTotal,
    '',
    `${items.length} Pengajuan`,
    '',
    '',
  ];

  // Worksheet construction
  const wsData = [
    ['REKAPITULASI PENGAJUAN BELANJA BARANG DAN JASA'],
    [`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`],
    [], // empty line
    header,
    ...dataRows,
    [], // empty line before summary
    totalRow,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths definition
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 12 }, // Tanggal
    { wch: 24 }, // Unit / Divisi
    { wch: 10 }, // Jenis
    { wch: 20 }, // Kategori
    { wch: 32 }, // Nama Barang
    { wch: 38 }, // Spec
    { wch: 12 }, // Qty
    { wch: 10 }, // Satuan
    { wch: 18 }, // Harga Satuan
    { wch: 20 }, // Total
    { wch: 12 }, // Prioritas
    { wch: 15 }, // Status
    { wch: 35 }, // Catatan
    { wch: 25 }, // Vendor
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pengajuan Belanja');

  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `Pengajuan_Belanja_Barang_Jasa_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}

/**
 * Export to CSV format
 */
export function exportToCSV(
  items: ProcurementItem[],
  customFilename?: string
): void {
  const header = [
    'No',
    'Tanggal',
    'Divisi Pemohon',
    'Jenis',
    'Kategori',
    'Nama Barang/Jasa',
    'Spesifikasi',
    'Qty',
    'Satuan',
    'Harga Satuan',
    'Total Estimasi',
    'Prioritas',
    'Status',
    'Catatan',
    'Vendor',
  ];

  const rows = items.map((item, index) => [
    index + 1,
    `"${item.date}"`,
    `"${item.unit.replace(/"/g, '""')}"`,
    `"${item.type}"`,
    `"${item.category.replace(/"/g, '""')}"`,
    `"${item.itemName.replace(/"/g, '""')}"`,
    `"${(item.spec || '').replace(/"/g, '""')}"`,
    item.quantity,
    `"${item.unitMeasure}"`,
    item.unitPrice,
    item.totalPrice,
    `"${item.priority}"`,
    `"${item.status}"`,
    `"${(item.notes || '').replace(/"/g, '""')}"`,
    `"${(item.vendor || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [
    header.join(','),
    ...rows.map(r => r.join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', customFilename || `Pengajuan_Belanja_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download Blank Excel Template for user imports
 */
export function downloadTemplateExcel(): void {
  const header = [
    'Tanggal (YYYY-MM-DD)',
    'Divisi Pemohon',
    'Jenis (Barang/Jasa)',
    'Kategori Belanja',
    'Nama Barang / Jasa',
    'Spesifikasi & Keterangan',
    'Volume (Qty)',
    'Satuan',
    'Harga Satuan (Rp)',
    'Prioritas (Tinggi/Sedang/Rendah)',
    'Status (Draft/Diajukan/Disetujui/Proses Beli/Selesai/Ditolak)',
    'Catatan / Alasan',
    'Vendor / Rekanan',
  ];

  const sampleRow1 = [
    '2027-10-10',
    'Ka Konsen TKJ',
    'Barang',
    'Hardware & IT',
    'Kabel LAN Cat6 FTP 305 Meter',
    'Kabel jaringan shield outdoor Belden Cat6 Original',
    2,
    'Roll',
    1850000,
    'Tinggi',
    'Diajukan',
    'Untuk instalasi jaringan Lab baru',
    'CV Sentosa Komputer',
  ];

  const sampleRow2 = [
    '2027-10-11',
    'Sarana dan Prasarana',
    'Jasa',
    'Perawatan Fasilitas',
    'Jasa Perbaikan Instalasi Listrik',
    'Pengecekan panel utama dan perapihan kabel MCB',
    1,
    'Paket',
    1200000,
    'Sedang',
    'Draft',
    'Pemeliharaan rutin gedung barat',
    'Biro Teknik Listrik Mandiri',
  ];

  const ws = XLSX.utils.aoa_to_sheet([
    header,
    sampleRow1,
    sampleRow2,
  ]);

  ws['!cols'] = [
    { wch: 15 }, { wch: 22 }, { wch: 12 }, { wch: 20 },
    { wch: 30 }, { wch: 35 }, { wch: 12 }, { wch: 10 }, { wch: 18 },
    { wch: 15 }, { wch: 16 }, { wch: 30 }, { wch: 22 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Pengajuan');
  XLSX.writeFile(wb, 'Template_Pengajuan_Belanja.xlsx');
}

/**
 * Parse uploaded file (XLSX, XLS, CSV) into ProcurementItem[]
 */
export async function parseUploadedSpreadsheet(file: File): Promise<ProcurementItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  if (!workbook.SheetNames.length) {
    throw new Error('File tidak memiliki sheet yang dapat dibaca.');
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

  if (!jsonData || jsonData.length === 0) {
    throw new Error('Lembar kerja kosong.');
  }

  // Find header row (row containing keywords like 'nama', 'barang', 'kode', etc.)
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
    const row = jsonData[i];
    if (Array.isArray(row)) {
      const rowStr = row.map(c => String(c).toLowerCase()).join(' ');
      if (rowStr.includes('nama') || rowStr.includes('barang') || rowStr.includes('kode') || rowStr.includes('harga')) {
        headerRowIndex = i;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0;
  }

  const headers: string[] = (jsonData[headerRowIndex] || []).map((h: any) => String(h || '').trim().toLowerCase());
  const rows = jsonData.slice(headerRowIndex + 1);

  // Helper to find column index matching several aliases
  const findCol = (aliases: string[]): number => {
    return headers.findIndex(h => aliases.some(a => h.includes(a)));
  };

  const colCode = findCol(['kode', 'no pengajuan']);
  const colDate = findCol(['tanggal', 'tgl', 'date']);
  const colUnit = findCol(['unit', 'divisi', 'bagian', 'pemohon']);
  const colType = findCol(['jenis', 'type']);
  const colCategory = findCol(['kategori', 'category']);
  const colName = findCol(['nama barang', 'nama item', 'nama', 'barang', 'jasa']);
  const colSpec = findCol(['spesifikasi', 'spek', 'spec', 'keterangan']);
  const colQty = findCol(['volume', 'qty', 'jumlah', 'kuantitas']);
  const colUnitMeasure = findCol(['satuan', 'unit measure']);
  const colPrice = findCol(['harga satuan', 'harga', 'price', 'tarif']);
  const colTotal = findCol(['total', 'jumlah harga', 'subtotal']);
  const colPriority = findCol(['prioritas', 'priority']);
  const colStatus = findCol(['status']);
  const colNotes = findCol(['catatan', 'alasan', 'notes']);
  const colVendor = findCol(['vendor', 'rekanan', 'toko', 'suplier']);

  const parsedItems: ProcurementItem[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!Array.isArray(r) || r.length === 0) continue;

    // Skip empty rows or summary rows
    const rowContent = r.filter(c => c !== undefined && c !== null && String(c).trim() !== '');
    if (rowContent.length === 0) continue;
    const firstCell = String(r[0] || '').toLowerCase();
    if (firstCell.includes('total') || firstCell.includes('grand')) continue;

    const rawName = colName !== -1 ? String(r[colName] || '').trim() : String(r[1] || '').trim();
    if (!rawName) continue; // Must have an item name

    const rawQty = colQty !== -1 ? parseFloat(String(r[colQty]).replace(/[^0-9.-]+/g, '')) || 1 : 1;
    const rawPrice = colPrice !== -1 ? parseFloat(String(r[colPrice]).replace(/[^0-9.-]+/g, '')) || 0 : 0;
    const computedTotal = rawQty * rawPrice;
    const total = colTotal !== -1 && r[colTotal] ? (parseFloat(String(r[colTotal]).replace(/[^0-9.-]+/g, '')) || computedTotal) : computedTotal;

    const rawType = colType !== -1 ? String(r[colType] || '').trim().toLowerCase() : '';
    const type = rawType.includes('jasa') ? 'Jasa' : 'Barang';

    let rawPriority = colPriority !== -1 ? String(r[colPriority] || '').trim().toLowerCase() : '';
    let priority: ProcurementItem['priority'] = 'Sedang';
    if (rawPriority.includes('tinggi') || rawPriority.includes('high') || rawPriority.includes('urgent')) priority = 'Tinggi';
    if (rawPriority.includes('rendah') || rawPriority.includes('low')) priority = 'Rendah';

    let rawStatus = colStatus !== -1 ? String(r[colStatus] || '').trim() : '';
    let status: ProcurementItem['status'] = 'Draft';
    const sLower = rawStatus.toLowerCase();
    if (sLower.includes('setuju') || sLower.includes('approve')) status = 'Disetujui';
    else if (sLower.includes('ajukan') || sLower.includes('submit')) status = 'Diajukan';
    else if (sLower.includes('beli') || sLower.includes('proses')) status = 'Proses Beli';
    else if (sLower.includes('selesai') || sLower.includes('done')) status = 'Selesai';
    else if (sLower.includes('tolak') || sLower.includes('reject')) status = 'Ditolak';

    let dateVal = colDate !== -1 ? String(r[colDate] || '').trim() : today;
    // Handle excel numeric dates if needed
    if (typeof r[colDate] === 'number') {
      const parsedDate = new Date(Math.round((r[colDate] - 25569) * 86400 * 1000));
      if (!isNaN(parsedDate.getTime())) {
        dateVal = parsedDate.toISOString().split('T')[0];
      }
    }

    const newItem: ProcurementItem = {
      id: `imported-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      code: colCode !== -1 && r[colCode] ? String(r[colCode]).trim() : `PBJ-IMP-${String(i + 1).padStart(3, '0')}`,
      date: dateVal || today,
      unit: colUnit !== -1 && r[colUnit] ? String(r[colUnit]).trim() : 'Unit Kerja',
      type: type,
      category: colCategory !== -1 && r[colCategory] ? String(r[colCategory]).trim() : 'Lain-lain',
      itemName: rawName,
      spec: colSpec !== -1 && r[colSpec] ? String(r[colSpec]).trim() : '',
      quantity: rawQty,
      unitMeasure: colUnitMeasure !== -1 && r[colUnitMeasure] ? String(r[colUnitMeasure]).trim() : 'Unit',
      unitPrice: rawPrice,
      totalPrice: total,
      priority: priority,
      status: status,
      notes: colNotes !== -1 && r[colNotes] ? String(r[colNotes]).trim() : '',
      vendor: colVendor !== -1 && r[colVendor] ? String(r[colVendor]).trim() : '',
    };

    parsedItems.push(newItem);
  }

  if (parsedItems.length === 0) {
    throw new Error('Tidak ada baris data barang/jasa yang berhasil diekstrak dari file ini.');
  }

  return parsedItems;
}
