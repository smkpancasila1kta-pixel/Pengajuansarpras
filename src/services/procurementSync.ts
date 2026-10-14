import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ProcurementItem } from '../types/procurement';

export const ITEMS_COLLECTION = 'procurement_items';
export const SETTINGS_COLLECTION = 'procurement_settings';
export const DEFAULT_SYNC_CODE = 'SMK-PBJ-2027';
export const SYNC_CODE_STORAGE_KEY = 'pbj_sync_pair_code_v1';
export const SYNC_ENABLED_STORAGE_KEY = 'pbj_sync_is_enabled_v1';

export interface ProcurementSettingsSync {
  id: string;
  syncCode: string;
  ownerId?: string;
  fiscalYear: string;
  npsn?: string;
  pemohonName?: string;
  customLogo?: string;
  updatedAt?: string;
}

export function sanitizeProcurementItem(item: ProcurementItem, syncCode: string, ownerId?: string) {
  const normalizedCode = (syncCode || DEFAULT_SYNC_CODE).trim().toUpperCase();
  const clean: Record<string, any> = {
    id: String(item.id),
    syncCode: normalizedCode,
    code: String(item.code || ''),
    date: String(item.date || new Date().toISOString().split('T')[0]),
    unit: String(item.unit || 'Kakonsen TKR'),
    type: item.type === 'Jasa' ? 'Jasa' : 'Barang',
    category: String(item.category || 'Operasional'),
    itemName: String(item.itemName || ''),
    quantity: Math.max(0, Number(item.quantity) || 0),
    unitMeasure: String(item.unitMeasure || 'Pcs'),
    unitPrice: Math.max(0, Number(item.unitPrice) || 0),
    totalPrice: Math.max(0, (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)),
    priority: (['Tinggi', 'Sedang', 'Rendah'].includes(item.priority) ? item.priority : 'Sedang'),
    status: (['Draft', 'Diajukan', 'Disetujui', 'Proses Beli', 'Selesai', 'Ditolak'].includes(item.status) ? item.status : 'Draft'),
  };

  if (ownerId) clean.ownerId = String(ownerId);
  if (item.spec && item.spec.trim()) {
    clean.spec = String(item.spec).slice(0, 1000);
  }
  if (item.notes && item.notes.trim()) {
    clean.notes = String(item.notes).slice(0, 1000);
  }
  if (item.vendor && item.vendor.trim()) {
    clean.vendor = String(item.vendor).slice(0, 256);
  }
  clean.updatedAt = new Date().toISOString();

  return clean;
}

/**
 * Subscribe to real-time changes for items with the specified syncCode (2-device pairing)
 */
export function subscribeToSyncCodeItems(
  syncCode: string,
  onData: (items: ProcurementItem[]) => void,
  onError?: (err: unknown) => void
) {
  const normalizedCode = (syncCode || DEFAULT_SYNC_CODE).trim().toUpperCase();
  const q = query(
    collection(db, ITEMS_COLLECTION),
    where('syncCode', '==', normalizedCode)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const serverItems: ProcurementItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        serverItems.push({
          id: data.id || docSnap.id,
          code: data.code || '',
          date: data.date || '',
          unit: data.unit || 'Kakonsen TKR',
          type: data.type || 'Barang',
          category: data.category || '',
          itemName: data.itemName || '',
          spec: data.spec || '',
          quantity: Number(data.quantity) || 0,
          unitMeasure: data.unitMeasure || 'Pcs',
          unitPrice: Number(data.unitPrice) || 0,
          totalPrice: Number(data.totalPrice) || 0,
          priority: data.priority || 'Sedang',
          status: data.status || 'Draft',
          notes: data.notes || '',
          vendor: data.vendor || '',
        });
      });

      // Sort by date descending then code
      serverItems.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      onData(serverItems);
    },
    (err) => {
      console.error('Firestore items sync error:', err);
      handleFirestoreError(err, OperationType.GET, ITEMS_COLLECTION);
      if (onError) onError(err);
    }
  );
}

/**
 * Save / Update a single procurement item to Firestore
 */
export async function syncSaveItem(item: ProcurementItem, syncCode: string, ownerId?: string) {
  const path = `${ITEMS_COLLECTION}/${item.id}`;
  try {
    const clean = sanitizeProcurementItem(item, syncCode, ownerId);
    await setDoc(doc(db, ITEMS_COLLECTION, item.id), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete a single procurement item permanently from Firestore
 */
export async function syncDeleteItem(itemId: string) {
  const path = `${ITEMS_COLLECTION}/${itemId}`;
  try {
    await deleteDoc(doc(db, ITEMS_COLLECTION, itemId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Delete multiple items permanently from Firestore in batch
 */
export async function syncDeleteMultipleItems(itemIds: string[]) {
  if (!itemIds || itemIds.length === 0) return;
  const path = ITEMS_COLLECTION;
  try {
    const batch = writeBatch(db);
    itemIds.forEach((id) => {
      batch.delete(doc(db, ITEMS_COLLECTION, id));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Push all items (e.g. migration or initial seed to Cloud Firestore)
 */
export async function syncUploadInitialItems(items: ProcurementItem[], syncCode: string, ownerId?: string) {
  if (!items || items.length === 0) return;
  const path = ITEMS_COLLECTION;
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const clean = sanitizeProcurementItem(item, syncCode, ownerId);
      batch.set(doc(db, ITEMS_COLLECTION, item.id), clean);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Subscribe to settings sync (fiscal year, logo, etc.)
 */
export function subscribeToSyncSettings(
  syncCode: string,
  onData: (settings: ProcurementSettingsSync) => void
) {
  const normalizedCode = (syncCode || DEFAULT_SYNC_CODE).trim().toUpperCase();
  return onSnapshot(
    doc(db, SETTINGS_COLLECTION, normalizedCode),
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as ProcurementSettingsSync);
      }
    },
    (err) => {
      console.warn('Error reading settings sync:', err);
    }
  );
}

/**
 * Save user settings to Firestore
 */
export async function syncSaveSettings(
  settings: Partial<ProcurementSettingsSync>,
  syncCode: string,
  ownerId?: string
) {
  const normalizedCode = (syncCode || DEFAULT_SYNC_CODE).trim().toUpperCase();
  const path = `${SETTINGS_COLLECTION}/${normalizedCode}`;
  try {
    const clean: Record<string, any> = {
      id: normalizedCode,
      syncCode: normalizedCode,
      fiscalYear: settings.fiscalYear || '2027',
      updatedAt: new Date().toISOString(),
    };
    if (ownerId) clean.ownerId = ownerId;
    if (settings.npsn) clean.npsn = settings.npsn.slice(0, 32);
    if (settings.pemohonName) clean.pemohonName = settings.pemohonName.slice(0, 128);
    if (settings.customLogo && settings.customLogo.length < 490000) {
      clean.customLogo = settings.customLogo;
    }
    await setDoc(doc(db, SETTINGS_COLLECTION, normalizedCode), clean, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
