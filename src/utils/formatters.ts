/**
 * Format number to Indonesian Rupiah currency format
 * e.g. 1500000 -> "Rp 1.500.000"
 */
export function formatRupiah(value: number | string | undefined | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return 'Rp 0';
  }
  const numeric = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0 : value;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(numeric);
}

/**
 * Format plain number with thousand separators
 * e.g. 1500000 -> "1.500.000"
 */
export function formatNumber(value: number | string | undefined | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return '0';
  }
  const numeric = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0 : value;
  return new Intl.NumberFormat('id-ID').format(numeric);
}

/**
 * Parse string with potential separators or currency back to number
 */
export function parseRupiah(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  // Clean dots, "Rp", spaces
  const cleaned = value.toString().replace(/[^\d-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format ISO date string (YYYY-MM-DD) to Indonesian readable date
 * e.g. "2026-10-05" -> "05 Okt 2026"
 */
export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const mIdx = parseInt(month, 10) - 1;
    return `${day} ${months[mIdx] || month} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Convert column index (0-based) to Excel letter (A, B, ..., Z, AA, etc.)
 */
export function getExcelColumnLetter(index: number): string {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}
