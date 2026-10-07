import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProcurementItem } from '../types/procurement';
import { formatRupiah, formatNumber } from './formatters';

export function generateProcurementPDF(
  items: ProcurementItem[],
  scopeLabel: string = 'Seluruh Rekapitulasi',
  customLogo?: string | null,
  applicantName?: string,
  fiscalYear: string = '2027',
  filename?: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const grandTotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // --- KOP SURAT RESMI SMK PANCASILA 1 KUTOARJO ---
  const storedLogo = customLogo || (typeof window !== 'undefined' ? localStorage.getItem('pbj_custom_school_logo') : null);

  if (storedLogo) {
    try {
      doc.addImage(storedLogo, 'PNG', 14, 10, 16, 21, undefined, 'FAST');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('20306060', 22, 34, { align: 'center' });
    } catch {
      // Fallback to text simulation
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(220, 38, 38);
      doc.text('SMK', 20, 16, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(2, 132, 199);
      doc.text('PANCASILA 1', 20, 20, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setTextColor(30, 41, 59);
      doc.text('KUTOARJO', 20, 24, { align: 'center' });
      doc.setFontSize(7.5);
      doc.text('20306060', 20, 29, { align: 'center' });
    }
  } else {
    // Default text/shield simulation
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(220, 38, 38);
    doc.text('SMK', 20, 16, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(2, 132, 199);
    doc.text('PANCASILA 1', 20, 20, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);
    doc.text('KUTOARJO', 20, 24, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('20306060', 20, 29, { align: 'center' });
  }

  // Center/Right text block
  const centerX = (pageWidth + 20) / 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('YAYASAN BINA TANI BAGELEN PURWOREJO', centerX, 12, { align: 'center' });

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('SMK PANCASILA 1 KUTOARJO', centerX, 17, { align: 'center' });

  doc.setFontSize(7.5);
  doc.text('Status Akreditasi : Terakreditasi B', centerX, 21, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Konsentrasi Keahlian : • Teknik Kendaraan Ringan  • Teknik Pemesinan  • Teknik Komputer Jaringan', centerX, 25, { align: 'center' });
  doc.text('• Teknik Pengelasan  • Teknik Sepeda Motor  • Asisten Keperawatan dan Caregiver', centerX, 28, { align: 'center' });

  doc.setFontSize(6);
  doc.setTextColor(51, 65, 85);
  doc.text('Jl. Mayjend. S. Parman, Kel. Bandung, Kec. Kutoarjo, Kab. Purworejo, Jawa Tengah, 54211, Telp/Fax 0275- 641516', centerX, 32, { align: 'center' });
  doc.text('Website : http://www.smkpansa.sch.id; E-mail : smkpancasila1kta@gmail.com', centerX, 35, { align: 'center' });

  // Official double separator line
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.7);
  doc.line(14, 38, pageWidth - 14, 38);
  doc.setLineWidth(0.2);
  doc.line(14, 39, pageWidth - 14, 39);

  // --- JUDUL DOKUMEN ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('FORMULIR REKAPITULASI PENGAJUAN BELANJA', pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70);
  doc.text('PENGADAAN BARANG DAN JASA (PBJ)', pageWidth / 2, 49.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tahun Anggaran ${fiscalYear || '2027'} • Dokumen Verifikasi Keuangan & Sarana Prasarana`, pageWidth / 2, 53.5, { align: 'center' });

  // --- INFORMASI META ---
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  // Left Meta
  doc.setFont('helvetica', 'bold');
  doc.text('Tanggal Dokumen:', 14, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(todayFormatted, 45, 60);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Pengajuan:', 14, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(`${items.length} Item Barang / Jasa`, 45, 65);

  // Right Meta
  doc.setFont('helvetica', 'bold');
  doc.text('Cakupan Cetak:', pageWidth - 80, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(scopeLabel, pageWidth - 55, 60);

  doc.setFont('helvetica', 'bold');
  doc.text('Estimasi Anggaran:', pageWidth - 80, 65);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text(formatRupiah(grandTotal), pageWidth - 55, 65);

  // --- TABEL DATA ---
  const tableData = items.map((item, index) => {
    const nameAndSpec = item.spec ? `${item.itemName}\n(${item.spec})` : item.itemName;
    return [
      String(index + 1),
      item.unit,
      nameAndSpec,
      formatNumber(item.quantity),
      item.unitMeasure,
      formatRupiah(item.unitPrice),
      formatRupiah(item.totalPrice),
      item.status,
    ];
  });

  const totalRow = [
    '',
    'TOTAL KESELURUHAN',
    '',
    formatNumber(totalQty),
    'Item',
    '',
    formatRupiah(grandTotal),
    '',
  ];

  autoTable(doc, {
    startY: 69,
    margin: { left: 14, right: 14, bottom: 42 },
    head: [[
      'No',
      'Divisi Pemohon',
      'Nama Barang / Jasa & Spesifikasi',
      'Qty',
      'Satuan',
      'Harga Satuan',
      'Total Biaya',
      'Status',
    ]],
    body: tableData,
    foot: [totalRow],
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      lineWidth: 0.2,
      lineColor: [203, 213, 225],
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      valign: 'top',
    },
    footStyles: {
      fillColor: [248, 250, 252],
      textColor: [6, 95, 70],
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: 0.3,
      lineColor: [148, 163, 184],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 11, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 23, halign: 'right' },
      6: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 17, halign: 'center' },
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Halaman ${data.pageNumber} / ${doc.getNumberOfPages()}`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
      doc.text('E-Pengadaan PBJ • Dokumen Cetak Otomatis', 14, doc.internal.pageSize.getHeight() - 8);
    },
  });

  // --- BLOK TANDA TANGAN ---
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 180;
  const pageHeight = doc.internal.pageSize.getHeight();

  // If signature block overflows current page, add new page
  if (finalY + 38 > pageHeight) {
    doc.addPage();
  }

  const sigY = finalY + 38 > pageHeight ? 20 : finalY;
  const colWidth = (pageWidth - 28) / 3;

  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');

  // Col 1: Pemohon (Bisa ditulis atau titik-titik jika kosong)
  const col1X = 14 + colWidth * 0.5;
  doc.text('Pemohon / Penanggung Jawab,', col1X, sigY, { align: 'center' });
  if (applicantName && applicantName.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.text(applicantName.trim(), col1X, sigY + 22, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  } else {
    doc.text('( ......................................... )', col1X, sigY + 22, { align: 'center' });
  }
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Ketua Divisi / Ka. Konsen', col1X, sigY + 26, { align: 'center' });

  // Col 2: Sarpras (Brian Wicaksono, M.Pd.)
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const col2X = 14 + colWidth * 1.5;
  doc.text('Verifikasi Sarpras & Pengadaan,', col2X, sigY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Brian Wicaksono, M.Pd.', col2X, sigY + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Wakasek Sarana & Prasarana', col2X, sigY + 26, { align: 'center' });

  // Col 3: Kepala Sekolah (Septi Endah Parwati, M.Pd.)
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const col3X = 14 + colWidth * 2.5;
  doc.text('Menyetujui,', col3X, sigY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Septi Endah Parwati, M.Pd.', col3X, sigY + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Kepala Sekolah', col3X, sigY + 26, { align: 'center' });

  return doc;
}

/**
 * Trigger download of the PDF file
 */
export function downloadProcurementPDF(
  items: ProcurementItem[],
  scopeLabel: string = 'Seluruh Rekapitulasi',
  customLogo?: string | null,
  applicantName?: string,
  fiscalYear: string = '2027',
  customFilename?: string
): void {
  const doc = generateProcurementPDF(items, scopeLabel, customLogo, applicantName, fiscalYear);
  const dateStr = new Date().toISOString().split('T')[0];
  const name = customFilename || `Formulir_Pengadaan_PBJ_${dateStr}.pdf`;
  doc.save(name);
}

/**
 * Open PDF in a new blob window or trigger browser print preview directly
 */
export function printProcurementPDF(
  items: ProcurementItem[],
  scopeLabel: string = 'Seluruh Rekapitulasi',
  customLogo?: string | null,
  applicantName?: string,
  fiscalYear: string = '2027'
): void {
  const doc = generateProcurementPDF(items, scopeLabel, customLogo, applicantName, fiscalYear);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  // Try opening in an iframe and print
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.src = blobUrl;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // If direct iframe print is restricted by browser sandbox, trigger download
      downloadProcurementPDF(items, scopeLabel);
    }
    setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  };
}
